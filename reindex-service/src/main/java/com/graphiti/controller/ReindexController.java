package com.graphiti.controller;

import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.CloudSolrClient;
import org.apache.solr.client.solrj.request.UpdateRequest;
import org.apache.solr.client.solrj.response.UpdateResponse;
import org.apache.solr.common.SolrInputDocument;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.util.IOUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;
import com.graphiti.repository.Repo;

@RestController
public class ReindexController {
	
	// Logger
	Logger logger = LoggerFactory.getLogger(ReindexController.class);
	
	@Autowired
	Repo repository;
	
	@Autowired
	Environment env;
	
	private static String REGEX_FOR_TABLE_PLACEHOLDER = "(?<=\\[\\[).+?(?=\\]\\])";
	
	@RequestMapping(value="/admin/reindex",method=RequestMethod.POST,consumes="application/json")
	public void reindexData(@RequestBody String organizationIdInJSON) throws ParseException, SolrServerException{
		SimpleDateFormat simpleDateFormat = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss");
		Date date = new Date();
		String dateInString = simpleDateFormat.format(date);
		logger.info("*******************Starting ReIndex On:{}***********************",dateInString);
		JSONParser jsonParser = new JSONParser();
		JSONObject jsonObject = (JSONObject) jsonParser.parse(organizationIdInJSON);
		String[] arrayOfCollectionNames;
		// If organizationIds is not null and all
		if(jsonObject.get("organizationIds")!=null && !((String) jsonObject.get("organizationIds")).equalsIgnoreCase("all")){
			// Comma Separated so split;
			logger.info("Reindex will be done for these orgs only:{}",(String) jsonObject.get("organizationIds"));
			arrayOfCollectionNames = ((String) jsonObject.get("organizationIds")).split(",");
		}
		else{
			logger.info("Reindex will be done for all orgs");
			arrayOfCollectionNames = null;
		}
		String zookeperServerURL = env.getProperty("zookeeper-hostnames");
		String solrUsername = env.getProperty("solr-username");
		String solrPassword = env.getProperty("solr-password");
		// Step 1 : Get list of interested organizations
		logger.info("Getting details of interested organizations");
		Map<String,Organization> mapOfOrganizationNamesAndOrganizationObject = repository.getMapOfOrganizationAndCorrespondingOrgObject(arrayOfCollectionNames);
		// Step 1.1 - For Loop to get all the AssetUsers for this organization
		for(String organizationId : mapOfOrganizationNamesAndOrganizationObject.keySet()){
			// We will be resetting this counter for every organization
			int counter = 0;
			List<SolrInputDocument> listOfSOLRInputDocuments = new ArrayList<SolrInputDocument>();
			// Now for every asset we need to make a call to store in Search
			CloudSolrClient client = new CloudSolrClient.Builder().withZkHost(zookeperServerURL).build();
			client.setDefaultCollection(mapOfOrganizationNamesAndOrganizationObject.get(organizationId).getSearchCollectionName());
			logger.info("Getting Asset Information for Org with Id:{}",organizationId);
			List<AssetUsers> assetUsers = repository.getAssetUsersForASpecificOrg(organizationId);
			// Step 1.2
			for(AssetUsers assetUser : assetUsers){
				logger.info("Working on Asset with Id:{}",assetUser.getId());
				try{
					Asset assetToUpdate = new Asset();
					assetToUpdate.setAssetId(assetUser.getId()); // Id
					assetToUpdate.setAssetName(assetUser.getName()); // Name
					assetToUpdate.setAssetType(assetUser.getAssetType().getValue());
					if(assetUser.getTags()!=null && assetUser.getTags().size()>0){ // Tags
						String[] arrayOfTags = new String[assetUser.getTags().size()];
						arrayOfTags = assetUser.getTags().toArray(arrayOfTags);
						assetToUpdate.setTags(arrayOfTags);
					}
					if(assetUser.getAuthors()!=null && assetUser.getAuthors().size()>0){ // Authors
						String[] authorIds = new String[assetUser.getAuthors().size()];
						String[] authorNames = new String[assetUser.getAuthors().size()];
						int i=0;
						for(AssetUsersInfo assetUserInfo : assetUser.getAuthors()){
							authorIds[i] = assetUserInfo.getId();
							authorNames[i] = assetUserInfo.getName();
						}
						assetToUpdate.setAuthor_ids(authorIds);
						assetToUpdate.setAuthor_names(authorNames);
					}
					if(assetUser.getViewers()!=null && assetUser.getViewers().size()>0){ // Viewers
						String[] viewerIds = new String[assetUser.getViewers().size()];
						String[] viewerNames = new String[assetUser.getViewers().size()];
						int i=0;
						for(AssetUsersInfo assetUserInfo : assetUser.getViewers()){
							viewerIds[i] = assetUserInfo.getId();
							viewerNames[i] = assetUserInfo.getName();
						}
						assetToUpdate.setViewer_ids(viewerIds);
						assetToUpdate.setViewer_names(viewerNames);
					}
					if(assetUser.getAdmins()!=null && assetUser.getAdmins().size()>0){ // Admins
						String[] adminIds = new String[assetUser.getAdmins().size()];
						String[] adminNames = new String[assetUser.getAdmins().size()];
						int i=0;
						for(AssetUsersInfo assetUserInfo : assetUser.getAdmins()){
							adminIds[i] = assetUserInfo.getId();
							adminNames[i] = assetUserInfo.getName();
						}
						assetToUpdate.setAdmin_ids(adminIds);
						assetToUpdate.setAdmin_names(adminNames);
					}
					if(assetUser.getFollowers()!=null && assetUser.getFollowers().size()>0){ // Followers
						String[] followerIds = new String[assetUser.getFollowers().size()];
						String[] followerNames = new String[assetUser.getFollowers().size()];
						int i=0;
						for(AssetUsersInfo assetUserInfo : assetUser.getFollowers()){
							followerIds[i] = assetUserInfo.getId();
							followerNames[i] = assetUserInfo.getName();
						}
						assetToUpdate.setFollower_ids(followerIds);
						assetToUpdate.setFollower_names(followerNames);
					}
					// Creator Info and timestamp
					if(assetUser.getCreator()!=null){  // Creator
						assetToUpdate.setCreatedBy_id(assetUser.getCreator().getId()); // Creator Id
						assetToUpdate.setCreatedBy_name(assetUser.getCreator().getName()); // Creator Name
					}
					assetToUpdate.setCreatedTimestamp(assetUser.getCreatedEpochTime());
					// Last Modified Info and timestamp
					if(assetUser.getLastModifiedBy()!=null){ 
						assetToUpdate.setLastModifiedBy_id(assetUser.getLastModifiedBy().getId());
						assetToUpdate.setLastModifiedBy_name(assetUser.getLastModifiedBy().getName());
					}
					assetToUpdate.setLastModifiedTimestamp(assetUser.getLastModifiedEpochTime());
					assetToUpdate.setOrgId(assetUser.getOrgId()); // orgId
					assetToUpdate.setAsset_description(assetUser.getAsset_description()); // description
					// Now check the type of the asset and take corresponding action
					if(assetUser.getAssetType().equals(AssetType.DATASET)){
						// Get corresponding Data Asset Record
						DataSet dataAsset = repository.getDataAsset(assetUser.getId(),assetUser.getOrgId());
						if(dataAsset == null){
							continue;
						}
						if(dataAsset!=null){
							if(dataAsset.getColumnNamesInCache()!=null){
								String[] columnNamesInCache = new String[dataAsset.getColumnNamesInCache().size()];
								columnNamesInCache = dataAsset.getColumnNamesInCache().toArray(columnNamesInCache);
								assetToUpdate.setDataColumns(columnNamesInCache);
							}
						}
					}
					else if(assetUser.getAssetType().equals(AssetType.SQL)){
						// Get corresponding SQL asset Record
						SQLAsset sqlAsset = repository.getSQLAsset(assetUser.getId(),assetUser.getOrgId());
						if(sqlAsset == null) {
							continue;
						}
						// Read the data from S3 and then we have to add it to content
						String awsAccessKeyId = env.getProperty("aws_access_key_id");
						String awsSecretAccessKey = env.getProperty("aws_secret_access_key");
						BasicAWSCredentials credentials = new BasicAWSCredentials(awsAccessKeyId, awsSecretAccessKey);
						AmazonS3 s3client = AmazonS3ClientBuilder.standard()
											.withRegion(Regions.US_WEST_2)
											.withCredentials(new AWSStaticCredentialsProvider(credentials)).build();
						// In this case we have to find the key
						String linkOfS3 = sqlAsset.getLinkOfS3();
						String key = linkOfS3.substring(linkOfS3.lastIndexOf("/"+env.getProperty("path-sql-s3")+"/")+1);
						S3Object s3object = s3client.getObject(new GetObjectRequest(
								mapOfOrganizationNamesAndOrganizationObject.get(organizationId).getS3BucketName(), key));
						InputStream stream = s3object.getObjectContent();
				    	String sqlContent = IOUtils.toString(stream);
				    	// First lets search for placeHolders which match the specific pattern
						ArrayList<String> listOfTableNames = new ArrayList<String>();
						Pattern REGEX = Pattern.compile(REGEX_FOR_TABLE_PLACEHOLDER);
				    	Matcher matcher = REGEX.matcher(sqlContent);
				    	while(matcher.find()){
				    		// Add the table names 
				    		listOfTableNames.add(matcher.group());
				    	}
				    	// In this case we have to replace 
				    	// the table names with their actual asset name so that we can index that
				    	String replacedTableNamesWithAssetNamesSQLContent = null;
				    	if(listOfTableNames.size()>0){ 
				    		replacedTableNamesWithAssetNamesSQLContent = replaceTableNamesWithTheirAssetNames(organizationId,sqlContent,listOfTableNames);
				    	}
				    	else{
				    		replacedTableNamesWithAssetNamesSQLContent = sqlContent;
				    	}
				    	assetToUpdate.setAssetContent(replacedTableNamesWithAssetNamesSQLContent);
				    	if(sqlAsset.getVersionNumber() == 0){ // which means it is not set, so version number is 1
				    		assetToUpdate.setNumber_of_historical_versions(1);
				    	}
				    	else{
				    		assetToUpdate.setNumber_of_historical_versions(sqlAsset.getVersionNumber());
				    	}
					}
					ObjectMapper objectMapper = new ObjectMapper();
					Map<String, Object> assetInformationMap = objectMapper.convertValue(assetToUpdate, Map.class);
					SolrInputDocument solrInputDocument = new SolrInputDocument();
					for(String key: assetInformationMap.keySet()) {
						if(assetInformationMap.get(key)!=null){
							solrInputDocument.addField(key, assetInformationMap.get(key));
						}
					}
					if(counter==Integer.parseInt(env.getProperty("max-documents-to-store-in-buffer-before-index"))){ // When 
						UpdateRequest solrUpdateRequest = new UpdateRequest("/update");
						solrUpdateRequest.setBasicAuthCredentials(solrUsername, solrPassword);
						solrUpdateRequest.add(listOfSOLRInputDocuments);
						UpdateResponse updateResponseOnAddingDocument = solrUpdateRequest.process(client);
						client.commit();
						if(updateResponseOnAddingDocument.getStatus()!=0){ // It means that the request was unsuccessful
							// TODO
						}
						else{
							logger.info("SOLR commit was successful for org with Id:{}",organizationId);
						}
						// Reinitialize
						counter = 0;
						listOfSOLRInputDocuments = new ArrayList<SolrInputDocument>();
					}
					else{
						listOfSOLRInputDocuments.add(solrInputDocument);
						counter++;
					}
				}
				catch(Exception e){
					logger.error("Error while working on Asset with Id:{}. Message:{}",assetUser.getId(),e.getMessage());
				}
			}
			// If suppose the org has less that max-documents-to-store-in-buffer-before-index and the assetUser 
			// for loop has ended that means we have to index all the documents which have been stored in listOfSOLRInputDocuments
			if(counter>0 && listOfSOLRInputDocuments.size()>0){
				try{
					UpdateRequest solrUpdateRequest = new UpdateRequest("/update");
					solrUpdateRequest.setBasicAuthCredentials(solrUsername, solrPassword);
					solrUpdateRequest.add(listOfSOLRInputDocuments);
					UpdateResponse updateResponseOnAddingDocument = solrUpdateRequest.process(client);
					client.commit();
					if(updateResponseOnAddingDocument.getStatus()!=0){ // It means that the request was unsuccessful
						// TODO
					}
					else{
						logger.info("SOLR commit was successful for org with Id:{}",organizationId);
					}
					// Reinitialize
					counter = 0;
					listOfSOLRInputDocuments = new ArrayList<SolrInputDocument>();
				}
				catch(Exception e){
					
				}
			}
		}
	}
	
	/**
	 * The purpose of this function is to return 
	 * the query string with place holders replaced by their actual table names
	 * @param queryString
	 * @return
	 */
	private String replaceTableNamesWithTheirAssetNames(String organizationId, String queryString,ArrayList<String> listOfNamesOfTable) {
		Map<String,String> mapOfTableNamesAndCorrespondingAssetName = repository.getMapOfTableNameAndAssetName(organizationId, listOfNamesOfTable);
    	for(int j=0;j<listOfNamesOfTable.size();j++){
	    		for(String tableName:mapOfTableNamesAndCorrespondingAssetName.keySet()){
	    			if(listOfNamesOfTable.get(j).equalsIgnoreCase(tableName)){
		    			String assetName = mapOfTableNamesAndCorrespondingAssetName.get(tableName);
		    			queryString = queryString.replaceAll(tableName,assetName);
		    			break;
	    			}
	    		}
    	}
    	return queryString;
	}
}
