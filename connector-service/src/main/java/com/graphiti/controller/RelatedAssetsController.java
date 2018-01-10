package com.graphiti.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.DataSourceType;
import com.graphiti.bean.InjestionOperationType;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.User;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.bean.UserType;
import com.graphiti.client.externalServices.AssetService;
import com.graphiti.client.externalServices.IdentityService;
import com.graphiti.client.externalServices.SearchService;
import com.graphiti.exceptions.DatabaseConnectionException;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.NoDataReturnedFromQuery;
import com.graphiti.repository.AmazonS3Repository;
import com.graphiti.repository.CacheRepository;
import com.grapthiti.utils.Utils;


@RestController
public class RelatedAssetsController {

	Logger logger = LoggerFactory.getLogger(RelatedAssetsController.class);
	
	private static String REGEX_FOR_TABLE_PLACEHOLDER = "(?<=\\[\\[).+?(?=\\]\\])";
	private final String STRING_APPENDED_FOR_DS = "_DS";
	public static final String DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME = "DATASET - ";
	
	
	@Autowired
	CacheRepository cacheRepository; 
	
	@RequestMapping(value="/relatedAsset",method= RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> generateRelatedAssets(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@RequestBody String queryAndAssetDetails) {
			try{
				
				// setting default value for operationType
				if(operationType==null){
					operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
				}
				
				// check if the query field is not null
				JSONParser parser = new JSONParser();
				JSONObject responseJSONObject = new JSONObject();
				Object obj = parser.parse(queryAndAssetDetails);
				JSONObject queryDetailsInJSON = (JSONObject) obj;
				IdentityService identityService = new IdentityService();
				AssetService assetService = new AssetService();
				User user = identityService.getUser(memberId, graphiti_tid);
				Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
				if(user==null){
						throw new MemberNotFoundException("Member not found");
				}
				String queryString = (String) queryDetailsInJSON.get("query");
				String sqlAssetName = (String) queryDetailsInJSON.get("sqlAssetName");
				String dataAssetName = (String) queryDetailsInJSON.get("dataAssetName");
				
				if(queryString==null || queryString.trim().length()==0){
					return new ResponseEntity<>("Query cannot be empty",HttpStatus.BAD_REQUEST);
				}
				if(sqlAssetName==null || sqlAssetName.trim().length()==0){
					return new ResponseEntity<>("Asset Name cannot be empty",HttpStatus.BAD_REQUEST);
				}
				queryString = replacePlaceHoldersInQueryWithAssetId(graphiti_tid,memberId,organization.getId(),queryString);
				String queryStringToBeStoredInS3 = queryString;
				ArrayList<String> listOfAssetIds = new ArrayList<String>();
				Pattern REGEX = Pattern.compile(REGEX_FOR_TABLE_PLACEHOLDER);
				Matcher matcher = REGEX.matcher(queryString);
				while (matcher.find()) {
					// Add the table names
					listOfAssetIds.add(matcher.group());
				}
				queryString = replaceAssetIdWithTheirContent(graphiti_tid, memberId, organization.getId(), queryString);
				// The queryString now the assetNames replaced by the assetId
				queryString = queryString.replaceAll("\\{\\{","[[").replaceAll("\\}\\}", "]]"); // replacing {{ and }} braces
				String polishedQueryStringForQueryPurposes = queryString.replaceAll("\\[\\[","").replaceAll("\\]\\]", "");
				Object returningDataObject = cacheRepository.getDataFromCacheAlongWithMetadata(graphiti_tid, organization.getCacheDatabaseName(),polishedQueryStringForQueryPurposes, organization.getId());
				if(returningDataObject==null){
					logger.error("graphiti_tid:{}. Did not get any data");
					throw new NoDataReturnedFromQuery("Did not get any data");
				}
				if(returningDataObject!=null){
					if(operationType==InjestionOperationType.BOTH_SQL_AND_DATA || operationType==InjestionOperationType.ONLY_SQL){
						boolean injestSuccessStatus=false;
						JSONObject dataTypesInJSON = null;
						String tableNameInCache = null;
						if(operationType==InjestionOperationType.BOTH_SQL_AND_DATA){
							String databaseName = organization.getCacheDatabaseName();//(graphiti_tid,memberId);
							DataUtilController dataUtilController = new DataUtilController();
							// Get Data Types
							dataTypesInJSON =  (JSONObject) ((JSONObject) returningDataObject).get("dataTypes");
							// logger.info("DataTypesInJson: {}", dataTypesInJSON);
							tableNameInCache = Utils.generateRandomString(6);
							Boolean createTableStatus = dataUtilController.createTableInCacheBasedOnDatatypes(graphiti_tid,databaseName,tableNameInCache, dataTypesInJSON,organization.getId());
							injestSuccessStatus=false;
							if(createTableStatus){
								// Once the table has been created 
								// We need to injest the data
								Object returnedData = (JSONArray) ((JSONObject) returningDataObject).get("data");
								injestSuccessStatus = cacheRepository.injestDataIntoCache(graphiti_tid,databaseName, tableNameInCache, (JSONArray) returnedData, dataTypesInJSON,organization.getId());
							}
						}
						// This will only happen once injestion is true
						if(injestSuccessStatus==true || operationType==InjestionOperationType.ONLY_SQL){
							// upload the query to S3
							InputStream inputStream = new ByteArrayInputStream(queryStringToBeStoredInS3.getBytes("UTF-8"));
							ObjectMetadata objectMetadata = new ObjectMetadata();
							// AWS-S3 warns to set the content-length
							// but not mandatory
							// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
							objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
							AmazonS3Repository s3Repository = new AmazonS3Repository();
							Properties properties = Constants.getInstance().properties;
							String sqlPathName = properties.getProperty("path-sql-s3");
							String objectKey = sqlPathName + "/" + Utils.generateRandomAlphaNumericString(10);
							String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream,
									objectMetadata);
							logger.info("graphiti-tid:{}. Query uploaded to S3. Generated link:{}", graphiti_tid, s3FileLink);
							if(operationType==InjestionOperationType.ONLY_SQL){
								AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAssetName,AssetType.SQL,null,DataSourceType.APP,null,null,null,user.getOrganization(), s3FileLink);
								assetDetailInformation.setSourceAssetIds(listOfAssetIds);
								JSONObject responseObject = assetService.addSQLDetailedAsset(graphiti_tid, memberId, assetDetailInformation,true);
								String sqlAssetId = (String) responseObject.get("sqlAssetId");
								responseJSONObject.put("sqlAssetId", sqlAssetId);
								// Here we have to make a call to get discoverability score
								int sqlAssetdiscoverabilityScore = ((Long) responseObject.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
								SearchService searchService = new SearchService();
								// in this case the asset content is the query
								searchService.addAssetForSearch(graphiti_tid, sqlAssetId, sqlAssetName, AssetType.SQL.getValue(),(String) queryDetailsInJSON.get("query"), memberId, user.getName(),user.getOrganization(),null, null,sqlAssetdiscoverabilityScore);
							}
							else if(operationType==InjestionOperationType.BOTH_SQL_AND_DATA){ // If both SQL and Data together
								// Make an entry into asset
								// REST call to Asset service
								ArrayList<String> listOfColumnNames = new ArrayList<String>(dataTypesInJSON.keySet());
								AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAssetName,AssetType.SQL,tableNameInCache,DataSourceType.APP,null,listOfColumnNames,null,user.getOrganization(), s3FileLink);
								assetDetailInformation.setSourceAssetIds(listOfAssetIds);
								if(dataAssetName!=null && dataAssetName.length()>0){ 
									assetDetailInformation.setDataAssetName(dataAssetName);
								}
								else{
									String customDataAssetName = RelatedAssetsController.DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAssetName;
									assetDetailInformation.setDataAssetName(customDataAssetName);
								}
								JSONObject responseObject = assetService.addDetailedAsset(graphiti_tid, memberId, assetDetailInformation,true);
								String datasetAssetId = (String) responseObject.get("dataSetAssetId");
								String sqlAssetId = (String) responseObject.get("sqlAssetId");
								int dataAssetdiscoverabilityScore = ((Long) responseObject.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
								int sqlAssetdiscoverabilityScore = ((Long) responseObject.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
								responseJSONObject.put("sqlAssetId", sqlAssetId);
								responseJSONObject.put("dataSetAssetId", datasetAssetId);
								// This needs to be added for search
								SearchService searchService = new SearchService();
								String[] columnNamesInArray = new String[listOfColumnNames.size()];
								listOfColumnNames.toArray(columnNamesInArray);
								// search added for data asset
								// search added for data asset
								if(dataAssetName!=null && dataAssetName.length()>0){
									searchService.addAssetForSearch(graphiti_tid, datasetAssetId, dataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
								}
								else{
									// Here we are setting default name for the DataAsset
									String customDataAssetName = DataConnectorController.DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAssetName;
									searchService.addAssetForSearch(graphiti_tid, datasetAssetId, customDataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);	
								}
								// in this case the asset content is the query
								searchService.addAssetForSearch(graphiti_tid, sqlAssetId, sqlAssetName, AssetType.SQL.getValue(),(String) queryDetailsInJSON.get("query"), memberId, user.getName(),user.getOrganization(),null, null,sqlAssetdiscoverabilityScore);
								return new ResponseEntity<>(responseJSONObject,HttpStatus.OK);
							}
						}
					}
					else{ // This is when its NO_SQL_NO_DATA
						  // This is when injestSuccessStatus is set to false. 
						responseJSONObject.put("data", returningDataObject);
					}
					return new ResponseEntity<JSONObject>(responseJSONObject,HttpStatus.OK);
				}
			}
			catch(ParseException e){
				logger.error("graphiti_tid:{}. Error while parsing incoming JSON data");
				throw new JSONParseException("Unable to parse the query");
			}
			catch(Exception e){
				logger.error("graphiti_tid:{}.Error Message : {}",e.getMessage());
				return new ResponseEntity<>("Error creating related asset",HttpStatus.INTERNAL_SERVER_ERROR);
			}
			return new ResponseEntity<>(null,HttpStatus.OK);
	}
	
	@RequestMapping(value="/ext/relatedAsset",method= RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> extgenerateRelatedAssets(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@RequestBody String queryAndAssetDetails) {
		return generateRelatedAssets(graphiti_tid, memberId, orgId, operationType, queryAndAssetDetails);
	}
	
	@RequestMapping(value="/relatedAsset/sqlAsset/{assetId}",method= RequestMethod.PUT,consumes = "application/json")
	public ResponseEntity<?> updateAsset(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@PathVariable String assetId, @RequestBody String queryAndAssetDetails) {
		try{
			if(operationType==null){ // If operationType is null then in that case assign a default operation of BOTH_SQL_AND_DATA
				operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
			}
			// First we have to get SQLAsset information
			// Get outflow AssetId for the SQLAsset
			IdentityService identityService = new IdentityService(); 
			Organization organization = identityService.getOrganization(graphiti_tid, orgId); //getOrganizationUsingMemberId(graphiti_tid, memberId);
			AssetService assetService = new AssetService();
			SQLAsset sqlAsset = assetService.getSQLAsset(graphiti_tid, memberId, assetId, organization.getId());
			if(operationType!=null && !operationType.equals(InjestionOperationType.NO_SQL_NO_DATA)){
					if(sqlAsset.getRelatedAssets().getOutflow()!=null && sqlAsset.getRelatedAssets().getOutflow().size()>0){
						// We have to first search here if there is a DataAssetId on the outflow or not
						// Search for a DataAsset for this SQL
						boolean isDataSetAssetThereInOutflow = false;
						for(int itertr = 0;itertr<sqlAsset.getRelatedAssets().getOutflow().size();itertr++){
								UserAssetsInfo userAssetsInfo = sqlAsset.getRelatedAssets().getOutflow().get(itertr);
								if(userAssetsInfo.getAssetType()==AssetType.DATASET){
									operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
									isDataSetAssetThereInOutflow = true;
									break; // The reason of having break here is because every SQL will have only 1 DataSet in output flow
								}
						}
						if (isDataSetAssetThereInOutflow == true && 
									(operationType.equals(InjestionOperationType.ONLY_SQL) || 
												operationType.equals(InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL))) {
								// In this case we overrride
								operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
						}
					}
			}
			// check if the query field is not null
			JSONParser parser = new JSONParser();
			Object obj = parser.parse(queryAndAssetDetails);
			JSONObject queryDetailsInJSON = (JSONObject) obj;
			User user = identityService.getUser(memberId, graphiti_tid);
			if(user==null){
					throw new MemberNotFoundException("Member not found");
			}
			String queryString = (String) queryDetailsInJSON.get("query");
	    	queryString = replacePlaceHoldersInQueryWithAssetId(graphiti_tid,memberId,organization.getId(),queryString);
	    	String queryStringToBeStoredInS3 = queryString;
			ArrayList<String> listOfAssetIds = new ArrayList<String>();
			Pattern REGEX = Pattern.compile(REGEX_FOR_TABLE_PLACEHOLDER);
			Matcher matcher = REGEX.matcher(queryString);
			while (matcher.find()) {
				// Add the table names
				listOfAssetIds.add(matcher.group());
			}
			queryString = replaceAssetIdWithTheirContent(graphiti_tid, memberId, organization.getId(), queryString);
			// The queryString now the assetNames replaced by the assetId
			queryString = queryString.replaceAll("\\{\\{","[[").replaceAll("\\}\\}", "]]"); // replacing {{ and }} braces
			
			String polishedQueryStringForQueryPurposes = queryString.replaceAll("\\[\\[","").replaceAll("\\]\\]", "");
			Object returnedDataFromCache = cacheRepository.getDataFromCacheAlongWithMetadata(graphiti_tid, organization.getCacheDatabaseName(), polishedQueryStringForQueryPurposes, organization.getId());//(user.getOrganization(),graphiti_tid,connectionId, queryString);
			Object returnedData = returnedDataFromCache==null ? null : (JSONArray) ((JSONObject) returnedDataFromCache).get("data");
			if(returnedData!=null){
					if(operationType == InjestionOperationType.BOTH_SQL_AND_DATA || operationType == InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL){
							String databaseName = organization.getCacheDatabaseName();//(graphiti_tid,memberId);
							DataUtilController dataUtilController = new DataUtilController();
							JSONObject dataTypesInJSON;
							// Get Data Types
							if(((JSONObject) returnedDataFromCache).containsKey("dataTypes")){
								dataTypesInJSON = (JSONObject) ((JSONObject) returnedDataFromCache).get("dataTypes");
							}
							else{ // I think this is unused code
								dataTypesInJSON = (JSONObject) dataUtilController.getDataTypes(returnedData);
							}
							// The reason for having 0 is because there will be only 1 outflow for a SQlAsset
							String datasetAssetId =  null;//sqlAsset.getRelatedAssets().getOutflow().get(0).getId();
							String tableNameInCache = null;
							DataSet dataSetDetails = null;
							// Search for the DataAsset for this SQL
							if(operationType == InjestionOperationType.BOTH_SQL_AND_DATA){
								for(int itertr = 0;itertr<sqlAsset.getRelatedAssets().getOutflow().size();itertr++){
										UserAssetsInfo userAssetsInfo = sqlAsset.getRelatedAssets().getOutflow().get(itertr);
										if(userAssetsInfo.getAssetType()==AssetType.DATASET){
												datasetAssetId = userAssetsInfo.getId();
												break; // The reason of having break here is because every SQL will have only 1 DataSet in output flow
										}
								}
								dataSetDetails= assetService.getDataSetAssetDetails(graphiti_tid, memberId, datasetAssetId,organization.getId());
								tableNameInCache = dataSetDetails.getCacheTableName();
					        	boolean statusOfDeletionOfTable = cacheRepository.deleteDataSetFromCache(graphiti_tid, databaseName, dataSetDetails.getCacheTableName(),organization.getId());
					        	if(!statusOfDeletionOfTable){
					        		// TODO - throw Exception of failure to delete table
					        	}
							}
							else if(operationType == InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL){ // we have to create a new table in this case
								tableNameInCache = Utils.generateRandomString(6);
							}
							Boolean createTableStatus = dataUtilController.createTableInCacheBasedOnDatatypes(graphiti_tid,databaseName,tableNameInCache, dataTypesInJSON,organization.getId());
				        	boolean injestSuccessStatus=false;
				        	if(createTableStatus) {
				        		// Once the table has been created 
				        		// We need to injest the data
				        		injestSuccessStatus = cacheRepository.injestDataIntoCache(graphiti_tid,databaseName, tableNameInCache, (JSONArray) returnedData, dataTypesInJSON,organization.getId());
				        	}
				        	if(injestSuccessStatus==true) {
				        			// upload the query to S3
				        			InputStream inputStream = new ByteArrayInputStream(queryStringToBeStoredInS3.getBytes("UTF-8"));
				        			ObjectMetadata objectMetadata = new ObjectMetadata();
				        			// AWS-S3 warns to set the content-length
				        			// but not mandatory
				        			// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
				        			objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
				        			AmazonS3Repository s3Repository = new AmazonS3Repository();
				        			Properties properties = Constants.getInstance().properties;
				        			String sqlPathName = properties.getProperty("path-sql-s3");
				        			String objectKey = sqlPathName+"/"+Utils.generateRandomAlphaNumericString(10);
				        			// In this case we should just update the version of the file
				        			// String s3ObjectKey = sqlPathName + "/" + sqlAsset.getLinkOfS3().substring(sqlAsset.getLinkOfS3().lastIndexOf("/")+1);
				        			String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream, objectMetadata);
				        			logger.info("graphiti-tid:{}. Query uploaded to S3 for assetId:{}. Generated link:{}", graphiti_tid, assetId, s3FileLink);
				        			// Make an entry into asset
				        			// REST call to Asset service
				        			ArrayList<String> listOfColumnNames = new ArrayList<String>(dataTypesInJSON.keySet());
				        			String[] columnNamesInArray = new String[listOfColumnNames.size()];
				        			listOfColumnNames.toArray(columnNamesInArray);
				        			
				        			AssetDetailedInformation sqlAssetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.SQL,null,DataSourceType.APP,null,null,null,user.getOrganization(), s3FileLink);
				        			sqlAssetDetailInformation.setSourceAssetIds(listOfAssetIds);
				        			JSONObject  responseOfSQLAssetUpdate = assetService.updateAsset(graphiti_tid, memberId, orgId,assetId, sqlAssetDetailInformation, DataConnectorController.CACHE_UPDATE, DataSourceType.APP.getValue(),true);
				        			int discoverabilityScoreSQLAsset = ((Long) responseOfSQLAssetUpdate.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
									
				        			if(operationType == InjestionOperationType.BOTH_SQL_AND_DATA){
				        				AssetDetailedInformation dataSetAssetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,dataSetDetails.getName(),AssetType.DATASET,tableNameInCache,DataSourceType.APP,null,listOfColumnNames,null,user.getOrganization(), null);
					        			JSONObject responseOfDataAssetUpdate = assetService.updateAsset(graphiti_tid, memberId,orgId,datasetAssetId, dataSetAssetDetailInformation, DataConnectorController.CACHE_UPDATE, DataSourceType.APP.getValue(),true);
					        			int discoverabilityScoreDataAsset = ((Long) responseOfDataAssetUpdate.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
										
					        			// Search service call for updating Asset for DataSet
					        			StringBuffer commaSeparatedListOfFields = new StringBuffer();
					        			SearchService searchService = new SearchService();
					        			Asset solrAssetToUpdateForDataSetAsset = new Asset();
					        			// If another user has updated the asset then in that case
					        			// the last modified by should be the person who updated it
					        			solrAssetToUpdateForDataSetAsset.setLastModifiedBy_id(memberId);
					        			solrAssetToUpdateForDataSetAsset.setLastModifiedBy_name(user.getName());
					        			solrAssetToUpdateForDataSetAsset.setAssetId(datasetAssetId);
					        			solrAssetToUpdateForDataSetAsset.setDataColumns(columnNamesInArray);
					        			solrAssetToUpdateForDataSetAsset.setOrgId(organization.getId());
					        			solrAssetToUpdateForDataSetAsset.setDiscoverabilityScore(discoverabilityScoreDataAsset);
					        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
				                          						  .append("assetId,").append("dataColumns,").append("discoverabilityScore,").append("orgId");
					        			searchService.updateAssetForSearch(graphiti_tid, memberId,datasetAssetId, solrAssetToUpdateForDataSetAsset,commaSeparatedListOfFields.toString());
					        			commaSeparatedListOfFields = null;
					        			
					        			
					        			// Search service call for updating Asset for SQLAsset
					        			// This needs to be added for search
					        			commaSeparatedListOfFields = new StringBuffer();
					        			Asset solrAssetToUpdateForSQLAsset = new Asset();
					        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_id(memberId);
					        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_name(user.getName());
					        			solrAssetToUpdateForSQLAsset.setAssetId(assetId);
					        			String rawQueryString = (String) queryDetailsInJSON.get("query");
					        			solrAssetToUpdateForSQLAsset.setAssetContent(rawQueryString);
					        			solrAssetToUpdateForSQLAsset.setOrgId(organization.getId());
					        			solrAssetToUpdateForSQLAsset.setDiscoverabilityScore(discoverabilityScoreSQLAsset);
					        			solrAssetToUpdateForSQLAsset.setNumber_of_historical_versions(sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
					        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
		      						  							  .append("assetId,").append("assetContent,").append("orgId,").append("discoverabilityScore,").append("number_of_historical_versions");
					        			searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, solrAssetToUpdateForSQLAsset,commaSeparatedListOfFields.toString());
				        			}
				        			else if(operationType == InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL){
				        				// We have to create a new DataAsset 
				        				String dataAssetName = (String) queryDetailsInJSON.get("dataAssetName");
				        				AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.DATASET,tableNameInCache,DataSourceType.APP,null,listOfColumnNames,null,user.getOrganization(),null);
										if(dataAssetName!=null && dataAssetName.length()>0){ 
											assetDetailInformation.setDataAssetName(dataAssetName);
										}
										else{
											String customDataAssetName = DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAsset.getName();
											assetDetailInformation.setDataAssetName(customDataAssetName);
										}
										JSONObject responseObject = assetService.attachDetailedDataSetAsset(graphiti_tid, memberId, assetId,assetDetailInformation,true);
										
										datasetAssetId = (String) responseObject.get("dataSetAssetId");
										JSONObject responseJSONObject = new JSONObject();
										
										responseJSONObject.put("dataSetAssetId", datasetAssetId);
										// Here we have to make a call to get discoverability score
										int dataAssetdiscoverabilityScore = ((Long) responseObject.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
										
										// This needs to be added for search
										SearchService searchService = new SearchService();
										columnNamesInArray = new String[listOfColumnNames.size()];
										listOfColumnNames.toArray(columnNamesInArray);
										// search added for data asset
										if(dataAssetName!=null && dataAssetName.length()>0){
											searchService.addAssetForSearch(graphiti_tid, datasetAssetId, dataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
										}
										else{
											// Here we are setting default name for the DataAsset
											String customDataAssetName = DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAsset.getName();
											searchService.addAssetForSearch(graphiti_tid, datasetAssetId, customDataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
										}
										return new ResponseEntity<>(responseJSONObject,HttpStatus.CREATED);
				        			}
				        	}
						}
						else if(operationType == InjestionOperationType.ONLY_SQL){
							// upload the query to S3
		        			InputStream inputStream = new ByteArrayInputStream(queryStringToBeStoredInS3.getBytes("UTF-8"));
		        			ObjectMetadata objectMetadata = new ObjectMetadata();
		        			// AWS-S3 warns to set the content-length
		        			// but not mandatory
		        			// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
		        			objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
		        			AmazonS3Repository s3Repository = new AmazonS3Repository();
		        			Properties properties = Constants.getInstance().properties;
		        			String sqlPathName = properties.getProperty("path-sql-s3");
		        			String objectKey = sqlPathName+"/"+Utils.generateRandomAlphaNumericString(10);
		        			// In this case we should just update the version of the file
		        			// String s3ObjectKey = sqlPathName + "/" + sqlAsset.getLinkOfS3().substring(sqlAsset.getLinkOfS3().lastIndexOf("/")+1);
		        			String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream, objectMetadata);
		        			logger.info("graphiti-tid:{}. Query uploaded to S3 for assetId:{}. Generated link:{}", graphiti_tid, assetId, s3FileLink);
		        			
		        			AssetDetailedInformation sqlAssetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.SQL,null,DataSourceType.APP,null,null,null,user.getOrganization(), s3FileLink);
		        			sqlAssetDetailInformation.setSourceAssetIds(listOfAssetIds);
		        			JSONObject  responseOfSQLAssetUpdate = assetService.updateAsset(graphiti_tid, memberId, orgId,assetId, sqlAssetDetailInformation, DataConnectorController.CACHE_UPDATE, DataSourceType.APP.getValue(),true);
		        			int discoverabilityScoreSQLAsset = ((Long) responseOfSQLAssetUpdate.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
							
		        			// Search update for SQLAsset
		        			SearchService searchService = new SearchService();
		        			StringBuffer commaSeparatedListOfFields = new StringBuffer();
		        			Asset solrAssetToUpdateForSQLAsset = new Asset();
		        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_id(memberId);
		        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_name(user.getName());
		        			solrAssetToUpdateForSQLAsset.setAssetId(assetId);
		        			solrAssetToUpdateForSQLAsset.setAssetContent(queryString);
		        			solrAssetToUpdateForSQLAsset.setOrgId(organization.getId());
		        			solrAssetToUpdateForSQLAsset.setDiscoverabilityScore(discoverabilityScoreSQLAsset);
		        			solrAssetToUpdateForSQLAsset.setNumber_of_historical_versions(sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
		        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
		                    						  .append("assetId,").append("assetContent,").append("discoverabilityScore,").append("orgId,").append("discoverabilityScore,").append("number_of_historical_versions");
		        			searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, solrAssetToUpdateForSQLAsset,commaSeparatedListOfFields.toString());
						}
						return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
					}
					else{
						logger.info("graphiti-tid:{}.No data received from connector",graphiti_tid);
						return new ResponseEntity<Object>(null,HttpStatus.NO_CONTENT);
					}
			}
			catch(ParseException e){
				throw new JSONParseException("Unable to parse the query");
			}
			catch(DatabaseConnectionException e){
				throw e;
			} catch (UnsupportedEncodingException e) {
				logger.error("graphiti-tid:{}. Unsupported encoding exception.");
				return new ResponseEntity<String>("UTF-8 encoding is not supported.", HttpStatus.INTERNAL_SERVER_ERROR);
			} catch (IOException e) {
				logger.error("graphiti-tid:{}. Unable to determine InputStream content length.");
				return new ResponseEntity<Object>(null, HttpStatus.INTERNAL_SERVER_ERROR);
			}
			finally{
				System.gc();
			}
	}
	
	@RequestMapping(value="/ext/relatedAsset/sqlAsset/{assetId}",method= RequestMethod.PUT,consumes = "application/json")
	public ResponseEntity<?> extupdateAsset(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@PathVariable String assetId, @RequestBody String queryAndAssetDetails) {
		return updateAsset(memberId, graphiti_tid, orgId, operationType, assetId, queryAndAssetDetails);
	}
	
	private String replaceAssetIdWithTheirContent(String graphiti_tid, String memberId,
			String organizationId, String queryString){
		if(queryString==null){
			return null;
		}
		else if(!queryString.contains("[[") && !queryString.contains("]]")){
			return queryString;
		}
		else{
			try{
				AssetService assetService = new AssetService();
				ArrayList<String> listOfAssetIds = new ArrayList<String>();
				Pattern REGEX = Pattern.compile(REGEX_FOR_TABLE_PLACEHOLDER);
				Matcher matcher = REGEX.matcher(queryString);
				while (matcher.find()) {
					// Add the table names
					listOfAssetIds.add(matcher.group());
				}
				// Once this is done we replace the double square brackets
				// with double curly braces 
				queryString = queryString.replaceAll("\\[\\[","{{").replaceAll("\\]\\]", "}}");
				// Now depending on the type of the data Asset we would want to 
				// call different API's 
				String responseOfAssetInfo = assetService.getAssetInformationWithTypes(graphiti_tid,memberId,organizationId,listOfAssetIds,"id");
				// Segregating list of SQL and DataAssets
				JSONParser jsonParser = new JSONParser();
				JSONArray jsonArray = (JSONArray) jsonParser
						.parse(responseOfAssetInfo);
				ArrayList<String> listOfDataAssetIds = new ArrayList<String>(); // list of DataAssetId
				ArrayList<String> listOfSQLAssetIds = new ArrayList<String>(); // list of SQLAssetId
				for (int i = 0; i < jsonArray.size(); i++) {
					JSONObject jsonObject = (JSONObject) jsonArray.get(i);
					String assetType = (String) jsonObject.get("type");
					if(assetType.equalsIgnoreCase(AssetType.DATASET.getValue())){ // DataSet
						listOfDataAssetIds.add((String)jsonObject.get("id"));
					}
					else if(assetType.equalsIgnoreCase(AssetType.SQL.getValue())){ // SQL Snippet
						listOfSQLAssetIds.add((String)jsonObject.get("id"));
					}
				}
				jsonArray = null;
				// Now if its a DataAsset then we have to get the corresponding 
				// table name and replace the assetId in the queryString
				// with the corresponding table name
				if(listOfDataAssetIds!=null && listOfDataAssetIds.size()>0){
					String responseOfDataAssetInfo = assetService.getTableNamesFromAssetIds(graphiti_tid,memberId,organizationId,listOfDataAssetIds); 
					jsonArray = (JSONArray) jsonParser.parse(responseOfDataAssetInfo);
					for(int i=0;i<jsonArray.size();i++){
						JSONObject jsonObject = (JSONObject) jsonArray.get(i);
						String assetId = (String) jsonObject.get("id");
						String tableName = (String) jsonObject.get("tableName");
						queryString = queryString.replaceAll(assetId, tableName);
					}	
				}
				// If its a SQL then we have to get the corresponding SQLSnippet
				if(listOfSQLAssetIds!=null && listOfSQLAssetIds.size()>0){
					AmazonS3Repository s3Repository = new AmazonS3Repository();
					IdentityService indetityService  = new IdentityService();
					Organization orgDetails = indetityService.getOrganization(graphiti_tid, organizationId);
					// TODO
					String responseOfSQLAssetInfo = assetService.getS3LinksFromAssetIds(graphiti_tid,memberId,organizationId,listOfSQLAssetIds); 
					jsonArray = (JSONArray) jsonParser.parse(responseOfSQLAssetInfo);
					for(int i=0;i<jsonArray.size();i++){
						JSONObject jsonObject = (JSONObject) jsonArray.get(i);
						String assetId = (String) jsonObject.get("id");
						String s3Link = (String) jsonObject.get("s3Link");
						String key = s3Link.substring(s3Link.lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
						String query = s3Repository.readObject(orgDetails.getS3BucketName(), key);
						queryString = queryString.replaceAll(assetId, query);
					}	
				}
				// Now if there are still square brackets left then 
				// in that case we have to call this function again
				return replaceAssetIdWithTheirContent(graphiti_tid,memberId,organizationId,queryString);
			}
			catch(Exception e){
				e.printStackTrace();
				return null;
			}
		}
	}
	
	private String replacePlaceHoldersInQueryWithAssetId(String graphiti_tid, String memberId,
			String organizationId, String queryString){
		if(queryString==null){
			return null;
		}
		else if(!queryString.contains("[[") &&  !queryString.contains("]]")){
			return queryString;
		}
		else{
			try{
				// First we have to get the names of the assets
				// which match the specific pattern of opening and closing
				// square brackets
				ArrayList<String> listOfNamesOfAsset = new ArrayList<String>();
				Pattern REGEX = Pattern.compile(REGEX_FOR_TABLE_PLACEHOLDER);
				Matcher matcher = REGEX.matcher(queryString);
				while (matcher.find()) {
					// Add the table names
					listOfNamesOfAsset.add(matcher.group());
				}
				
				AssetService assetService = new AssetService();

				String responseOfAssetInfo = assetService
						.getAssetInformationWithTypes(graphiti_tid, memberId,
								organizationId, listOfNamesOfAsset,"name");
				// Segregating list of SQL and DataAssets
				JSONParser jsonParser = new JSONParser();
				JSONArray jsonArray = (JSONArray) jsonParser
						.parse(responseOfAssetInfo);
				
				for (int i = 0; i < jsonArray.size(); i++) {
					JSONObject jsonObject = (JSONObject) jsonArray.get(i);
					String assetName = (String) jsonObject.get("assetName");
					String assetId = (String) jsonObject.get("id");
					// The reason of having this is to perform exact replaceAll
					assetName = "\\[\\[" + assetName + "\\]\\]";
					assetId = "\\[\\[" + assetId + "\\]\\]";
					queryString = queryString.replaceAll(assetName,assetId); // replace assetName with assetId
				}
				return queryString;
			} catch (Exception e) {
				logger.error("graphiti_tid:{}. Error while parsing JSON data.",
						graphiti_tid);
				return null;
			}
		}
	}
	
	/**
	 * The purpose of this function is to return the query string with place
	 * holders replaced by their actual table names
	 * 
	 * @param queryString
	 * @return
	 */
	/*private String replacePlaceHolders(String graphiti_tid, String memberId,
			String organizationId, String queryString) {
		try {
			// Make a REST call to get table names from the assetNames
			AssetService assetService = new AssetService();
			// TODO
			String responseOfAssetInfo = assetService
					.getAssetInformationWithTypes();
			// Segregating list of SQL and DataAssets
			JSONParser jsonParser = new JSONParser();
			JSONArray jsonArray = (JSONArray) jsonParser.parse(responseOfAssetInfo);
			ArrayList<String> listOfDataAssetIds = new ArrayList<String>(); // list of DataAssetId
			ArrayList<String> listOfSQLAssetIds = new ArrayList<String>(); // list of SQLAssetId
			for (int i = 0; i < jsonArray.size(); i++) {
				JSONObject jsonObject = (JSONObject) jsonArray.get(i);
				String assetType = (String) jsonObject.get("type");
				if(assetType.equalsIgnoreCase(AssetType.DATASET.getValue())){
					listOfDataAssetIds.add((String)jsonObject.get("id"));
				}
				else if(assetType.equalsIgnoreCase(AssetType.SQL.getValue())){ // SQL Snippet
					listOfSQLAssetIds.add((String)jsonObject.get("id"));
				}
			}
			// TODO
			String responseOfDataSetIdsAndCorrespondingAssetNames = assetService
					.getAssetIdFromAssetNames(graphiti_tid, memberId,
							organizationId, listOfDataAssetIds);
			
			jsonParser = new JSONParser();
			JSONArray jsonArrayOfAssetIdAndCorrespondingAssetNames = (JSONArray) jsonParser
					.parse(responseOfDataSetIdsAndCorrespondingAssetNames);
			
			for (int j = 0; j < listOfNamesOfAsset.size(); j++) {
				for (int i = 0; i < jsonArrayOfAssetIdAndCorrespondingAssetNames.size(); i++) {
					JSONObject jsonObject = (JSONObject) jsonArray.get(i);
					String assetName = (String) jsonObject.get("assetName");
					if (listOfNamesOfAsset.get(j).equalsIgnoreCase(assetName)) {
						String assetId = (String) jsonObject.get("tableName");
						queryString = queryString.replaceAll(assetName,
								assetId);
						break;
					}
				}
			}
			return queryString;

		} catch (ParseException e) {
			logger.error("graphiti_tid:{}. Error while parsing JSON data.",
					graphiti_tid);
			return null;
		}
	}*/
}
