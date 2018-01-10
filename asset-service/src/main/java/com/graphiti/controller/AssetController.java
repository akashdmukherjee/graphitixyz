package com.graphiti.controller;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.ws.rs.QueryParam;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.graphiti.Constants;
import com.graphiti.DiscoverabilityScoreMaxMetrics;
import com.graphiti.DiscoverabilityScoreWeightage;
import com.graphiti.bean.AccessibilityLogType;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetAccessibilityLog;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.DataSourceType;
import com.graphiti.bean.Endorsement;
import com.graphiti.bean.FAQ;
import com.graphiti.bean.Note;
import com.graphiti.bean.Organization;
import com.graphiti.bean.PermissionType;
import com.graphiti.bean.PrivilegesType;
import com.graphiti.bean.RelatedAssets;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.User;
import com.graphiti.bean.UserAccessibilityCountInfo;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.bean.UserAssetsInfoWithName;
import com.graphiti.bean.UserAssetsWithAssetName;
import com.graphiti.bean.UserType;
import com.graphiti.exceptions.AssetNotFoundException;
import com.graphiti.exceptions.AssetUsersUpdateException;
import com.graphiti.exceptions.DataSetAssetUpdateException;
import com.graphiti.exceptions.GenericInternalServerErrorException;
import com.graphiti.exceptions.SQLAssetUpdateException;
import com.graphiti.externalServices.CacheService;
import com.graphiti.externalServices.IdentityService;
import com.graphiti.externalServices.SearchService;
import com.graphiti.repository.AssetAccessibilityLogRepository;
import com.graphiti.repository.AssetUsersRepository;
import com.graphiti.repository.DataSetRepository;
import com.graphiti.repository.SQLAssetRepository;
import com.graphiti.repository.UserAssetsRepository;
import com.grapthiti.utils.Utils;
import com.mongodb.WriteResult;

@RestController
public class AssetController {

	private final Logger logger = LoggerFactory.getLogger(AssetController.class);
	private final String FIELD_UPDATE_ONLY = "FIELD_UPDATE_ONLY";
	private final String CACHE_UPDATE = "CACHE_UPDATE";
	private final String SQL_FILE_UPDATE_ONLY = "SQL_FILE_UPDATE_ONLY";
	private final String STRING_APPENDED_FOR_DS = "_DS";

	@Autowired
	AssetUsersRepository assetUsersRepository;

	@Autowired
	UserAssetsRepository userAssetsRepository;

	@Autowired
	DataSetRepository datasetRepository;

	@Autowired
	SQLAssetRepository sqlAssetRepository;
	
	@Autowired
	AssetAccessibilityLogRepository assetAccessibilityLogRepository;
	
	@RequestMapping(value = "/health", method = RequestMethod.GET)
	public ResponseEntity<String> testConnection(){
		return new ResponseEntity<>("OK",HttpStatus.OK);
	}

	
	@RequestMapping(value = "/asset", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> addAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "isInjestionOfDataDone",defaultValue="true",required=false) boolean isInjestionOfData,
			@RequestHeader(value = "IsRelatedAsset",defaultValue="false",required=false) boolean isRelatedAsset,
			@RequestBody AssetDetailedInformation assetDetailInformation) {
		logger.info("graphiti-tid:{}.Creation of Asset for Member with Id:{} and OrgId:{}",graphiti_tid,memberId,assetDetailInformation.getOrgId());
		JSONObject responseJSONObject = new JSONObject();
		String assetIdForDataSet = null;
		// Create AssetUsers first
		// 1. Create Creator
		logger.info("graphiti-tid:{}.Initializing creator of an asset",graphiti_tid);
		AssetUsersInfo creator = new AssetUsersInfo(memberId, assetDetailInformation.getMemberName(),
				assetDetailInformation.getUsertype());
		logger.info("graphiti-tid:{}. Creating AssetUsers object",graphiti_tid);
		AssetUsers assetUser = new AssetUsers(assetDetailInformation.getAssetName(),
				assetDetailInformation.getAssetType(), creator, assetDetailInformation.getOrgId());
		// This saves to AssetUser collection
		// Since this is a newly created asset we do not have to worry
		// about it and simply save it
		logger.info("graphiti-tid:{}. Saving AssetUsers object in database",graphiti_tid);
		String assetId = assetUsersRepository.save(graphiti_tid, memberId, assetUser);
		logger.info("graphiti-tid:{}. AssetUsers object successfully saved in database. AssetId created:{}",graphiti_tid,assetId);
		// UserAssetsInfo
		logger.info(
				"graphiti-tid:{}.Creating an entry of the newly created asset with Id:{} in UserAssetsInfo for member with Id:{}",
				graphiti_tid, assetId, memberId);
		UserAssetsInfo creatorOfAsset = new UserAssetsInfo(assetId, assetDetailInformation.getAssetType());
		userAssetsRepository.addUserAsCreatorOfAsset(graphiti_tid, memberId, assetDetailInformation.getOrgId(),
				assetDetailInformation.getUsertype(), creatorOfAsset);
		// Now depending on what type of Asset it is (SQL,DATASET) we have to do
		// the follwoing actions
		// 1. If SQL - Create SQL Asset and DataSet Asset
		// 2. If just DataSet then just create that
		if (assetDetailInformation.getAssetType().getValue().equalsIgnoreCase(AssetType.DATASET.getValue())) {
			logger.info("graphiti-tid:{}.Only Dataset asset needs to be created, so creating one with Id:{}",graphiti_tid,assetId);
			DataSet dataset = new DataSet(assetId, assetDetailInformation.getAssetName(),
					assetDetailInformation.getCacheTableName(), assetDetailInformation.getDataSourceType(),
					assetDetailInformation.getUploadFileName(), assetDetailInformation.getColumnNamesInCache(),
					assetDetailInformation.getOrgId());
			datasetRepository.save(graphiti_tid, memberId, dataset);
			logger.info("graphiti-tid:{}.Dataset asset successfully created with Id:{}",graphiti_tid,assetId);
			responseJSONObject.put("dataSetAssetId", assetId);
		}
		// This is when the upload is a SQLAsset from a Connector and has a
		// corresponding DataAsset
		else if (assetDetailInformation.getAssetType().getValue().equalsIgnoreCase(AssetType.SQL.getValue())
				&& assetDetailInformation.getDataSourceType().equals(DataSourceType.APP)) {
			logger.info("graphiti-tid:{}.SQLAsset is to be created. DataSourceType:{}",graphiti_tid,DataSourceType.APP.getValue());
			if(isInjestionOfData){ // If injestion is true then only we have to do this
				// Then we will have to create DataSet asset too
				logger.info("graphiti-tid:{}.Injestion is required",graphiti_tid);
				logger.info("graphiti-tid:{}.Creating new AssetUsers object for DataAsset",graphiti_tid);
				AssetUsers assetUserForDataSet = new AssetUsers(assetDetailInformation.getDataAssetName(), AssetType.DATASET,
						creator, assetDetailInformation.getOrgId());
				assetIdForDataSet = assetUsersRepository.save(graphiti_tid, memberId, assetUserForDataSet);
				logger.info("graphiti-tid:{}.Successfully created new AssetUsers object for DataAsset with Id:{}",graphiti_tid,assetIdForDataSet);
				// UserAssets for DataSet
				// UserAssetsInfo for DataSet
				UserAssetsInfo creatorOfDataSetAsset = new UserAssetsInfo(assetIdForDataSet, AssetType.DATASET);
				userAssetsRepository.addUserAsCreatorOfAsset(graphiti_tid, memberId, assetDetailInformation.getOrgId(),
						assetDetailInformation.getUsertype(), creatorOfDataSetAsset);
				logger.info("graphiti-tid:{}.Created an entry in UserAssets Repository for member with Id:{}",graphiti_tid,memberId);
				// null the uploadFileName, also the DataSourceType is SQL because
				// the source of the DataSet is SQL 
				// because the dataSourceType SQL
				logger.info("graphiti-tid:{}.Creating an entry in DataSet with Id:{}",graphiti_tid,assetIdForDataSet);
				DataSet dataset = new DataSet(assetIdForDataSet, assetDetailInformation.getDataAssetName(),
							assetDetailInformation.getCacheTableName(), DataSourceType.SQL,
							assetDetailInformation.getColumnNamesInCache(), assetDetailInformation.getOrgId());
				// Add inflow for the asset
				UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(assetId, AssetType.SQL);
				dataset.getRelatedAssets().getInflow().add(inflowAssetInfo);
				// Save the DataSet has been added
				datasetRepository.save(graphiti_tid, memberId, dataset);
				logger.info("graphiti-tid:{}.Successfully created an entry in DataSet with Id:{}",graphiti_tid,assetIdForDataSet);
			}
			// Once the DataSet has been added we need to add the SQL asset to
			// have
			// outflow pointing to the newly created DataSet
			// First we have to store the SQL in S3
			// then creating a SQL asset
			// String id, String name, String linkOfS3,DataSourceType
			// sourceType,String connectionId,RelatedAssets relatedAssets
			logger.info("graphiti-tid:{}.Creating SQLAsset with Id:{}",graphiti_tid,assetId);
			SQLAsset sqlAsset = new SQLAsset(assetId, assetDetailInformation.getAssetName(), assetDetailInformation.getLinkOfS3(),
					assetDetailInformation.getDataSourceType(), assetDetailInformation.getConnectionId(), null);
			logger.info("graphiti-tid:{}.Created an SQLAsset with Id:{}",graphiti_tid,assetId);
			// lets just solve for connection only as of now
			if(isInjestionOfData){ // if injestion is false there wont be a outflow basically
				logger.info("graphiti-tid:{}.Injestion of data is set to true, so adding DataAsset with Id:{} to outflow of SQLAsset with Id:{}",graphiti_tid,assetIdForDataSet,assetId);
				UserAssetsInfo outflowAssetInfo = new UserAssetsInfo(assetIdForDataSet, AssetType.DATASET);
				sqlAsset.getRelatedAssets().getOutflow().add(outflowAssetInfo); // add outflow																	
			}
			// Now if relatedAssets are set to true that means the above SQL Asset will have an inflow too
			if(isRelatedAsset){
				logger.info("graphiti-tid:{}.Related Asset set to true",graphiti_tid);
				String[] arrayOfAssetIds = assetDetailInformation.getSourceAssetIds().toArray(new String[assetDetailInformation.getSourceAssetIds().size()]);
				logger.info("graphiti-tid:{}.Making these assetIds:{}, source for the SQLAsset with Id:{}",graphiti_tid,arrayOfAssetIds,assetId);
				// Now get all the information of assets which will be basically the inflow for the SQLAsset
				// Now we have to get the type of each of the assets in arrayOfAssetIds
				HashMap<String,ArrayList<String>> mapOfAssetTypeAndCorrespondingListOfAssetId = assetUsersRepository.getMapOfAssetTypeAndCorrespondingListOfAssetId(assetDetailInformation.getOrgId(), arrayOfAssetIds);
				if (mapOfAssetTypeAndCorrespondingListOfAssetId.containsKey(AssetType.DATASET.getValue())
						&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()) != null
						&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()).size() > 0) {
					// Convert List to Array
					String[] arrayOfDataAssetId = new String[mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()).size()];
					mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()).toArray(arrayOfDataAssetId);
					List<DataSet> inflowDataSetsInformation = datasetRepository.getListOfDataSetBasedOnIds(assetDetailInformation.getOrgId(), arrayOfDataAssetId);
					UserAssetsInfo outflowAssetInfoForSourceDataSets = new UserAssetsInfo(sqlAsset.getId(), AssetType.SQL);
					for(int iterator=0;iterator<inflowDataSetsInformation.size();iterator++){
						UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(inflowDataSetsInformation.get(iterator).getId(), AssetType.DATASET);
						sqlAsset.getRelatedAssets().getInflow().add(inflowAssetInfo);
						// Now for every DataSet which is being referenced in the SQLAsset 
						// we need to add outflow which will be the Id of the SQLAsset that we just created
						inflowDataSetsInformation.get(iterator).getRelatedAssets().getOutflow().add(outflowAssetInfoForSourceDataSets);
					}
					datasetRepository.addOutFlowForDataSets(inflowDataSetsInformation); 
				}
				if(mapOfAssetTypeAndCorrespondingListOfAssetId.containsKey(AssetType.SQL.getValue())
						&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()) != null
						&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()).size() > 0){
					// Convert List to Array
					String[] arrayOfSQLAssetId = new String[mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()).size()];
					mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()).toArray(arrayOfSQLAssetId);
					List<SQLAsset> inflowSQLAssetInformation = sqlAssetRepository.getListOfSQLAssetBasedOnIds(arrayOfSQLAssetId);
					UserAssetsInfo outflowAssetInfoForSourceSQLAsset = new UserAssetsInfo(sqlAsset.getId(), AssetType.SQL);
					for(int iterator=0;iterator<inflowSQLAssetInformation.size();iterator++){
						UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(inflowSQLAssetInformation.get(iterator).getId(), AssetType.SQL);
						sqlAsset.getRelatedAssets().getInflow().add(inflowAssetInfo);
						// Now for every DataSet which is being referenced in the SQLAsset 
						// we need to add outflow which will be the Id of the SQLAsset that we just created
						inflowSQLAssetInformation.get(iterator).getRelatedAssets().getOutflow().add(outflowAssetInfoForSourceSQLAsset);
					}
					sqlAssetRepository.addOutFlowForSQLAsset(inflowSQLAssetInformation);
				}
			}
			logger.info("graphiti-tid:{}.Saving SQLAsset with Id:{}",graphiti_tid,assetId);
			sqlAssetRepository.save(graphiti_tid, memberId, sqlAsset);
			if(isInjestionOfData){ // dataSetAssetId will only be there when there was an actual injestion of data
				responseJSONObject.put("dataSetAssetId", assetIdForDataSet);
			}
			responseJSONObject.put("sqlAssetId", assetId);
		}
		else if (assetDetailInformation.getAssetType().getValue().equalsIgnoreCase(AssetType.SQL.getValue())
				&& assetDetailInformation.getDataSourceType().equals(DataSourceType.FILE_UPLOAD)) {
			logger.info("graphiti-tid:{}.Creating a normal SQLAsset with Id:{}. DataSourceType:{}",graphiti_tid,assetId,DataSourceType.FILE_UPLOAD.getValue());
			// connectionId is what is null
			SQLAsset sqlAsset = new SQLAsset(assetId, assetDetailInformation.getAssetName(), assetDetailInformation.getLinkOfS3(),
					assetDetailInformation.getDataSourceType(), null, assetDetailInformation.getUploadFileName());
			sqlAssetRepository.save(graphiti_tid, memberId, sqlAsset);
			responseJSONObject.put("sqlAssetId", assetId);
		}
		logger.info("graphiti-tid:{}.Asset added with Id:{}", graphiti_tid, assetId);
		// I think this is where the discoverability score needs to be calculated.
		// and needs to be stored for each of the asset
		Set<String> setOfKeys = new HashSet<String>(responseJSONObject.keySet());
		Iterator<String> iteratorOfKeys = setOfKeys.iterator();
		while(iteratorOfKeys.hasNext()){
			String key = iteratorOfKeys.next();
			if(key.equalsIgnoreCase("sqlAssetId") || key.equalsIgnoreCase("dataSetAssetId")){
				if(responseJSONObject.get(key) != null){
					ResponseEntity entity = getDiscovabilityScore(graphiti_tid,memberId,assetDetailInformation.getOrgId(),true,(String)responseJSONObject.get(key));
					int discoverabilityScore = Integer.parseInt((String) entity.getBody());
					responseJSONObject.put(key + STRING_APPENDED_FOR_DS , discoverabilityScore);
				}
			}
		}
		return new ResponseEntity<JSONObject>(responseJSONObject, HttpStatus.CREATED);
	}

	// Make External
	@RequestMapping(value = "/asset/{assetId}", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getAsset(@RequestHeader(value = "memberId") String memberId,
									  @RequestHeader(value = "graphiti-tid") String graphiti_tid,
									  @RequestHeader(value = "orgId") String orgId,
									  @PathVariable String assetId) {
		logger.info("graphiti-tid:{}.Retrieving an asset for user with assetId:", graphiti_tid, assetId);
		AssetUsers assetUsers = assetUsersRepository.getAssetUsers(assetId,null); // TODO - Replace null with orgId when its passed
		if(assetUsers == null) {
			logger.error("graphiti-tid:{}. Could not find asset related details for Id:{}",graphiti_tid,assetId);
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		return new ResponseEntity<AssetUsers>(assetUsers, HttpStatus.OK);
	}
	
	/**
	 * External API for /asset/{assetId}
	 * method: getAsset
	 */
	@RequestMapping(value = "/ext/asset/{assetId}", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extGetAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId) {
		ResponseEntity<?> response =  getAsset(memberId, graphiti_tid,orgId, assetId);
		if(response.getStatusCode()==HttpStatus.OK){
			// Here we have to make an entry 
			// to AssetAccessibilityLog
			IdentityService identityService = new IdentityService();
			User user = identityService.getUser(memberId, graphiti_tid);
			assetAccessibilityLogRepository.save(graphiti_tid, memberId, user.getName(), orgId, assetId,AccessibilityLogType.VIEWERS);
		}
		return response;
	}
	
	@RequestMapping(value = "/asset/{assetId}", method = RequestMethod.PUT, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> updateAsset(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "type") String assetUpdateType,
			@RequestBody AssetDetailedInformation assetDetailedInformation,
			@RequestHeader(value = "IsRelatedAsset",defaultValue="false",required=false) boolean isRelatedAsset,
			@PathVariable(value="assetId") String assetId) {
		try{
			logger.info("graphiti-tid:{},type:{}", graphiti_tid,assetUpdateType);
			if (!assetUpdateType.equalsIgnoreCase(CACHE_UPDATE)
					&& !assetUpdateType.equalsIgnoreCase(FIELD_UPDATE_ONLY)
					&& !assetUpdateType.equalsIgnoreCase(SQL_FILE_UPDATE_ONLY)) {
				logger.error("graphiti-tid:{}. Asset Update Type param is unknown.");
				return new ResponseEntity<String>(
						"Request Param `type` is required", HttpStatus.BAD_REQUEST);
			}
			IdentityService identityService = new IdentityService();
			User user = identityService.getUser(memberId, graphiti_tid); // TODO- Need to pass orgId as well
			String memberName = user.getName();
			AssetUsersInfo lastModifiedBy = new AssetUsersInfo(memberId, memberName, UserType.MEMBER);
			SearchService searchService = new SearchService();
			// Update asset in Mongo Collection
			AssetUsers asset = assetUsersRepository.getAsset(graphiti_tid, assetId);
			if (asset == null) {
				logger.info("graphiti-tid:{}. Asset not found with assetId:{}", graphiti_tid, assetId);
				return new ResponseEntity<String>("Asset not found", HttpStatus.NOT_FOUND);
			}
			// These are for specific field updates only
			if(assetUpdateType.equalsIgnoreCase(FIELD_UPDATE_ONLY)) {
				logger.info("graphiti-tid:{}.Requesting for field update only",graphiti_tid);
				Asset solrAssetToBeUpdated = new Asset();
				Map<String, Object> fieldsToBeUpdated = new HashMap<>();
				// use this boolean to check if there is a need to update on SOLR
				boolean isSolrUpdateRequired = false;
				Set<String> setOfFieldsToBeExplicitlyUpdated = new HashSet<String>();
				String commaSeparatedFieldsToBeExplicitlyUpdated = null;
				if (assetDetailedInformation.getAssetName() != null) {
					logger.info("graphiti-tid:{}. Asset name is being updated.");
					fieldsToBeUpdated.put("assetName", assetDetailedInformation.getAssetName());
					solrAssetToBeUpdated.setAssetName(assetDetailedInformation.getAssetName());
					isSolrUpdateRequired = true;
					setOfFieldsToBeExplicitlyUpdated.add("assetName");
				}
				if (assetDetailedInformation.getTags() != null) { // checked this. If tags is empty then its an empty array and not null
					logger.info("graphiti-tid:{}. Tags are being updated");
					fieldsToBeUpdated.put("tags", assetDetailedInformation.getTags());
					solrAssetToBeUpdated.setTags(assetDetailedInformation.getTags().toArray(new String[assetDetailedInformation.getTags().size()]));
					isSolrUpdateRequired = true;
					setOfFieldsToBeExplicitlyUpdated.add("tags");
				}
				if (assetDetailedInformation.getAsset_description() != null) {
					logger.info("graphiti-tid:{}. Description is being updated");
					fieldsToBeUpdated.put("asset_description", assetDetailedInformation.getAsset_description());
					solrAssetToBeUpdated.setAsset_description(assetDetailedInformation.getAsset_description());
					isSolrUpdateRequired = true;
					setOfFieldsToBeExplicitlyUpdated.add("asset_description");
				}
				if (fieldsToBeUpdated.size() > 0) {
					fieldsToBeUpdated.put("lastModifiedBy", lastModifiedBy);
					fieldsToBeUpdated.put("lastModifiedEpochTime", Instant.now().getEpochSecond());
					solrAssetToBeUpdated.setLastModifiedBy_id(lastModifiedBy.getId());
					solrAssetToBeUpdated.setLastModifiedBy_name(lastModifiedBy.getName());
					solrAssetToBeUpdated.setLastModifiedTimestamp(Instant.now().getEpochSecond());
					setOfFieldsToBeExplicitlyUpdated.add("lastModifiedBy_id");
					setOfFieldsToBeExplicitlyUpdated.add("lastModifiedBy_name");
					setOfFieldsToBeExplicitlyUpdated.add("lastModifiedTimestamp");
					
				} else {
					return new ResponseEntity<>(null, HttpStatus.NO_CONTENT);
				}	
				logger.info("graphiti-tid:{}. Update assetUsers with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
				assetUsersRepository.updateAsset(assetId, assetDetailedInformation.getOrgId(), fieldsToBeUpdated);
				// Once this has been updated, we need to update the discoverabilityScore too
				ResponseEntity discoverabilityScoreResponse = getDiscovabilityScore(graphiti_tid, memberId, orgId, true, assetId);
				int discoverabilityScore = Integer.parseInt((String) discoverabilityScoreResponse.getBody());
				if (isSolrUpdateRequired) {
					solrAssetToBeUpdated.setAssetId(assetId);
					solrAssetToBeUpdated.setOrgId(orgId);
					solrAssetToBeUpdated.setDiscoverabilityScore(discoverabilityScore);
					setOfFieldsToBeExplicitlyUpdated.add("assetId");
					setOfFieldsToBeExplicitlyUpdated.add("orgId");
					setOfFieldsToBeExplicitlyUpdated.add("discoverabilityScore");
					logger.info("graphiti-tid:{} Update asset on SOLR with assetId:{}", graphiti_tid, assetId);
					commaSeparatedFieldsToBeExplicitlyUpdated = joinElementsOfSetByDelimiter(setOfFieldsToBeExplicitlyUpdated, ",");
					searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, solrAssetToBeUpdated,commaSeparatedFieldsToBeExplicitlyUpdated);
				}
			} else if(assetUpdateType.equalsIgnoreCase(CACHE_UPDATE)) {
				logger.info("graphiti-tid:{}. Updating assetUsers with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
				
				// when updating asset using CACHE_UPDATE
				// only two fields are updated for AssetUsers collection: lastModifiedBy, lastModifiedEpochTime
				Map<String, Object> updateFieldsMapForAssetUsers = new HashMap<>();
				updateFieldsMapForAssetUsers.put("lastModifiedBy", lastModifiedBy);
				updateFieldsMapForAssetUsers.put("lastModifiedEpochTime",Instant.now().getEpochSecond());
				boolean updateAssetResult = assetUsersRepository.updateAsset(assetId,null,updateFieldsMapForAssetUsers);
				if(updateAssetResult){
					logger.info("graphiti-tid:{}.AssetUsers update with assetId:{}",graphiti_tid,assetId);
				}
				else{
					logger.error("graphiti-tid:{}.Unable to update AssetUsers with assetId:{}",graphiti_tid,assetId);
				}
				logger.info("graphiti-tid:{}. Asset updated with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
				// For DataSet
				if(assetDetailedInformation.getAssetType()==AssetType.DATASET){
					Map<String, Object> updateFieldsMapForDataSet = new HashMap<>(2);
					updateFieldsMapForDataSet.put("columnNamesInCache", assetDetailedInformation.getColumnNamesInCache());
					updateFieldsMapForDataSet.put("uploadFileName", assetDetailedInformation.getUploadFileName());
					boolean updateDataSetResult = datasetRepository.updateDataSetAsset(assetId, updateFieldsMapForDataSet);
					if(updateDataSetResult) {
						logger.info("graphiti-tid:{}. DataSetAsset updated with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
					} else {
						logger.error("graphiti-tid:{}. Unable to update DataSetAsset with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
						throw new DataSetAssetUpdateException("Unable to update datasetAsset with assetId:"+assetId);
					}
					// Now updating discoverability score
					ResponseEntity entity = getDiscovabilityScore(graphiti_tid,memberId,orgId,true,assetId);
					int discoverabilityScoreOfDataSet = Integer.parseInt((String) entity.getBody());
					JSONObject reponseJsonObject = new JSONObject();
					reponseJsonObject.put("dataSetAssetId"+STRING_APPENDED_FOR_DS,discoverabilityScoreOfDataSet);
					return new ResponseEntity<Object>(reponseJsonObject, HttpStatus.OK);
				}
				
				// For SQLAsset
				if(assetDetailedInformation.getAssetType()==AssetType.SQL){
					// Map<String,Object> updateFieldsMapsForSQLAsset = new HashMap<>(2);
					// updateFieldsMapsForSQLAsset.put("linkOfS3",assetDetailedInformation.getLinkOfS3());
					// First get the SQLAsset so that you can get the older version link
					SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId,assetDetailedInformation.getOrgId());
					// updateFieldsMapsForSQLAsset.put("versionNumber",sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
					// updateFieldsMapsForSQLAsset.put("olderVersionLinks",sqlAsset.getLinkOfS3());
					sqlAsset.setVersionNumber(sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
					sqlAsset.getOlderVersionLinks().add(sqlAsset.getLinkOfS3());
					sqlAsset.setLinkOfS3(assetDetailedInformation.getLinkOfS3());
					if(isRelatedAsset){
						
						// First break the bond between the assets which are inflow 
						// of the SQLAsset
						if(sqlAsset.getRelatedAssets().getInflow()!=null && sqlAsset.getRelatedAssets().getInflow().size()>0){
							List<String> listOfDataAssetIdsWhereSQLAssetIsOutflow = new ArrayList<String>();
							List<String> listOfSQLAssetIdsWhereSQLAssetIsOutflow = new ArrayList<String>();
							for(UserAssetsInfo userAssetInfo : sqlAsset.getRelatedAssets().getInflow()){
								if(userAssetInfo.getAssetType().equals(AssetType.DATASET))
									listOfDataAssetIdsWhereSQLAssetIsOutflow.add(userAssetInfo.getId());
								else if(userAssetInfo.getAssetType().equals(AssetType.SQL))
									listOfSQLAssetIdsWhereSQLAssetIsOutflow.add(userAssetInfo.getId());
									
							}
							datasetRepository.removeSQLAssetInformationFromOutFlow(sqlAsset.getId(),listOfDataAssetIdsWhereSQLAssetIsOutflow);
							sqlAssetRepository.removeSQLAssetInformationFromOutFlow(sqlAsset.getId(),listOfSQLAssetIdsWhereSQLAssetIsOutflow);
						}
						// We have to re-initiakize inflow of SQLAsset first
						ArrayList<UserAssetsInfo> newInflowOfSQLAsset = new ArrayList<UserAssetsInfo>(1);
						sqlAsset.getRelatedAssets().setInflow(newInflowOfSQLAsset);
						String[] arrayOfAssetIds = assetDetailedInformation.getSourceAssetIds().toArray(new String[assetDetailedInformation.getSourceAssetIds().size()]);
						// Now get all the information of assets which will be basically the inflow for the SQLAsset
						// Now we have to get the type of each of the assets in arrayOfAssetIds
						HashMap<String,ArrayList<String>> mapOfAssetTypeAndCorrespondingListOfAssetId = assetUsersRepository.getMapOfAssetTypeAndCorrespondingListOfAssetId(assetDetailedInformation.getOrgId(), arrayOfAssetIds);
						if (mapOfAssetTypeAndCorrespondingListOfAssetId.containsKey(AssetType.DATASET.getValue())
								&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()) != null
								&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()).size() > 0) {
							// Convert List to Array
							String[] arrayOfDataAssetId = new String[mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()).size()];
							mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.DATASET.getValue()).toArray(arrayOfDataAssetId);
							List<DataSet> inflowDataSetsInformation = datasetRepository.getListOfDataSetBasedOnIds(assetDetailedInformation.getOrgId(), arrayOfDataAssetId);
							UserAssetsInfo outflowAssetInfoForSourceDataSets = new UserAssetsInfo(sqlAsset.getId(), AssetType.SQL);
							for(int iterator=0;iterator<inflowDataSetsInformation.size();iterator++){
								UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(inflowDataSetsInformation.get(iterator).getId(), AssetType.DATASET);
								sqlAsset.getRelatedAssets().getInflow().add(inflowAssetInfo);
								// Now for every DataSet which is being referenced in the SQLAsset 
								// we need to add outflow which will be the Id of the SQLAsset that we just created
								inflowDataSetsInformation.get(iterator).getRelatedAssets().getOutflow().add(outflowAssetInfoForSourceDataSets);
							}
							datasetRepository.addOutFlowForDataSets(inflowDataSetsInformation); 
						}
						if(mapOfAssetTypeAndCorrespondingListOfAssetId.containsKey(AssetType.SQL.getValue())
								&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()) != null
								&& mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()).size() > 0){
							// Convert List to Array
							String[] arrayOfSQLAssetId = new String[mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()).size()];
							mapOfAssetTypeAndCorrespondingListOfAssetId.get(AssetType.SQL.getValue()).toArray(arrayOfSQLAssetId);
							List<SQLAsset> inflowSQLAssetInformation = sqlAssetRepository.getListOfSQLAssetBasedOnIds(arrayOfSQLAssetId);
							UserAssetsInfo outflowAssetInfoForSourceSQLAsset = new UserAssetsInfo(sqlAsset.getId(), AssetType.SQL);
							for(int iterator=0;iterator<inflowSQLAssetInformation.size();iterator++){
								UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(inflowSQLAssetInformation.get(iterator).getId(), AssetType.SQL);
								sqlAsset.getRelatedAssets().getInflow().add(inflowAssetInfo);
								// Now for every DataSet which is being referenced in the SQLAsset 
								// we need to add outflow which will be the Id of the SQLAsset that we just created
								inflowSQLAssetInformation.get(iterator).getRelatedAssets().getOutflow().add(outflowAssetInfoForSourceSQLAsset);
							}
							sqlAssetRepository.addOutFlowForSQLAsset(inflowSQLAssetInformation);
						}
					}
					boolean updateSQLAssetResult = sqlAssetRepository.save(graphiti_tid, memberId, sqlAsset); //sqlAssetRepository.updateSQLAsset(assetId,assetDetailedInformation.getOrgId(),updateFieldsMapsForSQLAsset);
					if(updateSQLAssetResult){
						logger.info("graphiti-tid:{}. SQLAsset updated with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
					} else{
						logger.error("graphiti-tid:{}. Unable to update SQLAsset with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
						throw new SQLAssetUpdateException("Unable to update sqlAsset with assetId"+assetId);
					}
					// Now updating discoverability score
					ResponseEntity entity = getDiscovabilityScore(graphiti_tid,memberId,orgId,true,assetId);
					int discoverabilityScoreOfSQLAsset = Integer.parseInt((String) entity.getBody());
					JSONObject reponseJsonObject = new JSONObject();
					reponseJsonObject.put("sqlAssetId"+STRING_APPENDED_FOR_DS,discoverabilityScoreOfSQLAsset);
					return new ResponseEntity<Object>(reponseJsonObject, HttpStatus.OK);
				}
			}
			else if(assetUpdateType.equalsIgnoreCase(SQL_FILE_UPDATE_ONLY)){ // SQL UPDATE ONLY
				// This is updating the AssetUsers part
				Map<String, Object> updateFieldsMapForAssetUsers = new HashMap<>();
				updateFieldsMapForAssetUsers.put("lastModifiedBy", lastModifiedBy);
				updateFieldsMapForAssetUsers.put("lastModifiedEpochTime",Instant.now().getEpochSecond());
				boolean updateAssetResult = assetUsersRepository.updateAsset(assetId,null,updateFieldsMapForAssetUsers);
				if(updateAssetResult){
					logger.info("graphiti-tid:{}.AssetUsers update with assetId:{}",graphiti_tid,assetId);
				}
				else{
					logger.error("graphiti-tid:{}.Unable to update AssetUsers with assetId:{}",graphiti_tid,assetId);
				}
				logger.info("graphiti-tid:{}. Asset updated with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
				// For SQLAsset
				if(assetDetailedInformation.getAssetType()==AssetType.SQL){
						Map<String,Object> updateFieldsMapsForSQLAsset = new HashMap<>(2);
						updateFieldsMapsForSQLAsset.put("linkOfS3",assetDetailedInformation.getLinkOfS3());
						// First get the SQLAsset so that you can get the older version link
						SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId, assetDetailedInformation.getOrgId());
						updateFieldsMapsForSQLAsset.put("versionNumber",sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
						updateFieldsMapsForSQLAsset.put("olderVersionLinks",sqlAsset.getLinkOfS3());
						boolean updateSQLAssetResult = sqlAssetRepository.updateSQLAsset(assetId,assetDetailedInformation.getOrgId(),updateFieldsMapsForSQLAsset);
						if(updateSQLAssetResult){
							logger.info("graphiti-tid:{}. SQLAsset updated with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
						} else{
							logger.error("graphiti-tid:{}. Unable to update SQLAsset with assetId:{}. Requested assetUpdateType:{}", graphiti_tid,assetId,assetUpdateType);
							throw new SQLAssetUpdateException("Unable to update sqlAsset with assetId"+assetId);
						}
						// Now updating discoverability score
						ResponseEntity entity = getDiscovabilityScore(graphiti_tid,memberId,orgId,true,assetId);
						int discoverabilityScoreOfSQLAsset = Integer.parseInt((String) entity.getBody());
						JSONObject reponseJsonObject = new JSONObject();
						reponseJsonObject.put("sqlAssetId"+STRING_APPENDED_FOR_DS,discoverabilityScoreOfSQLAsset);
						return new ResponseEntity<Object>(reponseJsonObject, HttpStatus.OK);
				}
			}
			return new ResponseEntity<Object>(null, HttpStatus.NO_CONTENT);
		}
		catch(Exception e){
			logger.error("graphiti-tid:{}. Internal Server Error. StackTrace:{}",graphiti_tid,e.getStackTrace());
			return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}", method = RequestMethod.PUT, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> extupdateAsset(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "type") String assetUpdateType,
			@RequestBody AssetDetailedInformation assetDetailedInformation,
			@RequestHeader(value = "IsRelatedAsset",defaultValue="false",required=false) boolean isRelatedAsset,
			@PathVariable(value="assetId") String assetId) {
		ResponseEntity<?> response = updateAsset(graphiti_tid, memberId, orgId, assetUpdateType, assetDetailedInformation, isRelatedAsset, assetId);
		if(response.getStatusCode().equals(HttpStatus.NO_CONTENT)){
			// Here we have to make an entry 
			// to AssetAccessibilityLog
			IdentityService identityService = new IdentityService();
			User user = identityService.getUser(memberId, graphiti_tid);
			assetAccessibilityLogRepository.save(graphiti_tid, memberId, user.getName(), orgId, assetId,AccessibilityLogType.EDITORS);
		}
		return response;
		
	}
	/**
	 * The purpose of this API is to update permissions of an Asset
	 * 
	 * @param graphiti_tid
	 * @param assetDetailedInformation
	 * @return
	 */
	// Make External
	@RequestMapping(value = "/asset/permissions", method = RequestMethod.PUT, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> updateAssetPermissions(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestBody AssetDetailedInformation assetDetailedInformation) {
		String memberId = assetDetailedInformation.getMemberId();
		String memberName = assetDetailedInformation.getMemberName();
		String assetId = assetDetailedInformation.getAssetId();
		AssetType assetType = assetDetailedInformation.getAssetType();
		
		// First lets find out the existing users who are having different privileges
		// for this asset(this is before updation with new priviledged users
		AssetUsers assetUserInfo = assetUsersRepository.getAsset(graphiti_tid, assetId, assetDetailedInformation.getOrgId());
		List<AssetUsersInfo> oldAdmins = assetUserInfo.getAdmins();//assetDetailedInformation.getAdmins();
		List<AssetUsersInfo> oldAuthors = assetUserInfo.getAuthors();//assetDetailedInformation.getAuthors();
		List<AssetUsersInfo> oldViewers = assetUserInfo.getViewers();//assetDetailedInformation.getViewers();
		
		// Now for every user in each of the privileges
		// we have to remove this assets entry from UserAssets collection
		for(AssetUsersInfo assetInfo :oldAdmins){
			userAssetsRepository.removeAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,assetDetailedInformation.getOrgId(),"admin");
		}
		for(AssetUsersInfo assetInfo :oldAuthors){
			userAssetsRepository.removeAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,assetDetailedInformation.getOrgId(),"author");
		}
		for(AssetUsersInfo assetInfo :oldViewers){
			userAssetsRepository.removeAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,assetDetailedInformation.getOrgId(),"viewer");
		}
		
		AssetUsersInfo lastModifiedBy = new AssetUsersInfo(memberId, memberName, UserType.MEMBER);
		// Update asset in Mongo Collection
		List<AssetUsersInfo> admins = assetDetailedInformation.getAdmins();
		List<AssetUsersInfo> authors = assetDetailedInformation.getAuthors();
		List<AssetUsersInfo> viewers = assetDetailedInformation.getViewers();
		Map<String, Object> updatePermissionsMap = new HashMap<>(4);
		updatePermissionsMap.put("admins", admins);
		updatePermissionsMap.put("viewers", viewers);
		updatePermissionsMap.put("authors", authors);
		// Now for every user in each of the privileges
		// we have to add this assets entry from UserAssets collection
		if(admins!=null && admins.size()>0){
			for(AssetUsersInfo assetInfo :admins){
				userAssetsRepository.addAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,assetDetailedInformation.getOrgId(),PrivilegesType.ADMIN.getValue(),assetType);
			}
		}
		if(authors!=null && authors.size()>0){
			for(AssetUsersInfo assetInfo :authors){
				userAssetsRepository.addAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,assetDetailedInformation.getOrgId(),PrivilegesType.AUTHOR.getValue(),assetType);
			}
		}
		if(viewers!=null && viewers.size()>0){
			for(AssetUsersInfo assetInfo :viewers){
				userAssetsRepository.addAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,assetDetailedInformation.getOrgId(),PrivilegesType.VIEWER.getValue(),assetType);
			}
		}
		
		// TODO - Remove null when orgId
		boolean updateResult = assetUsersRepository.updateAsset(assetId,null, updatePermissionsMap); 
		if(updateResult){
			logger.info("graphiti-tid:{}. Asset updated with assetId:{} in Mongo", graphiti_tid, assetId);
		}
		else{
			logger.error("graphiti-tid:{}.Unable to update AssetUsers with assetId:{}",graphiti_tid,assetId);
			throw new AssetUsersUpdateException("Unable to update AssetUsers with assetId:"+assetId);
		}
		// Update asset in SOLR
		SearchService searchService = new SearchService();
		logger.info("graphiti-tid:{}. Calling Search Service to update SOLR Document with assetId:{}", graphiti_tid,
				assetId);
		searchService.updateAssetPermissions(graphiti_tid, assetId, admins, authors, viewers, null,
				assetDetailedInformation.getOrgId(), memberId, memberName);
		logger.info("graphiti-tid:{}. Asset updated successfully with assetId:{}", graphiti_tid, assetId);
		return new ResponseEntity<Object>(null, HttpStatus.NO_CONTENT);
	}
	
	/**
	 * External API for /asset/permissions
	 * method: updateAssetPermissions
	 */
	@RequestMapping(value = "/ext/asset/permissions", method = RequestMethod.PUT, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> extUpdateAssetPermissions(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestBody AssetDetailedInformation assetDetailedInformation) {
		return updateAssetPermissions(graphiti_tid, assetDetailedInformation);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/makeFavorite", method = RequestMethod.PUT)
	public ResponseEntity<?> makeAssetFavouriteForAUser(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId") String assetId){
		// First get assetInformation from assetId
		logger.info("graphiti-tid:{}. Getting asset related information for asset with Id:{}",graphiti_tid,assetId);
		AssetUsers assetUsersInformation = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
		if(assetUsersInformation==null){
			logger.error("graphiti-tid:{}. Asset not found with Id:{}",graphiti_tid,assetId);
			throw new AssetNotFoundException("Asset not found with Id:{}");
		}
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		// First iterate over favorites and if 
		// the user is already present then we will have to just return from here
		if(assetUsersInformation.getFavorites()!=null){
			for(int i=0;i<assetUsersInformation.getFavorites().size();i++){
				if(assetUsersInformation.getFavorites().get(i).getId().equalsIgnoreCase(memberId)){
						return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
				}
			}
		}
		AssetUsersInfo assetUserInfo = new AssetUsersInfo(memberId, user.getName(),UserType.MEMBER);
		if(assetUsersInformation.getFavorites()==null){ // If null
			List<AssetUsersInfo> listOfFavorites = new ArrayList<AssetUsersInfo>(1);
			assetUsersInformation.setFavorites(listOfFavorites);
		}
		assetUsersInformation.getFavorites().add(assetUserInfo);
		logger.info("graphiti-tid:{}. Marking asset with Id:{} favorite for user with Id:{}",graphiti_tid,assetId,memberId);
		assetUsersRepository.save(graphiti_tid, memberId, assetUsersInformation);
		// Once we have saved this we have to again calculate the discoverability score
		
		logger.info("graphiti-tid:{}. Marked asset with Id:{} favorite for user with Id:{}",graphiti_tid,assetId,memberId);
		// Iterate to create a list of favorites
		String[] listOfMemberIds = new String[assetUsersInformation.getFavorites().size()];
		String[] listOfMemberNames = new String[assetUsersInformation.getFavorites().size()];
		for(int i=0;i<assetUsersInformation.getFavorites().size();i++){
			listOfMemberIds[i] = assetUsersInformation.getFavorites().get(i).getId();
			listOfMemberNames[i] = assetUsersInformation.getFavorites().get(i).getName();
		}
		Asset searchAsset = new Asset();
		searchAsset.setIs_favorited_ids(listOfMemberIds);
		searchAsset.setIs_favorited_names(listOfMemberNames);
		searchAsset.setLastModifiedBy_id(memberId);
		searchAsset.setLastModifiedBy_name(user.getName());
		searchAsset.setAssetId(assetId);
		searchAsset.setOrgId(orgId);
		SearchService searchService = new SearchService();
		searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, searchAsset,"is_favorited_ids,is_favorited_names,lastModifiedBy_id,lastModifiedBy_name");
		return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/removeFavorite", method = RequestMethod.PUT)
	public ResponseEntity<?> removeAssetFavouriteForAUser(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId") String assetId){
		// First get assetInformation from assetId
		logger.info("graphiti-tid:{}. Getting asset related information for asset with Id:{}",graphiti_tid,assetId);
		AssetUsers assetUsersInformation = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
		if(assetUsersInformation==null){
			logger.error("graphiti-tid:{}. Asset not found with Id:{}",graphiti_tid,assetId);
			throw new AssetNotFoundException("Asset not found with Id:{}");
		}
		if(assetUsersInformation.getFavorites()==null){
			logger.info("graphiti-tid:{}. No favorites for this asset so nothing to remove.",graphiti_tid);
			return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
		}
		// Now iterate over the list of favorites to remove the 
		// appropriate one
		List<AssetUsersInfo> newAssetUsersInfoList = new ArrayList<AssetUsersInfo>();
		for(AssetUsersInfo assetUserInfo : assetUsersInformation.getFavorites()){
			if(assetUserInfo.getId().equalsIgnoreCase(memberId)){
				// do nothing
			}
			else{
				newAssetUsersInfoList.add(assetUserInfo);
			}
		}
		assetUsersInformation.setFavorites(newAssetUsersInfoList);
		logger.info("graphiti-tid:{}. Removing favourite for user with Id:{} from asset with Id:{}",graphiti_tid,memberId,assetId);
		assetUsersRepository.save(graphiti_tid, memberId, assetUsersInformation);
		logger.info("graphiti-tid:{}. Removed favourite for user with Id:{} from asset with Id:{}",graphiti_tid,memberId,memberId);
		// Iterate to create a list of favorites
		String[] listOfMemberIds = new String[assetUsersInformation.getFavorites().size()];
		String[] listOfMemberNames = new String[assetUsersInformation.getFavorites().size()];
		for(int i=0;i<newAssetUsersInfoList.size();i++){
			listOfMemberIds[i] = newAssetUsersInfoList.get(i).getId();
			listOfMemberNames[i] = newAssetUsersInfoList.get(i).getName();
		}
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		Asset searchAsset = new Asset();
		searchAsset.setIs_favorited_ids(listOfMemberIds);
		searchAsset.setIs_favorited_names(listOfMemberNames);
		searchAsset.setLastModifiedBy_id(memberId);
		searchAsset.setLastModifiedBy_name(user.getName());
		searchAsset.setAssetId(assetId);
		searchAsset.setOrgId(orgId);
		SearchService searchService = new SearchService();
		searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, searchAsset,"is_favorited_ids,is_favorited_names,lastModifiedBy_id,lastModifiedBy_name");
		return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
	}
	
	/**
	 * 
	 * This API is used to get FLOW details for an asset. It is used in related Assets.
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param orgId
	 * @param assetId
	 * @return
	 */
	/********************** Sample JSON Response *********************
	{
	    "children": [
	        {
	            "children": [
	                {
	                    "name": "GVDATA_Tuesday_1",
	                    "id": "ce70c247-a1ce-4cc5-aa86-da2248b6f1fb",
	                    "type": "DATASET"
	                },
	                {
	                    "name": "GVDATA_Tuesday_2",
	                    "id": "df4fa735-4293-41f1-b9f1-f50502b39457",
	                    "type": "DATASET"
	                }
	            ],
	            "name": "inflow"
	        },
	        {
	            "children": [
	                {
	                    "name": "GVDATA_Tuesday_1_2_1_Changed",
	                    "id": "724d94f9-693d-4403-91a7-16ba9de0f259",
	                    "type": "DATASET"
	                }
	            ],
	            "name": "outflow"
	        }
	    ],
	    "name": "GVSQL_Tuesday_1_2_1",
	    "id": "668ecda3-20fb-4890-9f86-e2428facaa95",
	    "type": "SQL"
	}
	********************** Sample JSON Response Ends*********************/
	// Make External
	@RequestMapping(value = "/asset/{assetId}/flowdetails", method = RequestMethod.GET,produces = "application/json")
	public ResponseEntity<Object> getInflowAndOutFlowForAsset(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value="assetId") String assetId){
		logger.info("graphiti_id:{}.Getting datails of asset from AssetUsers for Id:{}",graphiti_tid,assetId);
		// Get the details from AssetUsers first
		AssetUsers assetUserInfo = assetUsersRepository.getAsset(graphiti_tid, assetId,orgId);
		if(assetUserInfo == null){ // null
			return new ResponseEntity<>(null,HttpStatus.NOT_FOUND);
		}
		else{
			if(assetUserInfo.getAssetType()==null){
				logger.error("graphiti_id:{}. The asset with Id : {} does not have an AssetType",graphiti_tid,assetId);
				// TODO  - throw a 500
			}
			
			JSONObject jsonResponse = new JSONObject();
			jsonResponse.put("name",assetUserInfo.getName()); // name
			jsonResponse.put("id", assetUserInfo.getId());
			jsonResponse.put("type", assetUserInfo.getAssetType());
			
			// This is the top level children. This will consist of both Inflows and Outflows Objects
			// intialized below
			JSONArray flowArray = new JSONArray();
			// JSONObjects for Inflow and Outflow
			JSONObject jsonObjectForInflow = new JSONObject();
			JSONObject jsonObjectForOutflow = new JSONObject();
			
			AssetType assetType = assetUserInfo.getAssetType(); // get assetType
			List<UserAssetsInfo> inflowAssets = new ArrayList<UserAssetsInfo>();
			List<UserAssetsInfo> outfowAssets = new ArrayList<UserAssetsInfo>();
			
			if(assetType==AssetType.DATASET){ // DataSet
				DataSet dataSetAsset = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
				inflowAssets = dataSetAsset.getRelatedAssets().getInflow();
				outfowAssets = dataSetAsset.getRelatedAssets().getOutflow();
				
			}
			else if(assetType==AssetType.SQL){ // SQLAsset
				SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId, orgId);//.get(graphiti_tid, memberId, orgId, assetId);
				inflowAssets = sqlAsset.getRelatedAssets().getInflow();
				outfowAssets = sqlAsset.getRelatedAssets().getOutflow();
				
			}
			
			Set<String> setOfAssetIDForDataSet = new HashSet<String>();
			Set<String> setOfAssetIDForSQLAsset = new HashSet<String>();
			if(inflowAssets!=null){ // iterate over inflow of asset
				for(UserAssetsInfo userAssetInfo:inflowAssets){
					if(userAssetInfo.getAssetType()==AssetType.SQL){
						setOfAssetIDForSQLAsset.add(userAssetInfo.getId());
					}
					else if(userAssetInfo.getAssetType()==AssetType.DATASET){
						setOfAssetIDForDataSet.add(userAssetInfo.getId());
					}
				}
			}
			if(outfowAssets!=null){ // iterate over outflow of asset
				for(UserAssetsInfo userAssetInfo:outfowAssets){
					if(userAssetInfo.getAssetType()==AssetType.SQL){
						setOfAssetIDForSQLAsset.add(userAssetInfo.getId());
					}
					else if(userAssetInfo.getAssetType()==AssetType.DATASET){
						setOfAssetIDForDataSet.add(userAssetInfo.getId());
					}
				}
			}
			
			Map<String, DataSet> mapOfInterestedDataAsset = null;
			Map<String, SQLAsset> mapOfInterestedSQLAsset = null;
			
			if(setOfAssetIDForDataSet!=null && setOfAssetIDForDataSet.size()>0){
				mapOfInterestedDataAsset = datasetRepository.getMapOfDataSetBasedOnId(orgId, setOfAssetIDForDataSet.toArray(new String[setOfAssetIDForDataSet.size()]));
			}
			if(setOfAssetIDForSQLAsset!=null && setOfAssetIDForSQLAsset.size()>0){
				mapOfInterestedSQLAsset = sqlAssetRepository.getMapOfSQLAssetBasedOnId(orgId, setOfAssetIDForSQLAsset.toArray(new String[setOfAssetIDForSQLAsset.size()]));
			}
			
			
			// Handling Inflows Object
			JSONArray jsonArrayForAsset_Inflow = new JSONArray();
			for(UserAssetsInfo userAssetInfo:inflowAssets){ // Inflow
				JSONObject jsonAssetObject = new JSONObject();
				if(userAssetInfo.getAssetType()==AssetType.SQL){
					jsonAssetObject.put("name",mapOfInterestedSQLAsset.get(userAssetInfo.getId()).getName());
				}
				else if(userAssetInfo.getAssetType()==AssetType.DATASET){
					jsonAssetObject.put("name",mapOfInterestedDataAsset.get(userAssetInfo.getId()).getName());
				}
				jsonAssetObject.put("id",userAssetInfo.getId());
				jsonAssetObject.put("type",userAssetInfo.getAssetType());
				jsonArrayForAsset_Inflow.add(jsonAssetObject);
			}
			if(jsonArrayForAsset_Inflow.size()>0){
				jsonObjectForInflow.put("children", jsonArrayForAsset_Inflow);
				jsonObjectForInflow.put("name", "inflow");
			}
			
			if(jsonObjectForInflow.keySet().size()>0){
				flowArray.add(jsonObjectForInflow);
			}
			
			
			// Handling Outflows Object
			JSONArray jsonArrayForAsset_Outflow = new JSONArray();
			for(UserAssetsInfo userAssetInfo:outfowAssets){ // Outflow
				JSONObject jsonAssetObject = new JSONObject();
				if(userAssetInfo.getAssetType()==AssetType.SQL){
					jsonAssetObject.put("name",mapOfInterestedSQLAsset.get(userAssetInfo.getId()).getName());
				}
				else if(userAssetInfo.getAssetType()==AssetType.DATASET){
					jsonAssetObject.put("name",mapOfInterestedDataAsset.get(userAssetInfo.getId()).getName());
				}
				jsonAssetObject.put("type",userAssetInfo.getAssetType());
				jsonAssetObject.put("id",userAssetInfo.getId());
				jsonArrayForAsset_Outflow.add(jsonAssetObject);
			}
			if(jsonArrayForAsset_Outflow.size()>0){
				jsonObjectForOutflow.put("children", jsonArrayForAsset_Outflow);
				jsonObjectForOutflow.put("name", "outflow");
			}
			if(jsonObjectForOutflow.keySet().size()>0){
				flowArray.add(jsonObjectForOutflow);
			}
			
			if(flowArray.size()>0){
				jsonResponse.put("children", flowArray);
			}
			
			logger.info("graphiti_id:{}.Returning datails of asset from AssetUsers for Id:{}",graphiti_tid,assetId);
			return new ResponseEntity<Object>(jsonResponse,HttpStatus.OK);
		}
	}
	
	/**
	 * External API for /asset/{assetId}/flowdetails
	 * method: getInflowAndOutFlowForAsset
	 */
	@RequestMapping(value = "/ext/asset/{assetId}/flowdetails", method = RequestMethod.GET,produces = "application/json")
	public ResponseEntity<Object> extGetInflowAndOutFlowForAsset(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value="assetId") String assetId){
		return getInflowAndOutFlowForAsset(graphiti_tid, memberId, orgId, assetId);
	}
	
	private List<String> getMemberTeams(String graphiti_tid, String memberId) {
        IdentityService identityService = new IdentityService();
        List<String> teams = new ArrayList<String>();
        logger.info("graphiti_tid:{}. Getting all teams associated with memberId:{}", graphiti_tid, memberId);
        JSONArray memberTeams = identityService.getTeams(graphiti_tid, memberId);
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
	
	private boolean checkUserExistsInGroup(List<AssetUsersInfo> group, List<String> memberTeams) {
		for(AssetUsersInfo assetUsersInfo: group) {
			if(memberTeams.contains(assetUsersInfo.getId())) {
				return true;
			}
		}
		return false;
	}
	
	private boolean checkUserIsCreator(AssetUsersInfo creator, List<String> memberTeams) {
		if (memberTeams.contains(creator.getId())) {
			return true;
		}
		return false;
	}
	
	// Make External
	@RequestMapping(value = "/asset/checkUserAccessibility/{assetId}", method = RequestMethod.GET)
	public ResponseEntity<?> checkUserAccessibility(@RequestHeader(value="graphiti-tid") String graphiti_tid,
			@RequestHeader(value="orgId") String orgId,
			@RequestHeader(value="memberId") String memberId,
			@PathVariable(value="assetId", required=true) String assetId) {
		// 1. Check if user belongs to any of the permitted groups (admins/authors/viewers)
		// 2. Find out the teams that the user belongs to and check if it is in the permitted groups
		logger.info("graphiti-tid:{}. Getting AssetUsers for assetId:{} belonging to orgId:{}", graphiti_tid, assetId, orgId);
		AssetUsers assetUsers = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
		List<String> memberTeams = this.getMemberTeams(graphiti_tid, memberId);
		String assetPermissionType = null;
		logger.info("graphiti-tid:{}. memberTeams:{}", graphiti_tid, memberTeams);
		if (assetUsers == null) {
			return new ResponseEntity<>("Asset not found", HttpStatus.NOT_FOUND);
		}
		boolean userHasAccess = false;
		if (checkUserIsCreator(assetUsers.getCreator(), memberTeams) || checkUserExistsInGroup(assetUsers.getAdmins(), memberTeams)) {
			userHasAccess = true;
			assetPermissionType = PermissionType.ADMIN.toString();
		} else if (checkUserExistsInGroup(assetUsers.getAuthors(), memberTeams)) {
			userHasAccess = true;
			assetPermissionType = PermissionType.AUTHOR.toString();
		} else if (checkUserExistsInGroup(assetUsers.getViewers(), memberTeams)) {
			userHasAccess = true;
			assetPermissionType = PermissionType.VIEWER.toString();
		}
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("userHasAccess", userHasAccess);
		jsonObject.put("permissionType", assetPermissionType);
		return new ResponseEntity<>(jsonObject, HttpStatus.OK);
	}
	
	/**
	 * External API for /asset/checkUserAccessibility/{assetId}
	 * method: checkUserAccessibility
	 */
	@RequestMapping(value = "/ext/asset/checkUserAccessibility/{assetId}", method = RequestMethod.GET)
	public ResponseEntity<?> extCheckUserAccessibility(@RequestHeader(value="graphiti-tid") String graphiti_tid,
			@RequestHeader(value="orgId") String orgId,
			@RequestHeader(value="memberId") String memberId,
			@PathVariable(value="assetId", required=true) String assetId) {
		return checkUserAccessibility(graphiti_tid, orgId, memberId, assetId);
	}
	
	@RequestMapping(value = "/asset/checkAdminAccess/{assetId}", method = RequestMethod.GET)
	public ResponseEntity<?> checkAdminAccess(@RequestHeader(value="graphiti-tid") String graphiti_tid,
			@RequestHeader(value="orgId") String orgId,
			@RequestHeader(value="memberId") String memberId,
			@PathVariable(value="assetId", required=true) String assetId) {
		logger.info("graphiti-tid:{}. Getting AssetUsers for assetId:{} belonging to orgId:{}", graphiti_tid, assetId, orgId);
		AssetUsers assetUsers = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
		List<String> memberTeams = this.getMemberTeams(graphiti_tid, memberId);
		logger.info("graphiti-tid:{}. memberTeams:{}", graphiti_tid, memberTeams);
		if (assetUsers == null) {
			return new ResponseEntity<>("Asset not found", HttpStatus.NOT_FOUND);
		}
		boolean hasAdminAccess = false;
		if (this.checkUserExistsInGroup(assetUsers.getAdmins(), memberTeams)) {
			hasAdminAccess = true;
		}
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("hasAdminAccess", hasAdminAccess);
		return new ResponseEntity<>(jsonObject, HttpStatus.OK);
	}
	
	
	/**
	 * External API for /asset/checkAdminAccess/{assetId}
	 * method: checkAdminAccess
	 */
	@RequestMapping(value = "/ext/asset/checkAdminAccess/{assetId}", method = RequestMethod.GET)
	public ResponseEntity<?> extCheckAdminAccess(@RequestHeader(value="graphiti-tid") String graphiti_tid,
			@RequestHeader(value="orgId") String orgId,
			@RequestHeader(value="memberId") String memberId,
			@PathVariable(value="assetId", required=true) String assetId) {
		return checkAdminAccess(graphiti_tid, orgId, memberId, assetId);
	}

	@RequestMapping(value = "/asset/{assetId}", method = RequestMethod.DELETE)
	public ResponseEntity<?> deleteAsset(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value="assetId") String assetId){
		logger.info("graphiti-tid:{}. Delete request received for asset with Id:{} from member with Id:{}",graphiti_tid,assetId,memberId);
		AssetUsers assetUserInfo = assetUsersRepository.getAsset(graphiti_tid, assetId,orgId);
		if(assetUserInfo == null){ // null
			logger.info("graphiti-tid:{}.Asset not found with Id:{}",graphiti_tid,assetId);
			return new ResponseEntity<>(null,HttpStatus.NOT_FOUND);
		}
		else{
			
			// Check if the asset is an SQL or a DATASETASSET
			AssetType assetType = assetUserInfo.getAssetType();
			if(assetType == AssetType.DATASET){
				// Now get information with respect to corresponding DATASETASSET
				DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
				if(dataSet == null){ // null
					logger.info("graphiti-tid:{}.Data Asset not found with Id:{}",graphiti_tid,assetId);
					return new ResponseEntity<>(null,HttpStatus.NOT_FOUND);
				}
				else{
					if (dataSet.getRelatedAssets() != null
							&& dataSet.getRelatedAssets().getOutflow() != null
							&& dataSet.getRelatedAssets().getOutflow().size() > 0) {
						logger.info("graphiti-tid:{}.Data Asset with Id :{} has references. Thus cannot be deleted.",graphiti_tid,assetId);
						// TODO - Return details of asset to which it has references
						return new ResponseEntity<>(null,HttpStatus.METHOD_NOT_ALLOWED);
					}
					else{
						// There are multiple things that we need to do
						// 1. Delete the table from the cache to which this dataAsset refers to
						// 2. Delete the DataAsset information from SOLR
						// 3. Delete this asset information from outflow of other assets
						// 4. Delete Asset information from UserAssets
						// 5a. Then delete this data asset from DataSet collection
						// 5b. delete this data asset from AssetUsers collection
						// 6. Delete the entry from AssetAccessibilityLog collection
						CacheService cacheService = new CacheService();
						// 1.
						JSONObject responseFromDeletion = cacheService.deleteTable(graphiti_tid, orgId, memberId, assetId);
						boolean statusOfDeletion = (boolean) responseFromDeletion.get("statusOfDeletion");
						if(statusOfDeletion==true){
							SearchService searchService = new SearchService();
							// 2.
							searchService.deleteAssetsFromSearch(graphiti_tid, memberId, orgId, assetId);
							// 3.
							// Get the asset ids of inflows for this asset
							List<String> assetIdOfInflowsForthisAsset = new ArrayList<String>();
							if(dataSet.getRelatedAssets().getInflow()!=null){
								for(UserAssetsInfo inflowAssets : dataSet.getRelatedAssets().getInflow()){
									// Basically these assets will be SQL Assets since as of now DataAsset cannot create another
									// data asset without SQL
									assetIdOfInflowsForthisAsset.add(inflowAssets.getId());
								}
								sqlAssetRepository.removeDataAssetInformationFromOutflow(dataSet.getId(),assetIdOfInflowsForthisAsset);
							}
							// 4.
							// Delete asset information from UserAssets collection
							// This will be a super expensive operation 
							// userAssetsRepository.removeAssetInformationFromUser(memberId,assetId,orgId);
							//     First we have to find people who have existing permissions and
							//     then remove the asset information from their records
							
							// 5a. Delete document in DataSet collection
							// 5b. Delete document in AssetUsers collection
							datasetRepository.deleteDataSetAsset(graphiti_tid,assetId,orgId);
							assetUsersRepository.deleteAssetUser(graphiti_tid,assetId,orgId);
							// 6. Delete document from AssetAccessibilityLog
							assetAccessibilityLogRepository.deleteAssetInformation(graphiti_tid,assetId,orgId);
						}
						else{
							logger.error("graphiti-tid:{}. Deletion of table was unsuccessful");
							throw new GenericInternalServerErrorException("Deletion of table was Unsuccessful");
						}
					}
				}
			}
			else if(assetType == AssetType.SQL){
				// Now get information with respect to corresponding DATASETASSET
				SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId, orgId);//(graphiti_tid, memberId, orgId, assetId);
				if(sqlAsset == null){ // null
					logger.info("graphiti-tid:{}.SQL Asset not found with Id:{}",graphiti_tid,assetId);
					return new ResponseEntity<>(null,HttpStatus.NOT_FOUND);
				}
				else{
					if (sqlAsset.getRelatedAssets() != null
							&& sqlAsset.getRelatedAssets().getOutflow() != null
							&& sqlAsset.getRelatedAssets().getOutflow().size() > 0) {
						logger.info("graphiti-tid:{}.SQL Asset with Id :{} has references. Thus cannot be deleted.",graphiti_tid,assetId);
						// TODO - Return details of asset to which it has references
						return new ResponseEntity<>(null,HttpStatus.METHOD_NOT_ALLOWED);
					}
					else{
						// Steps
						// 1. Delete all links from S3 for this asset
						// 2. Delete all information from SOLR
						// 3. Delete this asset information from outflow of other assets
						// 4. Delete Asset information from UserAssets
						// 5a. Then delete this data asset from SQLAsset collection
						// 5b. delete this data asset from AssetUsers collection
						// 6. Delete the entry from AssetAccessibilityLog collection
						// 1
						logger.info("graphiti-tid:{}.Deleting existing active of file from S3",graphiti_tid);
						String key = sqlAsset.getLinkOfS3().substring(sqlAsset.getLinkOfS3().lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
						Utils utils = new Utils();
						// delete main link of S3
						IdentityService identityService = new IdentityService();
						logger.info("graphiti-tid:{}.Getting orgnization details",graphiti_tid);
						Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
						utils.deleteExistingObjectFromS3(graphiti_tid, organization.getS3BucketName(), key);
						logger.info("graphiti-tid:{}.Deleting older links from S3 if present",graphiti_tid);
						for(String oldS3Links : sqlAsset.getOlderVersionLinks()){
							key = oldS3Links.substring(oldS3Links.lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
							utils.deleteExistingObjectFromS3(graphiti_tid, organization.getS3BucketName(), key);
						}
						// 2.
						logger.info("graphiti-tid:{}.Deleting infromation of the asset from Search",graphiti_tid);
						SearchService searchService = new SearchService();
						searchService.deleteAssetsFromSearch(graphiti_tid, memberId, orgId, assetId);
						// 3.
						List<String> assetIdOfInflowsForthisAsset = new ArrayList<String>();
						if(sqlAsset.getRelatedAssets().getInflow()!=null){
							for(UserAssetsInfo inflowAssets : sqlAsset.getRelatedAssets().getInflow()){
								// Basically these assets will be SQL Assets since as of now DataAsset cannot create another
								// data asset without SQL
								assetIdOfInflowsForthisAsset.add(inflowAssets.getId());
							}
							datasetRepository.removeSQLAssetInformationFromOutFlow(sqlAsset.getId(),assetIdOfInflowsForthisAsset);
						}
						// 4. Delete Asset information from UserAssets - TODO
						// 5a. Delete from SQLAsset Collection
						sqlAssetRepository.deleteSQLAsset(graphiti_tid, assetId, orgId);
						// 5b. Delete from AssetUsersCollection
						assetUsersRepository.deleteAssetUser(graphiti_tid,assetId,orgId);
						// 6. Delete the entry from AssetAccessibilityLog collection
						assetAccessibilityLogRepository.deleteAssetInformation(graphiti_tid, assetId, orgId);
					}
				}
			}
			List<AssetUsersInfo> oldAdmins = assetUserInfo.getAdmins();  //assetDetailedInformation.getAdmins();
			List<AssetUsersInfo> oldAuthors = assetUserInfo.getAuthors();//assetDetailedInformation.getAuthors();
			List<AssetUsersInfo> oldViewers = assetUserInfo.getViewers();//assetDetailedInformation.getViewers();
			AssetUsersInfo creator = assetUserInfo.getCreator();
			
			// Now for every user in each of the privileges
			// we have to remove this assets entry from UserAssets collection
			for(AssetUsersInfo assetInfo :oldAdmins){
				userAssetsRepository.removeAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,orgId,PrivilegesType.ADMIN.getValue());
			}
			for(AssetUsersInfo assetInfo :oldAuthors){
				userAssetsRepository.removeAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,orgId,PrivilegesType.AUTHOR.getValue());
			}
			for(AssetUsersInfo assetInfo :oldViewers){
				userAssetsRepository.removeAssetInformationForUser(graphiti_tid,assetInfo.getId(),assetId,orgId,PrivilegesType.VIEWER.getValue());
			}
			if(creator!=null){ // remove creator information
				userAssetsRepository.removeAssetInformationForUser(graphiti_tid,creator.getId(),assetId,orgId,PrivilegesType.CREATOR.getValue());
			}
		}
		return null;
	}
	
	
	/**
	 *
	 * @param graphiti_tid
	 * @param memberId
	 * @param orgId
	 * @param commaSeparatedAssetNames
	 * @return  This returns a list of asset of 
	 * 			with id, name and type
	 * 			{	
	 * 				"assetName" : "ABC",
	 * 				"id" : "accsc",
	 * 				"type" : "SQL/DATASET"
	 * 			}				
	 */
	@RequestMapping(value = "/asset/assetType", method = RequestMethod.POST, consumes = "text/plain", produces = "application/json")
	public ResponseEntity<?> getAssetType(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "getDataByField") String getDataByField,
			@RequestBody String commaSeparatedAssetNames) {

			String[] arrayOfAssetNames = commaSeparatedAssetNames.split(",");
			List<AssetUsers> listOfAssetBasedOnNamesOrIdAndOrgId  = null;
			if(getDataByField.equalsIgnoreCase("name")){
				listOfAssetBasedOnNamesOrIdAndOrgId = assetUsersRepository.getListOfAssetBasedOnNames(orgId, arrayOfAssetNames);
			}
			else{
				listOfAssetBasedOnNamesOrIdAndOrgId = assetUsersRepository.getListOfAssetBasedOnId(orgId, arrayOfAssetNames);
			}
			// Once you get the list of AssetUsers 
			// iterate over those and get create a JSONArray response consisting 
			// of assetName and corresponding tableName
			JSONArray returningJSONArray = new JSONArray();
			for(AssetUsers assetUser : listOfAssetBasedOnNamesOrIdAndOrgId){
				JSONObject object = new JSONObject();
				object.put("assetName", assetUser.getName());
				object.put("id", assetUser.getId());
				object.put("type", assetUser.getAssetType().getValue());
				returningJSONArray.add(object);
			}
			return new ResponseEntity<>(returningJSONArray,HttpStatus.OK);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}", method = RequestMethod.DELETE)
	public ResponseEntity<?> extdeleteAsset(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value="assetId") String assetId){
		return deleteAsset(graphiti_tid,memberId,orgId,assetId);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/note", method = RequestMethod.POST)
	public ResponseEntity<?> extAddNote(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId") String assetId,
			@RequestBody Note note){
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		if (user == null) {
			return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
		}
		String noteId = Utils.generateRandomAlphaNumericString(10);
		AssetUsersInfo assetUsersInfo = new AssetUsersInfo();
		assetUsersInfo.setId(memberId);
		assetUsersInfo.setName(user.getName());
		// TODO: userType in User bean is in string and userType in AssetUsersInfo is in Enum
		// we need to fix this later
		// just a temporary solution
		if (user.getType().equalsIgnoreCase(UserType.TEAM.toString())) {
			assetUsersInfo.setUsertype(UserType.TEAM);
		} else {
			assetUsersInfo.setUsertype(UserType.MEMBER);
		}
		note.setId(noteId);
		note.setCreatedTimestamp(Instant.now().getEpochSecond());
		note.setCreator(assetUsersInfo);
		logger.info("graphiti-tid:{}. Adding a Note with id:{} to AssetUsers with id:{}", graphiti_tid, noteId, assetId);
		WriteResult result = assetUsersRepository.addNote(graphiti_tid, assetId, orgId, note);
		JSONObject responseJSON = new JSONObject();
		if (result.getN() == 1) {
			logger.info("graphiti-tid:{}. Note with id:{} added to AssetUsers with id:{}", graphiti_tid, noteId, assetId);
			responseJSON.put("noteId", noteId);
			return new ResponseEntity<>(responseJSON, HttpStatus.OK);
		}
		logger.info("graphiti-tid:{}. Note with id:{} unable to add to AssetUsers with id:{}", graphiti_tid, noteId, assetId);
		return new ResponseEntity<>("Unable to add note in AssetUsers", HttpStatus.INTERNAL_SERVER_ERROR);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/faq", method = RequestMethod.POST)
	public ResponseEntity<?> extAddFAQ(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId") String assetId,
			@RequestBody FAQ faq){
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		if (user == null) {
			return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
		}
		String faqId = Utils.generateRandomAlphaNumericString(10);
		AssetUsersInfo assetUsersInfo = new AssetUsersInfo();
		assetUsersInfo.setId(memberId);
		assetUsersInfo.setName(user.getName());
		// TODO: userType in User bean is in string and userType in AssetUsersInfo is in Enum
		// we need to fix this later
		// just a temporary solution
		if (user.getType().equalsIgnoreCase(UserType.TEAM.toString())) {
			assetUsersInfo.setUsertype(UserType.TEAM);
		} else {
			assetUsersInfo.setUsertype(UserType.MEMBER);
		}
		faq.setId(faqId);
		faq.setCreatedTimestamp(Instant.now().getEpochSecond());
		faq.setCreator(assetUsersInfo);
		logger.info("graphiti-tid:{}. Add a FAQ with id:{} to AssetUsers with id:{}", graphiti_tid, faqId, assetId);
		WriteResult result = assetUsersRepository.addFAQ(graphiti_tid, assetId, orgId, faq);
		JSONObject responseJSON = new JSONObject();
		if (result.getN() == 1) {
			logger.info("graphiti-tid:{}. FAQ with id:{} added to AssetUsers with id:{}", graphiti_tid, faqId, assetId);
			responseJSON.put("faqId", faqId);
			return new ResponseEntity<>(responseJSON, HttpStatus.OK);
		}
		logger.info("graphiti-tid:{}. FAQ with id:{} unable to add to AssetUsers with id:{}", graphiti_tid, faqId, assetId);
		return new ResponseEntity<>("Unable to add FAQ in AssetUsers", HttpStatus.INTERNAL_SERVER_ERROR);
	}
	
	private String joinElementsOfSetByDelimiter(Set<String> setOfElements,String delimiter){
		Iterator<String> iterator = setOfElements.iterator();
		StringBuffer stringBuffer = new StringBuffer();
		while(iterator.hasNext()){
			stringBuffer.append(iterator.next()).append(",");
		}
		return stringBuffer.substring(0,stringBuffer.length()-1);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/addEndorsement", method = RequestMethod.PUT)
	public ResponseEntity<?> addEndorsementForAsset(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "endorsementType") String endorsementType,
			@PathVariable(value = "assetId") String assetId){
		logger.info("graphiti-tid:{}. Updating Endorsement of type:{} on assetId:{}.", graphiti_tid, endorsementType, assetId);
		// endorsementType must be one of types in Endorsement enum
		if (!endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase()) &&
				!endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase()) &&
				!endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())) {
			return new ResponseEntity<>("Wrong endorsement type", HttpStatus.BAD_REQUEST);
		}
		AssetUsers assetUsersInformation = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
		if(assetUsersInformation==null){
			logger.error("graphiti-tid:{}. Asset not found with Id:{}",graphiti_tid,assetId);
			throw new AssetNotFoundException("Asset not found with Id:{}");
		}
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		// First iterate over each of the endorsements and if 
		// the user is already present then we will have to just return from here
		// TRUSTED
		if(endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase())){
			if(assetUsersInformation.getTrusted()!=null){
				for(int i=0;i<assetUsersInformation.getTrusted().size();i++){
					if(assetUsersInformation.getTrusted().get(i).getId().equalsIgnoreCase(memberId)){
							return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
					}
				}
			}
		} // DEPRECATED
		else if(endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase())){
			if(assetUsersInformation.getDeprecated()!=null){
				for(int i=0;i<assetUsersInformation.getDeprecated().size();i++){
					if(assetUsersInformation.getDeprecated().get(i).getId().equalsIgnoreCase(memberId)){
							return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
					}
				}
			}
		} // ERRONEOUS
		else if(endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())){
			if(assetUsersInformation.getErroneous()!=null){
				for(int i=0;i<assetUsersInformation.getErroneous().size();i++){
					if(assetUsersInformation.getErroneous().get(i).getId().equalsIgnoreCase(memberId)){
							return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
					}
				}
			}
		}
		AssetUsersInfo assetUserInfo = new AssetUsersInfo(memberId, user.getName(),UserType.MEMBER);
		// Check if these endorsements are null
		// and if they are then we have to initialize them
		// TRUSTED
		if(endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase())){
			if(assetUsersInformation.getTrusted()==null){
				List<AssetUsersInfo> listOfUsersWhoHaveTrusted = new ArrayList<AssetUsersInfo>(1);
				assetUsersInformation.setTrusted(listOfUsersWhoHaveTrusted);
			}
			assetUsersInformation.getTrusted().add(assetUserInfo);
		}
		else if(endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase())){ // DEPRECATED
			if(assetUsersInformation.getDeprecated()==null){
				List<AssetUsersInfo> listOfUsersWhoHaveDeprecatedTheAsset = new ArrayList<AssetUsersInfo>(1);
				assetUsersInformation.setDeprecated(listOfUsersWhoHaveDeprecatedTheAsset);
			}
			assetUsersInformation.getDeprecated().add(assetUserInfo);
		}
		else if(endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())){ // ERRONEOUS
			if(assetUsersInformation.getErroneous()==null){
				List<AssetUsersInfo> listOfUsersWhoHaveMadeAssetAsErroneous = new ArrayList<AssetUsersInfo>(1);
				assetUsersInformation.setErroneous(listOfUsersWhoHaveMadeAssetAsErroneous);
			}
			assetUsersInformation.getErroneous().add(assetUserInfo);
		}
		
		logger.info("graphiti-tid:{}. Endorsing asset with Id:{} with value {} by user with Id:{}",graphiti_tid,endorsementType,memberId);
		assetUsersRepository.save(graphiti_tid, memberId, assetUsersInformation);
		logger.info("graphiti-tid:{}. Endorsement complete for asset with Id:{} with value {} for user with Id:{}",graphiti_tid,endorsementType,memberId);
		
		logger.info("graphiti-tid:{}. Adding endorsement related data to search");
		// Update in Search
		String[] listOfMemberIds = null;
		String[] listOfMemberNames = null;
		Asset searchAsset = new Asset();
		Set<String> setOfFieldsToBeUpdatedInSearch = new HashSet<String>();
		if(endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase())){
			listOfMemberIds = new String[assetUsersInformation.getTrusted().size()];
			listOfMemberNames = new String[assetUsersInformation.getTrusted().size()];
			for(int i=0;i<assetUsersInformation.getTrusted().size();i++){
				listOfMemberIds[i] = assetUsersInformation.getTrusted().get(i).getId();
				listOfMemberNames[i] = assetUsersInformation.getTrusted().get(i).getName();
			}
			searchAsset.setTrusted_ids(listOfMemberIds);
			searchAsset.setTrusted_names(listOfMemberNames);
			setOfFieldsToBeUpdatedInSearch.add("trusted_ids");
			setOfFieldsToBeUpdatedInSearch.add("trusted_names");
		}
		else if(endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase())){
			listOfMemberIds = new String[assetUsersInformation.getDeprecated().size()];
			listOfMemberNames = new String[assetUsersInformation.getDeprecated().size()];
			for(int i=0;i<assetUsersInformation.getDeprecated().size();i++){
				listOfMemberIds[i] = assetUsersInformation.getDeprecated().get(i).getId();
				listOfMemberNames[i] = assetUsersInformation.getDeprecated().get(i).getName();
			}
			searchAsset.setDeprecated_ids(listOfMemberIds);
			searchAsset.setDeprecated_names(listOfMemberNames);
			setOfFieldsToBeUpdatedInSearch.add("deprecated_ids");
			setOfFieldsToBeUpdatedInSearch.add("deprecated_names");
		}
		else if(endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())){
			listOfMemberIds = new String[assetUsersInformation.getErroneous().size()];
			listOfMemberNames = new String[assetUsersInformation.getErroneous().size()];
			for(int i=0;i<assetUsersInformation.getErroneous().size();i++){
				listOfMemberIds[i] = assetUsersInformation.getErroneous().get(i).getId();
				listOfMemberNames[i] = assetUsersInformation.getErroneous().get(i).getName();
			}
			searchAsset.setErroneous_ids(listOfMemberIds);
			searchAsset.setErroneous_names(listOfMemberNames);
			setOfFieldsToBeUpdatedInSearch.add("erroneous_ids");
			setOfFieldsToBeUpdatedInSearch.add("erroneous_names");
		}	
		searchAsset.setAssetId(assetId);
		searchAsset.setOrgId(orgId);
		SearchService searchService = new SearchService();
		String commaSeparatedListOfStringsToBeUpdated = null;
		if(setOfFieldsToBeUpdatedInSearch!=null && setOfFieldsToBeUpdatedInSearch.size()>0){
			commaSeparatedListOfStringsToBeUpdated = joinElementsOfSetByDelimiter(setOfFieldsToBeUpdatedInSearch, ",");
		}
		searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, searchAsset,commaSeparatedListOfStringsToBeUpdated);
		return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/removeEndorsement", method = RequestMethod.PUT)
	public ResponseEntity<?> removeEndorsementForAsset(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "endorsementType") String endorsementType,
			@PathVariable(value = "assetId") String assetId){
		// endorsementType must be one of types in Endorsement enum
		if (!endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase()) &&
				!endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase()) &&
				!endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())) {
			return new ResponseEntity<>("Wrong endorsement type", HttpStatus.BAD_REQUEST);
		}
		AssetUsers assetUsersInformation = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
		if(assetUsersInformation==null){
			logger.error("graphiti-tid:{}. Asset not found with Id:{}",graphiti_tid,assetId);
			throw new AssetNotFoundException("Asset not found with Id:{}");
		}
		if(endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase())){
			if(assetUsersInformation.getTrusted()==null){
				logger.info("graphiti-tid:{}. No trusted endorsement for this asset so nothing to remove.",graphiti_tid);
				return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
			}
			else{
				List<AssetUsersInfo> newTrustedUsersInfoList = new ArrayList<AssetUsersInfo>();
				for(AssetUsersInfo assetUserInfo : assetUsersInformation.getTrusted()){
					if(assetUserInfo.getId().equalsIgnoreCase(memberId)){
						// do nothing
					}
					else{
						newTrustedUsersInfoList.add(assetUserInfo);
					}
				}
				assetUsersInformation.setTrusted(newTrustedUsersInfoList);
			}
		}
		else if(endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase())){
			if(assetUsersInformation.getDeprecated()==null){
				logger.info("graphiti-tid:{}. No deprecated endorsement for this asset so nothing to remove.",graphiti_tid);
				return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
			}
			else{
				List<AssetUsersInfo> newDeprecatedUsersInfoList = new ArrayList<AssetUsersInfo>();
				for(AssetUsersInfo assetUserInfo : assetUsersInformation.getDeprecated()){
					if(assetUserInfo.getId().equalsIgnoreCase(memberId)){
						// do nothing
					}
					else{
						newDeprecatedUsersInfoList.add(assetUserInfo);
					}
				}
				assetUsersInformation.setDeprecated(newDeprecatedUsersInfoList);
			}
		}
		else if(endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())){
			if(assetUsersInformation.getErroneous()==null){
				logger.info("graphiti-tid:{}. No erroneous endorsement for this asset so nothing to remove.",graphiti_tid);
				return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
			}
			else{
				List<AssetUsersInfo> newErroneousUsersInfoList = new ArrayList<AssetUsersInfo>();
				for(AssetUsersInfo assetUserInfo : assetUsersInformation.getErroneous()){
					if(assetUserInfo.getId().equalsIgnoreCase(memberId)){
						// do nothing
					}
					else{
						newErroneousUsersInfoList.add(assetUserInfo);
					}
				}
				assetUsersInformation.setErroneous(newErroneousUsersInfoList);
			}
		}		
		logger.info("graphiti-tid:{}. Removing endorement with value : {}  for user with Id:{} from asset with Id:{}",graphiti_tid,endorsementType,memberId,assetId);
		assetUsersRepository.save(graphiti_tid, memberId, assetUsersInformation);
		logger.info("graphiti-tid:{}. Removed endorement with value : {} for user with Id:{} from asset with Id:{}",graphiti_tid,endorsementType,memberId,memberId);
		
		// Update in Search
		String[] listOfMemberIds = null;
		String[] listOfMemberNames = null;
		Set<String> setOfFieldsToBeUpdatedInSearch = new HashSet<String>();
		Asset searchAsset = new Asset();
		if (endorsementType.equals(Endorsement.TRUSTED.toString().toLowerCase())) {
			listOfMemberIds = new String[assetUsersInformation.getTrusted().size()];
			listOfMemberNames = new String[assetUsersInformation.getTrusted().size()];
			for (int i = 0; i < assetUsersInformation.getTrusted().size(); i++) {
				listOfMemberIds[i] = assetUsersInformation.getTrusted().get(i).getId();
				listOfMemberNames[i] = assetUsersInformation.getTrusted().get(i).getName();
			}
			searchAsset.setTrusted_ids(listOfMemberIds);
			searchAsset.setTrusted_names(listOfMemberNames);
			setOfFieldsToBeUpdatedInSearch.add("trusted_ids");
			setOfFieldsToBeUpdatedInSearch.add("trusted_names");
		} else if (endorsementType.equals(Endorsement.DEPRECATED.toString().toLowerCase())) {
			listOfMemberIds = new String[assetUsersInformation.getDeprecated().size()];
			listOfMemberNames = new String[assetUsersInformation.getDeprecated().size()];
			for (int i = 0; i < assetUsersInformation.getDeprecated().size(); i++) {
				listOfMemberIds[i] = assetUsersInformation.getDeprecated().get(i).getId();
				listOfMemberNames[i] = assetUsersInformation.getDeprecated().get(i).getName();
			}
			searchAsset.setDeprecated_ids(listOfMemberIds);
			searchAsset.setDeprecated_names(listOfMemberNames);
			setOfFieldsToBeUpdatedInSearch.add("deprecated_ids");
			setOfFieldsToBeUpdatedInSearch.add("deprecated_names");
		} else if (endorsementType.equals(Endorsement.ERRONEOUS.toString().toLowerCase())) {
			listOfMemberIds = new String[assetUsersInformation.getErroneous().size()];
			listOfMemberNames = new String[assetUsersInformation.getErroneous().size()];
			for (int i = 0; i < assetUsersInformation.getErroneous().size(); i++) {
				listOfMemberIds[i] = assetUsersInformation.getErroneous().get(i).getId();
				listOfMemberNames[i] = assetUsersInformation.getErroneous().get(i).getName();
			}
			searchAsset.setErroneous_ids(listOfMemberIds);
			searchAsset.setErroneous_names(listOfMemberNames);
			setOfFieldsToBeUpdatedInSearch.add("erroneous_ids");
			setOfFieldsToBeUpdatedInSearch.add("erroneous_names");
		}
		searchAsset.setAssetId(assetId);
		searchAsset.setOrgId(orgId);
		SearchService searchService = new SearchService();
		String commaSeparatedListOfStringsToBeUpdated = null;
		if(setOfFieldsToBeUpdatedInSearch!=null && setOfFieldsToBeUpdatedInSearch.size()>0){
			commaSeparatedListOfStringsToBeUpdated = joinElementsOfSetByDelimiter(setOfFieldsToBeUpdatedInSearch, ",");
		}
		searchService.updateAssetForSearch(graphiti_tid, memberId, assetId,
				searchAsset,commaSeparatedListOfStringsToBeUpdated);
		return new ResponseEntity<>(null, HttpStatus.NO_CONTENT);
	}
	
	@RequestMapping(value = "/asset/{assetId}/discoverabilityScore", method = RequestMethod.GET, produces="text/plain")
	public ResponseEntity<?> getDiscovabilityScore(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "commitDiscoverabilityScore",defaultValue = "false",required=false) boolean commitDiscoverabilityScore,
			@PathVariable(value = "assetId") String assetId){
		try{
			logger.info("graphiti-tid:{}. Getting discoverability score for asset with Id:{}",graphiti_tid,assetId);
			AssetUsers assetUser = assetUsersRepository.getAsset(graphiti_tid, assetId, orgId);
			Object interesetedObject = null;
			if(assetUser.getAssetType()==AssetType.SQL){
				interesetedObject = sqlAssetRepository.getSQLAsset(assetId, orgId);
			}
			else if(assetUser.getAssetType()==AssetType.DATASET){
				interesetedObject = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
			}
			if(assetUser == null){
				logger.error("graphiti-tid:{}. Asset not found with Id:{}",graphiti_tid,assetId);
				throw new AssetNotFoundException("Asset not found with Id:{}");
			}
			// Tags
			int scoreOfTags = 0;
			if(assetUser.getTags()!=null && assetUser.getTags().size()>0){
				if(assetUser.getTags().size() >= DiscoverabilityScoreMaxMetrics.TAG_COUNT){
					scoreOfTags = DiscoverabilityScoreMaxMetrics.TAG_COUNT * DiscoverabilityScoreWeightage.TAG_WEIGHT;
				}
				else{
					scoreOfTags = assetUser.getTags().size() * DiscoverabilityScoreWeightage.TAG_WEIGHT;
				}
			}
			// Related Assets
			int scoreOfRelatedAssets = 0;
			Method method  = interesetedObject.getClass().getMethod("getRelatedAssets",null);
			RelatedAssets relatedAssets = (RelatedAssets) method.invoke(interesetedObject);
			if(relatedAssets !=null && relatedAssets.getOutflow()!=null && relatedAssets.getOutflow().size()>0){
				if(relatedAssets.getOutflow().size() >= DiscoverabilityScoreMaxMetrics.RELATED_ASSETS_COUNT){
					scoreOfRelatedAssets = DiscoverabilityScoreMaxMetrics.RELATED_ASSETS_COUNT * DiscoverabilityScoreWeightage.RELATED_ASSET_WEIGHTAGE;
				}
				else{
					scoreOfRelatedAssets = relatedAssets.getOutflow().size() * DiscoverabilityScoreWeightage.RELATED_ASSET_WEIGHTAGE;
				}
			}
			// Frequency of views and edits
			int scoreForViewers = 0;
			AssetAccessibilityLog assetLogRepo = assetAccessibilityLogRepository.get(graphiti_tid, assetId, orgId);
			if(assetLogRepo !=null){
				int countOfViewers = 0;
				if(assetLogRepo.getViewers()!=null && assetLogRepo.getViewers().size()>0){
					// Iterate over every viewer and get the count
					for(UserAccessibilityCountInfo userAccessCntInfo : assetLogRepo.getViewers()){
						if(userAccessCntInfo.getCount()>0){
							countOfViewers += userAccessCntInfo.getCount();
						}
					}
				}
				if(countOfViewers >= DiscoverabilityScoreMaxMetrics.VIEWERS_COUNT){
					scoreForViewers = DiscoverabilityScoreMaxMetrics.VIEWERS_COUNT * DiscoverabilityScoreWeightage.VIEWERS_WEIGHTAGE;
				}
				else{
					scoreForViewers = countOfViewers * DiscoverabilityScoreWeightage.VIEWERS_WEIGHTAGE;
				}
			}
			int scoreForEditors = 0;
			if(assetLogRepo !=null){
				int countOfEditors = 0;
				if(assetLogRepo.getEditors()!=null && assetLogRepo.getEditors().size()>0){
					// Iterate over every viewer and get the count
					for(UserAccessibilityCountInfo userAccessCntInfo : assetLogRepo.getEditors()){
						if(userAccessCntInfo.getCount()>0){
							countOfEditors += userAccessCntInfo.getCount();
						}
					}
				}
				if(countOfEditors >= DiscoverabilityScoreMaxMetrics.EDITORS_COUNT){
					scoreForEditors = DiscoverabilityScoreMaxMetrics.EDITORS_COUNT * DiscoverabilityScoreWeightage.EDITORS_WEIGHTAGE;
				}
				else{
					scoreForEditors = countOfEditors * DiscoverabilityScoreWeightage.EDITORS_WEIGHTAGE;
				}
			}
			int scoreFromDescription = 0;
			if(assetUser.getAsset_description()!=null){
				int countOfWords = assetUser.getAsset_description().split("\\s+").length;
				if(countOfWords >= DiscoverabilityScoreMaxMetrics.DESCRIPTION_COUNT){
					scoreFromDescription = DiscoverabilityScoreMaxMetrics.DESCRIPTION_COUNT * DiscoverabilityScoreWeightage.DESCRIPTION_WEIGHTAGE;
				}
				else{
					scoreFromDescription = countOfWords * DiscoverabilityScoreWeightage.DESCRIPTION_WEIGHTAGE;
				}
			}
			int scoreFromEndorsement_Trusted = 0;
			if(assetUser.getTrusted()!=null){
				if(assetUser.getTrusted().size()>=DiscoverabilityScoreMaxMetrics.TRUSTED_COUNT){
					scoreFromEndorsement_Trusted =  DiscoverabilityScoreMaxMetrics.TRUSTED_COUNT * DiscoverabilityScoreWeightage.TRUSTED_WEIGHTAGE;
				}
				else{
					scoreFromEndorsement_Trusted = assetUser.getTrusted().size() * DiscoverabilityScoreWeightage.TRUSTED_WEIGHTAGE;
				}
			}
			int scoreFromEndorsement_deprecated = 0;
			if(assetUser.getDeprecated()!=null){
				if(assetUser.getDeprecated().size()>=DiscoverabilityScoreMaxMetrics.DEPRECATED_COUNT){
					scoreFromEndorsement_deprecated =  DiscoverabilityScoreMaxMetrics.DEPRECATED_COUNT * DiscoverabilityScoreWeightage.DEPRECATED_WEIGHTAGE;
				}
				else{
					scoreFromEndorsement_deprecated = assetUser.getDeprecated().size() * DiscoverabilityScoreWeightage.DEPRECATED_WEIGHTAGE;
				}
			}
			int scoreFromEndorsement_erroneous = 0;
			if(assetUser.getErroneous()!=null){
				if(assetUser.getErroneous().size()>=DiscoverabilityScoreMaxMetrics.EDITORS_COUNT){
					scoreFromEndorsement_erroneous =  DiscoverabilityScoreMaxMetrics.EDITORS_COUNT * DiscoverabilityScoreWeightage.ERRONEOUS_WEIGHTAGE;
				}
				else{
					scoreFromEndorsement_erroneous = assetUser.getErroneous().size() * DiscoverabilityScoreWeightage.ERRONEOUS_WEIGHTAGE;
				}
			}
			int totalScore = scoreOfTags + scoreOfRelatedAssets + scoreForViewers + scoreForEditors + scoreFromDescription + scoreFromEndorsement_Trusted + scoreFromEndorsement_deprecated + scoreFromEndorsement_erroneous; 
			logger.info("graphiti-tid:{}. The discoverability score calculated for asset with Id:{} is {}",graphiti_tid,assetId,totalScore);
			/*JSONObject jsonObject = new JSONObject();
			// Calculate Range here
			jsonObject.put("discoverabilityScore", Math.round(Utils.calculateRange(totalScore, 0, 130, 0, 100)));*/
			if(commitDiscoverabilityScore){
				assetUser.setDiscoverabilityScore((int)Math.round(Utils.calculateRange(totalScore, 0, 130, 0, 100)));
				assetUsersRepository.save(graphiti_tid, memberId, assetUser);
			}
			return new ResponseEntity<>(""+totalScore+"",HttpStatus.OK);
		}
		catch(Exception e){
			logger.error("graphiti-tid:{}.Error calculating discoverability score for asset with Id:{}",graphiti_tid,assetId);
			return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@RequestMapping(value = "/ext/asset/{assetId}/discoverabilityScore", method = RequestMethod.GET, produces="application/json")
	public ResponseEntity<?> extgetDiscovabilityScore(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "commitDiscoverabilityScore",defaultValue = "false",required=false) boolean commitDiscoverabilityScore,
			@PathVariable(value = "assetId") String assetId){
		return getDiscovabilityScore(graphiti_tid,memberId,orgId,commitDiscoverabilityScore,assetId);
	}
	
	@RequestMapping(value = "/asset",method = RequestMethod.GET,produces = MediaType.TEXT_PLAIN_VALUE)
	public ResponseEntity<String> checkNameAvailability(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@QueryParam(value = "assetName") String assetName){
		logger.info("graphiti-tid:{}.Checking if a asset exists with the name:{}",graphiti_tid,assetName);
		AssetUsers assetUsers = assetUsersRepository.getAssetBasedOnNameAndOrganization(assetName,orgId);
		if(assetUsers!=null){
			return new ResponseEntity<>(Boolean.FALSE.toString(),HttpStatus.OK); 
		}
		else{
			return new ResponseEntity<>(Boolean.TRUE.toString(),HttpStatus.OK); 
		}
	}
	
	@RequestMapping(value = "/ext/asset/{assetName}",method = RequestMethod.GET,produces = MediaType.TEXT_PLAIN_VALUE)
	public ResponseEntity<String> extcheckNameAvailability(@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetName") String assetName){
		return checkNameAvailability(graphiti_tid,memberId,orgId,assetName);
	}
	
	@RequestMapping(value = "/asset/{userId}/accessDetails", method = RequestMethod.GET)
	public ResponseEntity<UserAssetsWithAssetName> accessDetails(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "memberId") String memberId,
			@PathVariable(value = "userId", required = true) String userId) {
		UserAssetsWithAssetName userAssets = userAssetsRepository.getAllUserAssets(graphiti_tid, userId, orgId);
		if (userAssets == null) {
			logger.info("graphiti-tid:{}.User Assets not found.", graphiti_tid);
			// TODO
		}
		return new ResponseEntity<UserAssetsWithAssetName>(userAssets, HttpStatus.OK);
	}
	
	@RequestMapping(value = "/asset/{userId}/accessibleDataAssets", method = RequestMethod.GET)
	public ResponseEntity<JSONObject> accessibleTables(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "memberId") String memberId,
			@PathVariable(value = "userId", required = true) String userId) {
		try{
			UserAssetsWithAssetName userAssets = userAssetsRepository.getAllUserAssets(graphiti_tid, userId, orgId);
			JSONObject assetInfoForWhichUserHasPermission = new JSONObject();
			JSONArray arrayOfAssetObjects = new JSONArray();
			// Now once we have got the list of all assets accessible to the user
			// we have to filter out the DATASETS in this case
			String[] permissionsToBeConsidered = new String[]{"getCreatorOf","getAuthorOf","getAdminOf","getViewerOf"};
			for(String permission : permissionsToBeConsidered){
				Method method  = userAssets.getClass().getMethod(permission,null);
				List<UserAssetsInfoWithName> assetList = (List<UserAssetsInfoWithName>) method.invoke(userAssets);
				for(UserAssetsInfoWithName assetInfo : assetList){
					if(assetInfo.getAssetType().equals(AssetType.DATASET)){
						JSONObject jsonAssetInfo = new JSONObject();
						jsonAssetInfo.put("name", assetInfo.getAssetName());
						jsonAssetInfo.put("id", assetInfo.getId());
						arrayOfAssetObjects.add(jsonAssetInfo);
					}
				}
			}
			if (userAssets == null) {
				logger.info("graphiti-tid:{}.User Assets not found.", graphiti_tid);
				// TODO
			}
			assetInfoForWhichUserHasPermission.put("accessibleDataAssetInformation", arrayOfAssetObjects);
			return new ResponseEntity<JSONObject>(assetInfoForWhichUserHasPermission,HttpStatus.OK);
		}
		catch(NoSuchMethodException|InvocationTargetException|IllegalAccessException e){
			// TODO
			return null;
		}
	}
	
	@RequestMapping(value = "/ext/asset/{userId}/accessibleDataAssets", method = RequestMethod.GET)
	public ResponseEntity<JSONObject> extaccessibleTables(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "memberId") String memberId,
			@PathVariable(value = "userId", required = true) String userId) {
		return accessibleTables(graphiti_tid, orgId, memberId, userId);
	}
}
