package com.graphiti.controller;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
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
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.services.s3.model.ObjectMetadata;
import com.graphiti.Constants;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.DataSourceType;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.SQLCapability;
import com.graphiti.bean.SQLFilter;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.exceptions.FilterSetNotFoundException;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.exceptions.OperationNotAllowed;
import com.graphiti.externalServices.IdentityService;
import com.graphiti.repository.AmazonS3Repository;
import com.graphiti.repository.AssetUsersRepository;
import com.graphiti.repository.DataSetRepository;
import com.graphiti.repository.SQLAssetRepository;
import com.graphiti.repository.UserAssetsRepository;
import com.grapthiti.utils.Utils;

@RestController
public class DataSetController {

	private Logger logger = LoggerFactory.getLogger(DataSetController.class);
	private final String STRING_APPENDED_FOR_DS = "_DS";
	
	@Autowired
	DataSetRepository datasetRepository;
	
	@Autowired
	AssetUsersRepository assetUsersRepository;

	@Autowired
	UserAssetsRepository userAssetsRepository;

	@Autowired
	SQLAssetRepository sqlAssetRepository;
	
	@Autowired
	private AssetController assetController;
	

	@RequestMapping(value = "/asset/dataset", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> addDatasetAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid, @RequestBody DataSet dataset) {
		datasetRepository.save(graphiti_tid, memberId, dataset);
		return new ResponseEntity<>(null, HttpStatus.CREATED);
	}

	@RequestMapping(value="/asset/dataset/attachToSQL",method = RequestMethod.POST, produces = "application/json")
	public ResponseEntity<?> attachDataAssetToSQL(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "IsRelatedAsset",defaultValue="false",required=false) boolean isRelatedAsset,
			@RequestHeader(value = "sqlAssetId",required=true) String sqlAssetId,
			@RequestBody AssetDetailedInformation assetDetailInformation){
		logger.info("graphiti-tid:{}.Creating new AssetUsers object for DataAsset",graphiti_tid);
		AssetUsersInfo creator = new AssetUsersInfo(memberId, assetDetailInformation.getMemberName(),assetDetailInformation.getUsertype());
		AssetUsers assetUserForDataSet = new AssetUsers(assetDetailInformation.getDataAssetName(), AssetType.DATASET,
				creator, assetDetailInformation.getOrgId());
		String assetIdForDataSet = assetUsersRepository.save(graphiti_tid, memberId, assetUserForDataSet);
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
		UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(sqlAssetId, AssetType.SQL);
		dataset.getRelatedAssets().getInflow().add(inflowAssetInfo);
		// Save the DataSet has been added
		datasetRepository.save(graphiti_tid, memberId, dataset);
		
		// Add dataAsset to the outflow 
		// of the sqlAsset
		SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(sqlAssetId, orgId);
		UserAssetsInfo dataAssetInfo = new UserAssetsInfo(dataset.getId(),AssetType.DATASET);
		sqlAsset.getRelatedAssets().getOutflow().add(dataAssetInfo);
		sqlAssetRepository.save(graphiti_tid, memberId, sqlAsset);
		
		JSONObject responseJSONObject = new JSONObject();
		responseJSONObject.put("dataSetAssetId",assetIdForDataSet);
		ResponseEntity entity = assetController.getDiscovabilityScore(graphiti_tid,memberId,assetDetailInformation.getOrgId(),true,assetIdForDataSet);
		int discoverabilityScore = Integer.parseInt((String) entity.getBody());
		responseJSONObject.put("dataSetAssetId" + STRING_APPENDED_FOR_DS , discoverabilityScore);
		return new ResponseEntity<JSONObject>(responseJSONObject, HttpStatus.CREATED);
	}

	@RequestMapping(value="/asset/dataset/{assetId}",method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getDatasetAsset(@RequestHeader(value="memberId") String memberId,@RequestHeader(value="graphiti-tid")String graphiti_tid,@RequestHeader(value="orgId")String orgId,@PathVariable String assetId){
		DataSet dataSet = datasetRepository.get(graphiti_tid,memberId,orgId,assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		return new ResponseEntity<>(dataSet,HttpStatus.OK);
	}
	
	@RequestMapping(value="/ext/asset/dataset/{assetId}/filtersMiniInformation",method = RequestMethod.GET)
	public ResponseEntity<?> getFiltersMiniInformation(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId){
		DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		else{
			List<SQLCapability> sqlCapabilitiesList = dataSet.getSqlCapabilities();
			JSONObject returningJSONResponse = new JSONObject();
			String defaultFilterSet = dataSet.getIdOfDefaultFilter();
			boolean isDefaultFilterSetIdFound = false;
			if(sqlCapabilitiesList!=null && sqlCapabilitiesList.size()>0){
				JSONArray jsonArray = new JSONArray();
				for(SQLCapability sqlCapability : sqlCapabilitiesList){
					if(defaultFilterSet!=null && defaultFilterSet.equalsIgnoreCase(sqlCapability.getFilterSetId())){
						isDefaultFilterSetIdFound  = true;
					}
					JSONObject filterInformation = new JSONObject();
					filterInformation.put("id", sqlCapability.getFilterSetId());
					filterInformation.put("name", sqlCapability.getFilterSetName());
					filterInformation.put("type", "NORMAL_FILTER");
					jsonArray.add(filterInformation);
				}
				returningJSONResponse.put("normalFilter", jsonArray);
			}
			List<SQLFilter> sqlFilterList = dataSet.getSqlFilters();
			if(sqlFilterList!=null && sqlFilterList.size()>0){
				JSONArray jsonArray = new JSONArray();
				for(SQLFilter sqlFilter : sqlFilterList){
					if(defaultFilterSet!=null && defaultFilterSet.equalsIgnoreCase(sqlFilter.getFilterSetId())){
						isDefaultFilterSetIdFound  = true;
					}
					JSONObject filterInformation = new JSONObject();
					filterInformation.put("id", sqlFilter.getFilterSetId());
					filterInformation.put("name", sqlFilter.getName());
					filterInformation.put("type", "SQL_ONLY_FILTER");
					jsonArray.add(filterInformation);
				}
				returningJSONResponse.put("sqlOnlyFilter", jsonArray);
			}
			if(isDefaultFilterSetIdFound){
				returningJSONResponse.put("defaultFilterId",defaultFilterSet);
			}
			return  new ResponseEntity<>(returningJSONResponse, HttpStatus.OK);
		}
	}
	
	@RequestMapping(value="/ext/asset/dataset/{assetId}/sqlCapability/{filterId}",method = RequestMethod.GET,produces="application/json")
	public ResponseEntity<?> getSQLCapabilityById(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@PathVariable String filterId){
			DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
			if(dataSet == null) {
				return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
			}
			else{
				List<SQLCapability> sqlCapabilitiesList = dataSet.getSqlCapabilities();
				boolean foundFilterSetId = false;
				int i = 0;
				if(sqlCapabilitiesList!=null && sqlCapabilitiesList.size()>0){
					for(i=0;i<sqlCapabilitiesList.size();i++){
						SQLCapability sqlCapability = sqlCapabilitiesList.get(i);
						if(sqlCapability.getFilterSetId().equalsIgnoreCase(filterId)){
							foundFilterSetId = true;
							break;
						}
					}
				}
				if(foundFilterSetId==false){ // This means that there is no filterSet with this id which has been passed in the request
					throw new FilterSetNotFoundException("Filter Set Not Found Exception");
				}
				else{
					return new ResponseEntity<>(sqlCapabilitiesList.get(i),HttpStatus.OK);
				}
			}	
			//return new ResponseEntity<>(null,HttpStatus.OK);
	}
	
	@RequestMapping(value="/ext/asset/dataset/{assetId}/sqlCapability",method = RequestMethod.PUT,consumes="application/json",produces="text/plain")
	public ResponseEntity<?> storeSQLCapabilityInDataSet(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@RequestBody SQLCapability sqlCapability) {
		// Check if the dataAsset exist first
		DataSet dataSet = datasetRepository.get(graphiti_tid,memberId,orgId,assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		String filterId = datasetRepository.storeOrUpdateFilter(graphiti_tid,assetId,orgId,"sqlCapability", sqlCapability);//(assetId, updateFields);
		if(filterId!=null){
			return new ResponseEntity<String>(filterId,HttpStatus.OK);
		}
		else{
			// TODO - Error while updating SQLCapability. Throw Exception
			return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR); 
		}
	}
	
	// Updating an exisiting name of a filter
	@RequestMapping(value="/asset/dataset/{assetId}/filter/{filterId}/filterName",method = RequestMethod.PUT,consumes="text/plain")
	public ResponseEntity<?> updateFilterName(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@PathVariable String filterId,
			@RequestBody String newFilterName) {
		// Get DataSet details
		logger.info("graphiti-tid:{}.Getting data set infromation",graphiti_tid);
		DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		boolean filterFound = false;
		if(dataSet.getSqlCapabilities()!=null){
		logger.info("graphiti-tid:{}.Searching for filter in SQLCapabilities",graphiti_tid);
			for(SQLCapability sqlCapability : dataSet.getSqlCapabilities()){
				if(sqlCapability.getFilterSetId().equalsIgnoreCase(filterId)){
					logger.info("graphiti-tid:{}.Filter Found in SQLCapabilities",graphiti_tid);
					sqlCapability.setFilterSetName(newFilterName);
					filterFound = true;
					break;
				}
			}
		}
		if(!filterFound && dataSet.getSqlFilters()!=null){
			logger.info("graphiti-tid:{}.Searching for filter in SQLOnlyFilter",graphiti_tid);
			for(SQLFilter sqlFilter : dataSet.getSqlFilters()){
				if(sqlFilter.getFilterSetId().equalsIgnoreCase(filterId)){
					logger.info("graphiti-tid:{}.Filter Found in SQLOnly Filter",graphiti_tid);
					sqlFilter.setName(newFilterName);
					filterFound = true;
					break;
				}
			}
		}
		if(filterFound){
			datasetRepository.save(graphiti_tid, memberId, dataSet);
			return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
		}
		else{ // filter not found with that Id
			throw new FilterSetNotFoundException("Filter Not Found with Id:"+filterId);
		}
		
	}
	
	@RequestMapping(value="/ext/asset/dataset/{assetId}/filter/{filterId}/filterName",method = RequestMethod.PUT,consumes="text/plain")
	public ResponseEntity<?> extupdateFilterName(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@PathVariable String filterId,
			@RequestBody String newFilterName) {
		return updateFilterName(memberId, graphiti_tid, orgId, assetId, filterId, newFilterName);
	}
	
	@RequestMapping(value="/asset/dataset/{assetId}/sqlCapability/{filterId}",method = RequestMethod.DELETE)
	public ResponseEntity<?> deleteSQLCapabilityInDataSet(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@PathVariable String filterId) {
		// First step is to check if the defaultFilterId 
		// is equal to the filterId which the user has requested to be deleted.
		// If that is the case then we have to stop him.
		DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		if (dataSet.getIdOfDefaultFilter() != null
				&& dataSet.getIdOfDefaultFilter().equalsIgnoreCase(filterId)) {
			throw new OperationNotAllowed("Deleting a Filter Set which is referenced as a default filter set is not allowed");
		}
		if(dataSet.getSqlCapabilities()==null){
			return new ResponseEntity<>("There is not filter to delete", HttpStatus.BAD_REQUEST);
		}
		else{
			List<SQLCapability> sqlCapabilitiesList = dataSet.getSqlCapabilities();
			boolean foundFilterSetId = false;
			for(SQLCapability sqlCapability:sqlCapabilitiesList){
				if(sqlCapability.getFilterSetId().equalsIgnoreCase(filterId)){
					foundFilterSetId = true;
					break;
				}
			}
			if(foundFilterSetId==false){ // This means that there is no filterSet with this id which has been passed in the request
				throw new FilterSetNotFoundException("Filter Set Not Found Exception");
			}
		}
		boolean result = datasetRepository.deleteSQLCapability(graphiti_tid, memberId, orgId, assetId, filterId);//(assetId, updateFields);
		if(result){
			return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
		}
		else{
			// TODO - Error while deleting the SQLCapability.Throw Exception
			return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR); 
		}
	}
	
	/**
	 * This is a method to store query in S3 bucket
	 * and it returns the uploaded link
	 * 
	 * @param bucketName
	 * @param queryString
	 * @return
	 */
	private String uploadQueryToS3(String graphiti_tid,String bucketName,String queryString){
		try{
			InputStream inputStream = new ByteArrayInputStream(queryString.getBytes("UTF-8"));
			ObjectMetadata objectMetadata = new ObjectMetadata();
			// AWS-S3 warns to set the content-length
			// but not mandatory
			// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
			objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
			AmazonS3Repository s3Repository = new AmazonS3Repository();
			Properties properties = Constants.getInstance().properties;
			String sqlPathName = properties.getProperty("path-sql-s3");
			String objectKey = sqlPathName + "/" + Utils.generateRandomAlphaNumericString(10);
			String s3FileLink = s3Repository.upload(bucketName, objectKey, inputStream,
					objectMetadata);
			return s3FileLink;
		}
		catch(Exception e){ // if there is any kind of exception here then return null
			logger.error("graphiti-tid:{}.Error while uploading file to S3",graphiti_tid);
			return null;
		}
	}
	
	
	
	/**
	 * ***If the filterId is set only then it means that 
	 * its an update otherwise its a new filter that is getting created ***
	 * Sample Body - If New FilterSet
	 * {
	 * 		"sqlQuery" "select * from abcd",
	 * 		"name" : "Name of the filterSet"
	 * }
	 * 
	 * Sample Body - If Existing FilterSet
	 * {
	 * 		"filterSetId"  " "abcde",
	 * 		"sqlQuery" "select * from abcd",
	 * 		"name" : "Name of the filterSet"
	 * }
	 * 
	 * @param memberId
	 * @param graphiti_tid
	 * @param orgId
	 * @param filterId
	 * @param assetId
	 * @param sqlQuery
	 * @return
	 */
	@RequestMapping(value="/asset/dataset/{assetId}/sqlOnlyFilters",method = RequestMethod.PUT,consumes="application/json",produces="text/plain")
	public ResponseEntity<?> storeSQLOnlyFilterInDataSet(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@RequestBody(required=true) String filterInformation) {
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject incomingObject = (JSONObject) jsonParser.parse(filterInformation);
			String sqlQuery = (String) incomingObject.get("sqlQuery");
			if(sqlQuery==null || sqlQuery.trim().length()==0){
				logger.error("graphiti-tid:{}.SQL Filter cannot have empty content",graphiti_tid);
				return new ResponseEntity<>("SQL Filter cannot have empty content",HttpStatus.BAD_REQUEST);
				
			}
			// Get the filterId
			String filterId = (String) incomingObject.get("filterSetId");
			
			
			IdentityService identityService = new IdentityService();
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			if(filterId==null || filterId.trim().length()==0){ // Not set means create a new one
				// Steps
				// 1. First get the S3 bucket for this organizationId
				// 2. Then upload the SQL to S3
				// 3. Store the details in DataSet 
				String linkOfS3 = uploadQueryToS3(graphiti_tid,organization.getS3BucketName(),sqlQuery);
				if(linkOfS3==null){
					return new ResponseEntity<>("Error while storing filterSet",HttpStatus.INTERNAL_SERVER_ERROR);
				}
				// Construct the object
				SQLFilter sqlFilter = new SQLFilter(null,(String) incomingObject.get("name"),linkOfS3);
				String filterSetId = datasetRepository.storeOrUpdateFilter(graphiti_tid,assetId,orgId,"sqlFilters", sqlFilter);
				if(filterSetId!=null){
					logger.info("graphiti-tid:{}. Sucessfully stored filter for asset with Id:",graphiti_tid,assetId);
					return new ResponseEntity<>(filterSetId,HttpStatus.OK);
				}
				else{
					logger.error("graphiti-tid:{}. FilterSet could not be stored in database");
					return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
				}	
			}
			else{
				// Get the dataSet details
				DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
				// Iterate over the list of SQLOnlyFilters
				List<SQLFilter> listOfSQLFilters = dataSet.getSqlFilters();
				// Iterate over the filter to 
				if(listOfSQLFilters==null){
					logger.error("graphiti-tid:{}. Filter does not exist with this id:{}",graphiti_tid,filterId);
					throw new FilterSetNotFoundException("FilterSet does not exist with the Id:"+filterId);
				}
				else{
					int iterator = 0;
					// Iterate over the filters
					for(iterator=0;iterator<listOfSQLFilters.size();iterator++){
						if(listOfSQLFilters.get(iterator).getFilterSetId().equalsIgnoreCase(filterId)){
							break;
						}
					}
					if(iterator >= listOfSQLFilters.size()){
						logger.error("graphiti-tid:{}. Filter does not exist with this id:{}",graphiti_tid,filterId);
						throw new FilterSetNotFoundException("FilterSet does not exist with the Id:"+filterId);
					}
					else{
						SQLFilter oldSQLFilter = listOfSQLFilters.get(iterator);
						String linkOfS3 = oldSQLFilter.getSqlFilterURLInS3();
						//String key = oldSQLFilter.getSqlFilterURLInS3().substring(oldSQLFilter.getSqlFilterURLInS3().lastIndexOf("/")+1);
						String key = linkOfS3.substring(linkOfS3.lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
						boolean statusOfDeleting = new Utils().deleteExistingObjectFromS3(graphiti_tid, organization.getS3BucketName(), key);
						if(statusOfDeleting==false){
							return new ResponseEntity<>("Error while updating filter",HttpStatus.INTERNAL_SERVER_ERROR);
						}
						linkOfS3 = uploadQueryToS3(graphiti_tid,organization.getS3BucketName(),sqlQuery);
						if(linkOfS3==null){
							return new ResponseEntity<>("Error while storing filterSet",HttpStatus.INTERNAL_SERVER_ERROR);
						}
						// Construct the object
						SQLFilter sqlFilter = new SQLFilter((String) incomingObject.get("filterSetId"),(String) incomingObject.get("name"),linkOfS3);
						// Once the object is constructed 
						String filterSetId = datasetRepository.storeOrUpdateFilter(graphiti_tid,assetId,orgId, "sqlFilters", sqlFilter);
						if(filterSetId!=null){
							logger.info("graphiti-tid:{}. Sucessfully updated filter for asset with Id:",graphiti_tid,assetId);
							return new ResponseEntity<>(filterSetId,HttpStatus.OK);
						}
						else{
							logger.error("graphiti-tid:{}. FilterSet could not be updated in database");
							return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
						}
					}
				}
			}
		}
		catch(ParseException e){
			logger.error("graphiti-tid:{}. Error while parsing incoming JSON request",graphiti_tid);
			return new ResponseEntity<>("Error while parsing incoming JSON request",HttpStatus.BAD_REQUEST);
		}
	}
	
	@RequestMapping(value="/asset/dataset/{assetId}/sqlOnlyFilters/{filterId}",method = RequestMethod.DELETE)
	public ResponseEntity<?> deleteSQLOnlyFilterInDataSet(
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@PathVariable String filterId) {
		// First step is to check if the defaultFilterId 
		// is equal to the filterId which the user has requested to be deleted.
		// If that is the case then we have to stop him.
		DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		if (dataSet.getIdOfDefaultFilter() != null
				&& dataSet.getIdOfDefaultFilter().equalsIgnoreCase(filterId)) {
			throw new OperationNotAllowed("Deleting a Filter Set which is referenced as a default filter set is not allowed");
		}
		if(dataSet.getSqlFilters()==null){
			throw new OperationNotAllowed("No filter set exists to delete");
		}
		else{
			IdentityService identityService = new IdentityService();
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			List<SQLFilter> sqlFilterList = dataSet.getSqlFilters();
			boolean foundFilterSetId = false;
			int iterator = 0;
			for(iterator=0;iterator<sqlFilterList.size();iterator++){
				SQLFilter sqlFilter = sqlFilterList.get(iterator);
				if(sqlFilter.getFilterSetId().equalsIgnoreCase(filterId)){
					foundFilterSetId = true;
					break;
				}
			}
			if(foundFilterSetId==false){ // Thios means that there is no filterSet with this id which has been passed in the request
				throw new FilterSetNotFoundException("Filter Set Not Found Exception");
			}
			// We have to delete the file from S3 
			SQLFilter targetSQLFilter = sqlFilterList.get(iterator);
			String linkOfS3 = targetSQLFilter.getSqlFilterURLInS3();
			//String key = oldSQLFilter.getSqlFilterURLInS3().substring(oldSQLFilter.getSqlFilterURLInS3().lastIndexOf("/")+1);
			String key = linkOfS3.substring(linkOfS3.lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
			// Here irrespective of the status of delete 
			// we have to delete the entry of the filter set in mongoDB
			new Utils().deleteExistingObjectFromS3(graphiti_tid, organization.getS3BucketName(), key);
			boolean result = datasetRepository.deleteSQLOnlyFilter(graphiti_tid, memberId, orgId, assetId, filterId);//(assetId, updateFields);
			if(result){
				return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
			}
			else{
				// TODO - Error while deleting the SQLCapability.Throw Exception
				return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR); 
			}
		}
	}
	
	@RequestMapping(value = "/asset/tableNames", method = RequestMethod.POST, consumes = "text/plain", produces = "application/json")
	public ResponseEntity<?> getTableNamesForDataAsset(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestBody String commaSeparatedAssetIds) {

			String[] arrayOfAssetNames = commaSeparatedAssetIds.split(",");
			List<DataSet> listOfDataSetBasedOnNamesAndOrgId = datasetRepository.getListOfDataSetBasedOnIds(orgId, arrayOfAssetNames);
			// Once you get the list of DataSet 
			// iterate over those and get create a JSONArray response consisting 
			// of assetId and corresponding tableName
			JSONArray returningJSONArray = new JSONArray();
			for(DataSet dataSet : listOfDataSetBasedOnNamesAndOrgId){
				JSONObject object = new JSONObject();
				object.put("id", dataSet.getId());
				object.put("tableName", dataSet.getCacheTableName());
				returningJSONArray.add(object);
			}
			return new ResponseEntity<>(returningJSONArray,HttpStatus.OK);
	}
	
	@RequestMapping(value="/asset/dataset/{assetId}/setDefaultFilter/{filterId}",method = RequestMethod.PUT)
	public ResponseEntity<?> setDefaultFilter(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable String assetId,
			@PathVariable String filterId){
		// First check if the filterId that has been sent in the request 
		// exists or not
		DataSet dataSet = datasetRepository.get(graphiti_tid, memberId, orgId, assetId);
		if(dataSet == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		if(dataSet.getSqlCapabilities()==null && dataSet.getSqlFilters()==null){
			throw new OperationNotAllowed("No filter set exists to set a default filter set.First create one filter set");
		}
		else{
			List<SQLCapability> sqlCapabilitiesList = dataSet.getSqlCapabilities();
			boolean foundFilterSetId = false;
			// check SQLCapability first
			if(sqlCapabilitiesList!=null){
				for(SQLCapability sqlCapability:sqlCapabilitiesList){
					if(sqlCapability.getFilterSetId().equalsIgnoreCase(filterId)){
						foundFilterSetId = true;
						break;
					}
				}
			}
			// Check SQLFilter if foundFilterSetId is not set
			// then only search for the id in SQLFilter list;
			if(foundFilterSetId==false){
				List<SQLFilter> sqlFilterList = dataSet.getSqlFilters();
				if(sqlFilterList!=null){
					for(SQLFilter sqlFilter:sqlFilterList){
						if(sqlFilter.getFilterSetId().equalsIgnoreCase(filterId)){
							foundFilterSetId = true;
							break;
						}
					}
				}
			}
			if(foundFilterSetId==false){ // Thios means that there is no filterSet with this id which has been passed in the request
				throw new FilterSetNotFoundException("Filter Set Not Found Exception");
			}
			Map<String, Object> updateFields = new HashMap<String,Object>(1);
			updateFields.put("idOfDefaultFilter",filterId);
			Boolean result = datasetRepository.updateDataSetAsset(assetId, updateFields);
			if(result){
				return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
			}
			else{
				// TODO - Error while setting the default filter set
				return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR); 
			}
	   }
	}
}
