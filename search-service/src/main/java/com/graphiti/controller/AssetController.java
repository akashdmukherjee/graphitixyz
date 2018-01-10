package com.graphiti.controller;

import java.io.IOException;
import java.sql.Struct;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.ws.rs.PathParam;

import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrRequest;
import org.apache.solr.client.solrj.SolrRequest.METHOD;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.CloudSolrClient;
import org.apache.solr.client.solrj.impl.HttpSolrClient.RemoteSolrException;
import org.apache.solr.client.solrj.impl.XMLResponseParser;
import org.apache.solr.client.solrj.impl.LBHttpSolrClient.Req;
import org.apache.solr.client.solrj.request.QueryRequest;
import org.apache.solr.client.solrj.request.UpdateRequest;
import org.apache.solr.client.solrj.response.FacetField;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.response.UpdateResponse;
import org.apache.solr.client.solrj.response.FacetField.Count;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrInputDocument;
import org.apache.tomcat.util.descriptor.tld.TldRuleSet.Variable;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.graphiti.Constants;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.Organization;
import com.graphiti.bean.TeamMember;
import com.graphiti.connections.SolrCreationConnection;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.exceptions.OrganizationNotFoundException;
import com.graphiti.exceptions.SOLRAssetDeletionException;
import com.graphiti.exceptions.SOLRAssetInsertionException;
import com.graphiti.exceptions.SOLRAssetUpdateException;
import com.graphiti.externalServices.IdentityService;
import com.mongodb.util.JSON;

@RestController
public class AssetController {
    private final Logger logger = LoggerFactory.getLogger(AssetController.class);
    private final String[] filterParams = {"author_ids", "viewer_ids", "follower_ids", "admin_ids","createdBy_id"};
    private final Properties properties = Constants.getInstance().properties;
    private final String solrUsername = properties.getProperty("solr-username");
    private final String solrPassword = properties.getProperty("solr-password");
    private final int MAX_SOLR_ROWS_LIMIT = 1000000;

    private Organization getOrganization(String graphiti_tid, String orgId) {
        IdentityService identityService = new IdentityService();
        logger.info("graphiti_tid:{}. Getting Organization with orgId:{}", graphiti_tid, orgId);
        Organization organization = identityService.getOrganization(graphiti_tid, orgId);
        if (organization == null) {
            logger.error("graphiti_tid:{}. Organization not found with orgId:{}", graphiti_tid, orgId);
            throw new OrganizationNotFoundException("Organization does not exist.");
        }
        return organization;
    }

    private String getFilterQuery(List<String> elements,String operator) {
        String filterQueries = "";
        int numberOfParams = filterParams.length;
        for (int i = 0; i < numberOfParams; ++i) {
            filterQueries += filterParams[i] + ":(" + String.join(" "+operator+" ", elements) + ")";
            if (i != numberOfParams - 1) {
                filterQueries += " "+operator+" ";
            }
        }
        return filterQueries;
    }
    
    private String getFilterQueryForASpecificParam(String paramName, List<String> elements,String operator) {
        String filterQueries = paramName + ":(" + String.join(" "+operator+" ", elements) + ")";
        return filterQueries;
    }
    
    private String getFilterQueryForASpecificParamWithSingleSearchElement(String paramName, String element) {
    	String filterQueries = paramName + ":(" + element + ")";
        return filterQueries;
    }

    private void setPermissions(SolrInputDocument document, String fieldName, List<AssetUsersInfo> fieldValues) {
        List<String> permissionIds = new ArrayList<String>();
        List<String> permissionNames = new ArrayList<String>();
        AssetUsersInfo userDetail;
        Map<String, List<String>> fieldIdsModifier = new HashMap<>(1);
        Map<String, List<String>> fieldNamesModifier = new HashMap<>(1);
        if(fieldValues!=null && fieldValues.size()>0){
	        for (int i = 0; i < fieldValues.size(); ++i) {
	            userDetail = fieldValues.get(i);
	            permissionIds.add(userDetail.getId());
	            permissionNames.add(userDetail.getName());
	        }
        }
        String fieldIds = fieldName + "_ids";
        String fieldNames = fieldName + "_names";
        fieldIdsModifier.put("set", permissionIds);
        document.addField(fieldIds, fieldIdsModifier);
        fieldNamesModifier.put("set", permissionNames);
        document.addField(fieldNames, fieldNamesModifier);
    }

    private void setPermissions(SolrInputDocument document, String fieldName, String fieldValue) {
        Map<String, Object> fieldModifier = new HashMap<>(1);
        fieldModifier.put("set", fieldValue);
        document.addField(fieldName, fieldModifier);
    }

    private void setPermissions(SolrInputDocument document, String fieldName, JSONArray fieldValues) {
        List<String> permissionIds = new ArrayList<String>();
        List<String> permissionNames = new ArrayList<String>();
        JSONObject userDetail;
        for (int i = 0; i < fieldValues.size(); ++i) {
            userDetail = (JSONObject) fieldValues.get(i);
            permissionIds.add((String) userDetail.get("id"));
            permissionNames.add((String) userDetail.get("name"));
        }
        document.setField(fieldName + "_ids", permissionIds);
        document.setField(fieldName + "_names", permissionNames);
    }

    private List<String> getMemberTeams(String graphiti_tid, String memberId,String orgId) {
        IdentityService identityService = new IdentityService();
        List<String> teams = new ArrayList<String>();
        logger.info("graphiti_tid:{}. Getting all teams associated with memberId:{}", graphiti_tid, memberId);
        JSONArray memberTeams = identityService.getTeams(graphiti_tid, memberId,orgId);
        logger.info("graphiti_tid:{}. Teams:{} associated with memberId:{}", graphiti_tid, memberTeams, memberId);
        if (memberTeams != null) {
            JSONObject team;
            int numberOfTeams = memberTeams.size();
            for (Object memberTeam : memberTeams) {
                team = (JSONObject) memberTeam;
                teams.add((String) team.get("id"));
            }
        }
        teams.add(memberId);
        return teams;
    }
    
    @RequestMapping(value = "/health", method = RequestMethod.GET)
	public ResponseEntity<String> testConnection(){
    	return new ResponseEntity<>("OK",HttpStatus.OK);
	}

    @RequestMapping(value = "/search/asset", method = RequestMethod.POST, consumes = "application/json")
    public ResponseEntity<?> addAsset(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                      @RequestHeader(value = "memberId", required = true) String memberId,
                                      @RequestBody Asset assetInformation) {
        try {
            logger.info("graphiti-tid:{}. Inserting asset:{} with username:{}, password:{}", graphiti_tid, assetInformation, solrUsername, solrPassword);
            String orgId = assetInformation.getOrgId();
            Organization organization = this.getOrganization(graphiti_tid, orgId);
            SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            long currentTimeInSec = Instant.now().getEpochSecond();
            assetInformation.setLastModifiedTimestamp(currentTimeInSec);
            assetInformation.setCreatedTimestamp(currentTimeInSec);
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> assetInformationMap = objectMapper.convertValue(assetInformation, Map.class);
            SolrInputDocument solrInputDocument = new SolrInputDocument();
            for (String key : assetInformationMap.keySet()) {
                if (assetInformationMap.get(key) != null) {
                    solrInputDocument.addField(key, assetInformationMap.get(key));
                }
            }
            UpdateRequest solrUpdateRequest = new UpdateRequest("/update");
            solrUpdateRequest.setBasicAuthCredentials(solrUsername, solrPassword);
            solrUpdateRequest.add(solrInputDocument);
            UpdateResponse updateResponseOnAddingDocument = solrUpdateRequest.process(connection);
            connection.commit();
            connectionPool.checkIn(orgId, connection);
            if (updateResponseOnAddingDocument.getStatus() != 0) { // It means that the request was unsuccessful
                logger.error("graphiti-tid:{}. Error while inserting document into SOLR. Response Code of Adding Document:{}.", graphiti_tid, updateResponseOnAddingDocument.getStatus());
                throw new SOLRAssetInsertionException("Error while inserting document into SOLR");
            }
        } catch (SolrServerException e) {
            logger.error("graphiti_tid:{}. Error adding data to SOLR", graphiti_tid);
            throw new SOLRAssetInsertionException("Unable to insert document in SOLR");
        } catch (IOException e) {
            logger.error("graphiti_tid:{}. SOLR Connection error. Unable to commit. {}", graphiti_tid, e.getMessage());
            throw new SOLRAssetInsertionException("Unable to commit connection.");
        }
        return new ResponseEntity<String>("Asset added.", HttpStatus.CREATED);
    }

    @RequestMapping(value = "/search/asset", method = RequestMethod.PUT, consumes = "application/json")
    public ResponseEntity<?> updateAsset(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                         @RequestHeader(value = "memberId", required = true) String memberId,
                                         @RequestHeader(value = "commaSeparatedFieldsToUpdateExplicilty", required = true) String commaSeparatedFieldsToUpdateExplicilty,
                                         @RequestBody Asset assetInformation) {
        try {
        	String[] arrayOfFieldsToUpdateExplicitly = null;
        	Set<String> setOfFieldsToUpdateExplicitly = null;
        	if(commaSeparatedFieldsToUpdateExplicilty!=null){
        		arrayOfFieldsToUpdateExplicitly = commaSeparatedFieldsToUpdateExplicilty.split(",");
        		setOfFieldsToUpdateExplicitly = new HashSet<String>(Arrays.asList(arrayOfFieldsToUpdateExplicitly));
        	}
            String orgId = assetInformation.getOrgId();
            Organization organization = this.getOrganization(graphiti_tid, orgId);
            SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            long currentTimeInSec = Instant.now().getEpochSecond();
            assetInformation.setLastModifiedTimestamp(currentTimeInSec);
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> assetInformationMap = objectMapper.convertValue(assetInformation, Map.class);
            SolrInputDocument solrInputDocument = new SolrInputDocument();
            Object assetObject;
            Map<String, Object> fieldModifier;
            for (String key : assetInformationMap.keySet()) {
                assetObject = assetInformationMap.get(key);
                if (key.equalsIgnoreCase("assetId")) {
                    solrInputDocument.setField(key, assetInformation.getAssetId());
                }
                if ((assetObject != null || setOfFieldsToUpdateExplicitly.contains(key)) && !key.equalsIgnoreCase("assetId") && !key.equalsIgnoreCase("createdTimestamp")) { // Don't update createdTimestamp
                    fieldModifier = new HashMap<>(1);
                    fieldModifier.put("set", assetObject);
                    solrInputDocument.addField(key, fieldModifier);
                }
            }
            UpdateRequest solrUpdateRequest = new UpdateRequest("/update");
            solrUpdateRequest.setBasicAuthCredentials(solrUsername, solrPassword);
            solrUpdateRequest.add(solrInputDocument);
            UpdateResponse updateResponseOnAddingDocument = solrUpdateRequest.process(connection);
            connection.commit();
            connectionPool.checkIn(orgId, connection);
            if (updateResponseOnAddingDocument.getStatus() != 0) { // It means that the request was unsuccessful
                logger.error("graphiti-tid:{}. Error while updating document into SOLR. Response Code of Updating Document:{}.", graphiti_tid, updateResponseOnAddingDocument.getStatus());
                throw new SOLRAssetInsertionException("Error while updating document into SOLR");
            }
        } catch (SolrServerException e) {
            logger.error("graphiti_tid:{}. Error update on SOLR", graphiti_tid);
            throw new SOLRAssetInsertionException("Unable to update document in SOLR");
        } catch (IOException e) {
            logger.error("graphiti_tid:{}. SOLR Connection error. Unable to commit. {}", graphiti_tid, e.getMessage());
            throw new SOLRAssetInsertionException("Unable to commit connection.");
        }
        return new ResponseEntity<String>("Asset updated.", HttpStatus.NO_CONTENT);
    }

    @RequestMapping(value = "/search/asset/{assetId}/permissions", method = RequestMethod.PUT)
    public ResponseEntity<?> updateAssetPermissions(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                                    @RequestHeader(value = "memberId", required = true) String memberId,
                                                    @PathVariable("assetId") String assetId,
                                                    @RequestBody String assetPermissionsDetailedInformationInString) {
        try {

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            objectMapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false);
            objectMapper.configure(DeserializationFeature.FAIL_ON_IGNORED_PROPERTIES, false);
            objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
            AssetDetailedInformation assetPermissionsDetailedInformation = (AssetDetailedInformation) objectMapper
                    .readValue(assetPermissionsDetailedInformationInString, AssetDetailedInformation.class);
            String orgId = assetPermissionsDetailedInformation.getOrgId();
            Organization organization = this.getOrganization(graphiti_tid, orgId);
            logger.info("graphiti_tid:{}. Getting a connection instance from SOLRConnectionPool with orgId:{}",
                    graphiti_tid, orgId);
            SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            SolrInputDocument inputDocument = new SolrInputDocument();

            if (assetPermissionsDetailedInformation.getAdmins() != null) {
                setPermissions(inputDocument, "admin", assetPermissionsDetailedInformation.getAdmins());	
            }
            if (assetPermissionsDetailedInformation.getAuthors() != null) {
            	setPermissions(inputDocument, "author", assetPermissionsDetailedInformation.getAuthors());
            }
            if (assetPermissionsDetailedInformation.getViewers() != null) {
            	setPermissions(inputDocument, "viewer", assetPermissionsDetailedInformation.getViewers());
            }

            inputDocument.setField("assetId", assetId);
            setPermissions(inputDocument, "lastModifiedBy_id", assetPermissionsDetailedInformation.getMemberId());
            setPermissions(inputDocument, "lastModifiedBy_name", assetPermissionsDetailedInformation.getMemberName());
            UpdateRequest assetPermissionsUpdateRequest = new UpdateRequest();
            assetPermissionsUpdateRequest.setBasicAuthCredentials(solrUsername, solrPassword);
            assetPermissionsUpdateRequest.add(inputDocument);
            UpdateResponse responseOnUpdate = assetPermissionsUpdateRequest.process(connection);
            connection.commit();
            connectionPool.checkIn(orgId, connection);
            if (responseOnUpdate.getStatus() != 0) { // It means that the request was unsuccessful
                logger.error("graphiti-tid:{}. Error while updating document into SOLR. Response Code of Updating Document:{}", graphiti_tid, responseOnUpdate.getStatus());
                throw new SOLRAssetUpdateException("Error while updating document into SOLR");
            } else {
                logger.info("graphiti-tid:{}. Asset updated successfully on SOLR with assetId:{}", assetId);
            }
        } catch (JsonParseException | JsonMappingException e) {
            logger.error("graphiti_tid:{}. Error parsing request body.", graphiti_tid);
            throw new JSONParseException("Unable to parse body.");
        } catch (SolrServerException e) {
            logger.error("graphiti_tid:{}. Error update on SOLR", graphiti_tid);
            throw new SOLRAssetInsertionException("Unable to update document in SOLR");
        } catch (IOException e) {
            logger.error("graphiti_tid:{}. SOLR Connection error. Unable to commit. {}", graphiti_tid, e.getMessage());
            throw new SOLRAssetInsertionException("Unable to commit connection.");
        }
        return new ResponseEntity<Object>(null, HttpStatus.NO_CONTENT);
    }


    @RequestMapping(value = "/search/asset", method = RequestMethod.GET, produces = "application/json")
    public ResponseEntity<?> searchAssets(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                          @RequestHeader(value = "memberId", required = true) String memberId,
                                          @RequestHeader(value = "orgId", required = true) String orgId,
                                          @RequestParam(value = "authors", required = false) String authors,
                                          @RequestParam(value = "tags", required = false) String tags,
                                          @RequestParam(value = "query", required = false) String query,
                                          @RequestParam(value = "sortBy", required = false) String sortBy,
                                          @RequestParam(value = "getMyFavorites", required=false,defaultValue = "false")boolean getMyFavorites) {
        try {
            String queries = null;
            if(query!=null){
            	queries = String.join(" OR ", query.split(" "));
            	logger.info("graphiti-tid:{}. Searching assets with queries:{}", graphiti_tid, queries);
            }
            logger.info("graphiti_tid:{}. Getting Organization with orgId:{}", graphiti_tid, orgId);
            Organization organization = this.getOrganization(graphiti_tid, orgId);
            logger.info("graphiti_tid:{}. Getting a connection instance from SOLRConnectionPool with orgId:{}",
                    graphiti_tid, orgId);
            // Need to filter assets on orgId
            String filterQueryForOrg = "orgId:" + orgId;
            SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            connection.setParser(new XMLResponseParser());
            SolrQuery solrQueryParameters = new SolrQuery();
            if(queries!=null){
            	solrQueryParameters.set("q", queries);
            }
            else{
            	solrQueryParameters.set("q", "*:*");
            }
            solrQueryParameters.set("qt", "/select");
            solrQueryParameters.setFacet(true);
            solrQueryParameters.set("facet.field", "assetType");
            solrQueryParameters.set("start", 0);
            solrQueryParameters.set("rows", MAX_SOLR_ROWS_LIMIT);
            solrQueryParameters.set("collection", organization.getSearchCollectionName());
            if(sortBy!=null){
            	solrQueryParameters.set("sort",sortBy+" DESC");
            }
            else{
            	solrQueryParameters.set("sort","discoverabilityScore"+" DESC");
            }
            String filterQueries;
            String filterQueriesForTags="";
            String filterQueryForFavorites="";
            
            if (authors != null) {
            	filterQueries = getFilterQuery(new ArrayList<String>(Arrays.asList(authors.split(","))),"OR");
            } else {
            	filterQueries = getFilterQuery(getMemberTeams(graphiti_tid, memberId,orgId),"OR");
            }
            if(tags != null) {
            	filterQueriesForTags =  getFilterQueryForASpecificParam("tags",new ArrayList<String>(Arrays.asList(tags.split(","))),"AND");
            }
            if(getMyFavorites==true){
            	filterQueryForFavorites = getFilterQueryForASpecificParamWithSingleSearchElement("is_favorited_ids",memberId);
            }
            // query is constructed as:
            // (author_ids:(tom OR jerry) OR viewer_ids:(tom OR jerry)) AND (tags:(tag-1 AND tag-2)) AND orgId:organization_id
            if(filterQueriesForTags.length()>0){
            	filterQueries = "(" + filterQueries + ") AND (" +filterQueriesForTags+") AND "+ filterQueryForOrg;
            }
            else if(filterQueryForFavorites.length()>0){
            	filterQueries = "(" + filterQueryForFavorites + ") AND (" +filterQueries+") AND "+ filterQueryForOrg;
            }
            else {
            	filterQueries = "(" + filterQueries + ") AND " + filterQueryForOrg;
            }
            
            logger.info("graphiti-tid:{}. Using filterQueries: {}", graphiti_tid, filterQueries);
            
            solrQueryParameters.set("fq", filterQueries);
            SolrRequest<QueryResponse> solrRequest = new QueryRequest(solrQueryParameters);
            solrRequest.setBasicAuthCredentials(solrUsername, solrPassword);
            QueryResponse queryResponse = solrRequest.process(connection);
            JSONObject responseJSONObject = new JSONObject();
            // get assets from solr
            SolrDocumentList assetResultsList = queryResponse.getResults();
            JSONArray resultJSONArray = new JSONArray();
            for (int i = 0; i < assetResultsList.size(); ++i) {
                JSONObject jsonObject = new JSONObject(assetResultsList.get(i));
                resultJSONArray.add(jsonObject);
            }
            responseJSONObject.put("assets", resultJSONArray);
            // get facet counts
            List<FacetField> facetResultsList = queryResponse.getFacetFields();
            JSONObject facetResultJsonObject = new JSONObject();
            FacetField facetField;
            for (int i = 0; i < facetResultsList.size(); ++i) {
                facetField = facetResultsList.get(i);
                List<Count> facetCounts = facetField.getValues();
                for (Count facetCount : facetCounts) {
                    facetResultJsonObject.put(facetCount.getName(), facetCount.getCount());
                }
            }
            responseJSONObject.put("facet_counts", facetResultJsonObject);
            connectionPool.checkIn(orgId, connection);
            return new ResponseEntity<JSONObject>(responseJSONObject, HttpStatus.OK);
        } catch (RemoteSolrException e) {
            logger.error("graphiti-tid:{}. Remote Solr Exception occurred. Check solr credentials or fields. Error Message:{}", graphiti_tid, e.getMessage());
        } catch (Exception e) {
            logger.error("graphiti_tid:{}. Exception occurred. {}", graphiti_tid, e.getMessage());
        }
        return new ResponseEntity<String>("", HttpStatus.OK);
    }
    
    @RequestMapping(value = "/ext/search/asset", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extsearchAssets(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
            @RequestParam(value = "authors", required = false) String authors,
            @RequestParam(value = "tags", required = false) String tags,
			@RequestParam("query") String query,
            @RequestParam(value = "sortBy", required = false) String sortBy,
            @RequestParam(value = "getMyFavorites", required=false,defaultValue = "false")boolean getMyFavorites) {
    		return searchAssets(graphiti_tid,memberId,orgId,authors,tags,query,sortBy,getMyFavorites);
	}

    @RequestMapping(value = "/search/asset/tags", method = RequestMethod.GET, produces = "application/json")
    public ResponseEntity<?> getAllTagsForOrg(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                              @RequestHeader(value = "memberId", required = true) String memberId,
                                              @RequestHeader(value = "orgId", required = true) String orgId) {
        try {
            IdentityService identityService = new IdentityService();
            logger.info("graphiti_tid:{}. Getting Organization with orgId:{}", graphiti_tid, orgId);
            Organization organization = this.getOrganization(graphiti_tid, orgId);
            logger.info("graphiti_tid:{}. Getting a connection instance from SOLRConnectionPool with orgId:{}",
                    graphiti_tid, orgId);
            // Need to filter assets on orgId
            String filterQueryForOrg = "orgId:" + orgId;
            String filterQueries = "("+getFilterQuery(getMemberTeams(graphiti_tid, memberId,orgId),"OR")+") AND "+filterQueryForOrg;
            SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            connection.setParser(new XMLResponseParser());
            SolrQuery solrQueryParameters = new SolrQuery();
            solrQueryParameters.set("q", "*:*");
            solrQueryParameters.set("qt", "/select");
            solrQueryParameters.set("collection", organization.getSearchCollectionName());
            solrQueryParameters.set("fq", filterQueries);
            solrQueryParameters.set("start", 0);
            solrQueryParameters.set("rows", MAX_SOLR_ROWS_LIMIT);
            solrQueryParameters.set("fl", "tags");
            SolrRequest<QueryResponse> solrRequest = new QueryRequest(solrQueryParameters);
            solrRequest.setBasicAuthCredentials(solrUsername, solrPassword);
            QueryResponse queryResponse = solrRequest.process(connection);
            JSONObject responseJSONObject = new JSONObject();
            // get assets from solr
            SolrDocumentList assetResultsList = queryResponse.getResults();
            Set<String> tags = new HashSet<>();
            for (int i = 0; i < assetResultsList.size(); ++i) {
            	Object assetTags = assetResultsList.get(i).get("tags");
            	if (assetTags instanceof String){
            		tags.add((String) assetTags);
            	}
            	else{
	                ArrayList<String> tagsArray = (ArrayList<String>) assetTags;
	                if (tagsArray != null) {
	                    for (String tag : tagsArray) {
	                        tags.add(tag.trim());
	                    }
	                }
            	}
            }
            responseJSONObject.put("tags", tags);
            connectionPool.checkIn(orgId, connection);
            return new ResponseEntity<JSONObject>(responseJSONObject, HttpStatus.OK);
        } catch (RemoteSolrException e) {
            logger.error("graphiti-tid:{}. Remote Solr Exception occurred. Check solr credentials or fields. Error Message:{}", graphiti_tid, e.getMessage());
        } catch (Exception e) {
            logger.error("graphiti_tid:{}. Exception occurred. {}", graphiti_tid, e.getMessage());
        }
        return new ResponseEntity<String>("", HttpStatus.OK);
    }

    @RequestMapping(value = "/ext/search/asset/tags", method = RequestMethod.GET, produces = "application/json")
    public ResponseEntity<?> extgetAllTagsForOrg(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                              @RequestHeader(value = "memberId", required = true) String memberId,
                                              @RequestHeader(value = "orgId", required = true) String orgId) {
    	return getAllTagsForOrg(graphiti_tid,memberId,orgId);
    }
    
    @RequestMapping(value = "/search/asset/autocomplete", method = RequestMethod.GET)
    public ResponseEntity<?> getAutocompletion(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                               @RequestHeader(value = "memberId", required = true) String memberId,
                                               @RequestHeader(value = "orgId", required = true) String orgId,
                                               @RequestParam(value = "query", required = true) String query) {
        try {
            logger.info("graphiti_tid:{}. Getting Organization with orgId:{}", graphiti_tid, orgId);
            Organization organization = this.getOrganization(graphiti_tid, orgId);
            logger.info("graphiti_tid:{}. Getting a connection instance from SOLRConnectionPool with orgId:{}",
                    graphiti_tid, orgId);
            // Need to filter assets on orgId
            String filterQueryForOrg = "orgId:" + orgId;
            String filterQueries = "("+getFilterQuery(getMemberTeams(graphiti_tid, memberId,orgId),"OR")+") AND "+filterQueryForOrg;
            String fieldList = (String) properties.get("solr-autocomplete-fields");
            int solrAutocompleteRowsLimit = Integer.parseInt(properties.get("solr-autocomplete-rows-limit").toString());
            SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            connection.setParser(new XMLResponseParser());
            SolrQuery solrQueryParameters = new SolrQuery();
            solrQueryParameters.set("q", query);
            solrQueryParameters.set("qt", "/select");
            solrQueryParameters.set("collection", organization.getSearchCollectionName());
            solrQueryParameters.set("start", 0);
            solrQueryParameters.set("rows", solrAutocompleteRowsLimit);
            solrQueryParameters.set("fq", filterQueries);
            solrQueryParameters.set("fl", fieldList);
            SolrRequest<QueryResponse> solrRequest = new QueryRequest(solrQueryParameters);
            logger.info("{} {}", query, solrQueryParameters);
            solrRequest.setBasicAuthCredentials(solrUsername, solrPassword);
            QueryResponse queryResponse = solrRequest.process(connection);
            SolrDocumentList assetResultsList = queryResponse.getResults();
            connectionPool.checkIn(orgId, connection);
            return new ResponseEntity<SolrDocumentList>(assetResultsList, HttpStatus.OK);
        } catch (RemoteSolrException e) {
            logger.error("graphiti-tid:{}. Remote Solr Exception occurred. Check solr credentials or fields. Error Message:{}", graphiti_tid, e.getMessage());
        } catch (Exception e) {
//        	e.printStackTrace();
            logger.error("graphiti_tid:{}. Exception occurred. {}", graphiti_tid, e.getMessage());
        }
        return new ResponseEntity<String>("", HttpStatus.OK);
    }
    
    @RequestMapping(value = "/ext/search/asset/autocomplete", method = RequestMethod.GET)
    public ResponseEntity<?> extgetAutocompletion(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
                                               @RequestHeader(value = "memberId", required = true) String memberId,
                                               @RequestHeader(value = "orgId", required = true) String orgId,
                                               @RequestParam(value = "query", required = true) String query) {
    	return getAutocompletion(graphiti_tid,memberId,orgId,query);
    }
    @RequestMapping(value = "/search/assets", method = RequestMethod.DELETE)
    public ResponseEntity<?> deleteAssets(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
    									 @RequestHeader(value = "memberId", required = true) String memberId,
    									 @RequestHeader(value = "orgId", required = true) String orgId,
    									 @RequestBody(required = true)String commaSeparatedListOfAssetIdToDelete){
    	try {
    		logger.info("graphiti_tid:{}. Request to delete asset information for Ids:{}", graphiti_tid, commaSeparatedListOfAssetIdToDelete);
    		Organization organization = this.getOrganization(graphiti_tid, orgId);
    		SolrCreationConnection connectionPool = SolrCreationConnection.getInstance(organization.getSearchCollectionName());
            CloudSolrClient connection = connectionPool.checkOut(orgId);
            String[] arrayOfAssetId = commaSeparatedListOfAssetIdToDelete.split(",");
            List<String> listOfAssetId = new ArrayList<String>(Arrays.asList(arrayOfAssetId));
            UpdateResponse deleteResponse = connection.deleteById(listOfAssetId);
            connection.commit();
            connectionPool.checkIn(orgId, connection);
            if (deleteResponse.getStatus() != 0) { // It means that the delete request was unsuccessful
                logger.error("graphiti-tid:{}. Error while deleting document - SOLR.Message Response:{}. Status:{}",graphiti_tid,deleteResponse.getResponse(),deleteResponse.getStatus());
                throw new SOLRAssetDeletionException("Error while updating document into SOLR");
            } else {
                logger.info("graphiti-tid:{}. Asset updated successfully on SOLR for assets with Id:{}",graphiti_tid,commaSeparatedListOfAssetIdToDelete);
            }
            return new ResponseEntity<>(null, HttpStatus.OK);
    	}
    	catch(Exception e){
    		logger.error("graphiti-tid:{}. Error while deleting document - SOLR.Message recieved:{}.Stack Trace:{}",graphiti_tid,e.getMessage(),e.getStackTrace());
    		throw new SOLRAssetDeletionException("Error while updating document into SOLR");
    	}
    }
}
