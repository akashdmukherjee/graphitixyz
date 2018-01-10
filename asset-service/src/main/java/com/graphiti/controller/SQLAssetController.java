package com.graphiti.controller;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.graphiti.Constants;
import com.graphiti.externalServices.SearchService;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
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
import org.springframework.web.multipart.MultipartFile;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.DataSourceType;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.User;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.bean.UserType;
import com.graphiti.exceptions.NoContentInFile;
import com.graphiti.exceptions.SQLFileReadExceptionUpload;
import com.graphiti.externalServices.IdentityService;
import com.graphiti.repository.AmazonS3Repository;
import com.graphiti.repository.AssetUsersRepository;
import com.graphiti.repository.DataSetRepository;
import com.graphiti.repository.SQLAssetRepository;
import com.graphiti.repository.UserAssetsRepository;
import com.grapthiti.utils.Utils;

@RestController
public class SQLAssetController {

	private Logger logger = LoggerFactory.getLogger(SQLAssetController.class);
	private static String REGEX_FOR_TABLE_PLACEHOLDER = "(?<=\\[\\[).+?(?=\\]\\])";
	
	private final String STRING_APPENDED_FOR_DS = "_DS";
	
	@Autowired
	private SQLAssetRepository sqlAssetRepository;
	
	@Autowired
	private DataSetRepository datasetRepository;
	
	@Autowired
	private AssetUsersRepository assetUsersRepository;
	
	@Autowired
	private UserAssetsRepository userAssetsRepository;
	
	@Autowired
	private AssetController assetController;
	
	@Autowired
	private Environment env;
	
	@RequestMapping(value = "/asset/sqlAsset/{assetId}", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getSQLAssetDetails(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable("assetId") String assetId) {
		SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId, orgId);
		if(sqlAsset == null) {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		return new ResponseEntity<SQLAsset>(sqlAsset, HttpStatus.OK);
	}
	
	@RequestMapping(value = "/ext/asset/sqlAsset/{assetId}", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extgetSQLAssetDetails(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable("assetId") String assetId) {
		return getSQLAssetDetails(memberId, graphiti_tid, orgId, assetId);
	}
	
	@RequestMapping(value = "/asset/sqlAsset/{assetId}/sqlContent", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getSQLContent(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable("assetId") String assetId) {
		SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId, orgId);
		if(sqlAsset == null) {
			return new ResponseEntity<>("", HttpStatus.NOT_FOUND);
		}
		IdentityService identityService = new IdentityService();
		Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
		AmazonS3Repository s3Repository = new AmazonS3Repository();
		String linkOfS3 = sqlAsset.getLinkOfS3();
		String key = linkOfS3.substring(linkOfS3.lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
		//String key = appropriateSQLOnlyFilter.getSqlFilterURLInS3().substring(appropriateSQLOnlyFilter.getSqlFilterURLInS3().lastIndexOf("/")+1);
		String query = s3Repository.readObject(organization.getS3BucketName(),key);
		// replace assetIf with their corresponding assetNames
		ArrayList<String> listOfAssetIds = new ArrayList<String>();
		Pattern REGEX = Pattern.compile(REGEX_FOR_TABLE_PLACEHOLDER);
		Matcher matcher = REGEX.matcher(query);
		while (matcher.find()) {
			// Add the table names
			listOfAssetIds.add(matcher.group());
		}
		if(listOfAssetIds.size()>0){
			query = replaceAssetIdsWithTheirAssetNames(organization.getId(), query,listOfAssetIds); 
		}
		JSONObject returningJSONObjectForSQLContent = new JSONObject();
		returningJSONObjectForSQLContent.put("sqlContent", query);
		return new ResponseEntity<>(returningJSONObjectForSQLContent, HttpStatus.OK);
	}
	
	/**
	 * The purpose of this function is to return 
	 * the query string with place holders replaced by their actual table names
	 * @param queryString
	 * @return
	 */
	private String replaceAssetIdsWithTheirAssetNames(String organizationId, String queryString,ArrayList<String> listOfAssetIds) {
		Map<String,String> mapOfAssetIdAndCorrespondingAssetName = assetUsersRepository.getMapOfAssetIdAndAssetName(organizationId, listOfAssetIds);
    	for(int j=0;j<listOfAssetIds.size();j++){
	    		for(String assetId:mapOfAssetIdAndCorrespondingAssetName.keySet()){
	    			if(listOfAssetIds.get(j).equalsIgnoreCase(assetId)){
		    			String assetName = mapOfAssetIdAndCorrespondingAssetName.get(assetId);
		    			queryString = queryString.replaceAll(assetId,assetName);
		    			break;
	    			}
	    		}
    	}
    	return queryString;
	}
	
	@RequestMapping(value = "/ext/asset/sqlAsset/{assetId}/sqlContent", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extgetSQLContent(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable("assetId") String assetId) {
		return getSQLContent(memberId, graphiti_tid, orgId, assetId);
	}
	
	@RequestMapping(value="/asset/sqlAsset/upload", method=RequestMethod.POST)
	public ResponseEntity<?> uploadSQLFile(@RequestHeader(value = "memberId") String memberId,
	@RequestHeader(value = "graphiti-tid") String graphiti_tid,
	@RequestHeader(value = "orgId") String orgId,
	@RequestParam("assetName") String assetName,
	@RequestParam("file") MultipartFile file){
		if (!file.isEmpty()) {
			BufferedReader br = null;
			try {
				Reader reader = new InputStreamReader(file.getInputStream(),"UTF-8");
				br = new BufferedReader(reader);
				String line = "";
				StringBuffer sqlContent = new StringBuffer();
				while((line=br.readLine())!=null){
					sqlContent.append(line).append("\n");
				}
				if(sqlContent.toString().length()==0){
					throw new NoContentInFile("File is Empty");
					
				}
				IdentityService identityService = new IdentityService();
				Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
				User user = identityService.getUser(memberId, graphiti_tid);
				// Once the content is read
				// We have to create a SQL Asset but in this case the asset that has been 
				// created is MANUAL
				// Lets store the file in S3 first
				InputStream inputStream = new ByteArrayInputStream(sqlContent.toString().getBytes("UTF-8"));
				ObjectMetadata objectMetadata = new ObjectMetadata();
				// AWS-S3 warns to set the content-length
				// but not mandatory
				// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
				objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
				AmazonS3Repository s3Repository = new AmazonS3Repository();
				String sqlPathName = env.getProperty("path-sql-s3");
				String objectKey = sqlPathName + "/" + Utils.generateRandomAlphaNumericString(10);
				String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream,
						objectMetadata);
				logger.info("graphiti-tid:{}. Query uploaded to S3. Generated link:{}", graphiti_tid, s3FileLink);
				// Once the upload of the file is successful we can create an entry of the asset
				AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,assetName,AssetType.SQL,null,DataSourceType.FILE_UPLOAD,file.getOriginalFilename(),null,null,user.getOrganization(), s3FileLink);
				ResponseEntity<?> responseEntity = assetController.addAsset(memberId, graphiti_tid,false,false,assetDetailInformation);
				JSONParser parser = new JSONParser();
				JSONObject responseObject = (JSONObject) parser.parse(responseEntity.getBody().toString());
				String sqlAssetId = responseObject.get("sqlAssetId").toString();
				// Once the asset gets added we have to make it searchable
				SearchService searchService = new SearchService();
				searchService.addAssetForSearch(graphiti_tid, sqlAssetId, assetName, AssetType.SQL.getValue(), sqlContent.toString(), memberId, user.getName(), orgId, null, null);
				JSONObject jsonResponse = new JSONObject();
				jsonResponse.put("assetId",sqlAssetId);
				return new ResponseEntity<>(jsonResponse,HttpStatus.CREATED);
			} catch(ParseException e){ //  We should not throw ParseException here.
				logger.error("graphiti-tid:{}.Error while parsing the Response received while storing the asset.Message:",graphiti_tid,e.getMessage());
				throw new SQLFileReadExceptionUpload("Error while reading file when uploading");
			} 
			catch (UnsupportedEncodingException e) {
				logger.error("graphiti-tid:{}.Error while reading data from uploaded file.Message:{}",graphiti_tid,e.getMessage());
				throw new SQLFileReadExceptionUpload("Error while reading file when uploading");
			} catch (IOException e) {
				logger.error("graphiti-tid:{}.Error while reading data from uploaded file.Message:{}",graphiti_tid,e.getMessage());
				throw new SQLFileReadExceptionUpload("Error while reading file when uploading");
			}
			finally{
				if(br!=null){
					try{
						br.close();
					}
					catch(IOException e){
						logger.error("graphiti-tid:{}.Error while closing BufferedReader",graphiti_tid);
					}
				}
			}
		}
		else{
			// BAD request for file empty
			JSONObject jsonObjectResponse = new JSONObject();
			jsonObjectResponse.put("message", "Failed to Upload as the file was empty!!!");
			jsonObjectResponse.put("dataTypes",null);
			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.BAD_REQUEST);
		}
		//return new ResponseEntity<>(null,HttpStatus.OK);
	}
	
	
	@RequestMapping(value="/asset/sqlAsset/upload/update", method=RequestMethod.PUT)
	public ResponseEntity<?> uploadSQLFileForUpdate(@RequestHeader(value = "memberId") String memberId,
	@RequestHeader(value = "graphiti-tid") String graphiti_tid,
	@RequestHeader(value = "orgId") String orgId,
	@RequestHeader(value = "assetId") String assetId,
	@RequestParam("file") MultipartFile file) throws IllegalArgumentException, IllegalAccessException{
		if (!file.isEmpty()) {
			BufferedReader br = null;
			try {
				Reader reader = new InputStreamReader(file.getInputStream(),"UTF-8");
				br = new BufferedReader(reader);
				String line = "";
				StringBuffer sqlContent = new StringBuffer();
				while((line=br.readLine())!=null){
					sqlContent.append(line).append("\n");
				}
				if(sqlContent.toString().length()==0){
					throw new NoContentInFile("File is Empty");
					
				}
				IdentityService identityService = new IdentityService();
				Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
				User user = identityService.getUser(memberId, graphiti_tid);
				// Once the content is read
				// We have to update the SQL Asset but in this case the asset that has been 
				// created is MANUAL
				// Lets store the file in S3 first
				InputStream inputStream = new ByteArrayInputStream(sqlContent.toString().getBytes("UTF-8"));
				ObjectMetadata objectMetadata = new ObjectMetadata();
				// AWS-S3 warns to set the content-length
				// but not mandatory
				// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
				objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
				AmazonS3Repository s3Repository = new AmazonS3Repository();
				String sqlPathName = env.getProperty("path-sql-s3");
				String objectKey = sqlPathName + "/" + Utils.generateRandomAlphaNumericString(10);
				String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream,
						objectMetadata);
				logger.info("graphiti-tid:{}. Query uploaded to S3. Generated link:{}", graphiti_tid, s3FileLink);
				// assetName is null since its just an update
				AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,null,AssetType.SQL,null,DataSourceType.FILE_UPLOAD,file.getOriginalFilename(),null,null,user.getOrganization(), s3FileLink);
				ResponseEntity<?> responseEntity = assetController.updateAsset(graphiti_tid,memberId,orgId, "SQL_FILE_UPDATE_ONLY", assetDetailInformation, false,assetId);//(memberId, graphiti_tid, assetDetailInformation);
				if(responseEntity.getStatusCode()==HttpStatus.NO_CONTENT){ // Updation was successful so then only make a call to Search Service for updation
					SearchService searchService = new SearchService();
					// This call was made for getting the version number only
					SQLAsset sqlAsset = sqlAssetRepository.getSQLAsset(assetId,"linkOfS3","versionNumber");
					StringBuffer commaSeparatedListOfFields = new StringBuffer();
					Asset solrAssetToUpdateForSQLAsset = new Asset();
					solrAssetToUpdateForSQLAsset.setLastModifiedBy_id(memberId);
					solrAssetToUpdateForSQLAsset.setLastModifiedBy_name(user.getName());
	    			solrAssetToUpdateForSQLAsset.setAssetId(assetId);
	    			solrAssetToUpdateForSQLAsset.setAssetContent(sqlContent.toString());
	    			solrAssetToUpdateForSQLAsset.setOrgId(organization.getId());
	    			solrAssetToUpdateForSQLAsset.setNumber_of_historical_versions(sqlAsset.getVersionNumber());
	    			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
					  .append("assetId,").append("assetContent,").append("orgId,").append("number_of_historical_versions");
	    			searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, solrAssetToUpdateForSQLAsset,commaSeparatedListOfFields.toString());
				}
			} 
			catch (UnsupportedEncodingException e) {
				logger.error("graphiti-tid:{}.Error while reading data from uploaded file.Message:{}",graphiti_tid,e.getMessage());
				throw new SQLFileReadExceptionUpload("Error while reading file when uploading");
			} catch (IOException e) {
				logger.error("graphiti-tid:{}.Error while reading data from uploaded file.Message:{}",graphiti_tid,e.getMessage());
				throw new SQLFileReadExceptionUpload("Error while reading file when uploading");
			}
			finally{
				if(br!=null){
					try{
						br.close();
					}
					catch(IOException e){
						logger.error("graphiti-tid:{}.Error while closing BufferedReader",graphiti_tid);
					}
				}
			}
		}
		else{
			// BAD request for file empty
			JSONObject jsonObjectResponse = new JSONObject();
			jsonObjectResponse.put("message", "Failed to Upload as the file was empty!!!");
			jsonObjectResponse.put("dataTypes",null);
			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.BAD_REQUEST);
		}
		return new ResponseEntity<>(null,HttpStatus.OK);
	}
	
	
	@RequestMapping(value = "/asset/s3Links", method = RequestMethod.POST, consumes = "text/plain", produces = "application/json")
	public ResponseEntity<?> getTableNamesForDataAsset(
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "orgId") String orgId,
			@RequestBody String commaSeparatedAssetIds) {
			String[] arrayOfAssetNames = commaSeparatedAssetIds.split(",");
			List<SQLAsset> listOfSQLAssetBasedOnNamesAndOrgId = sqlAssetRepository.getListOfSQLAssetBasedOnIds(arrayOfAssetNames);
			// Once you get the list of SQLAsset 
			// iterate over those and get create a JSONArray response consisting 
			// of assetId and corresponding s3 link
			JSONArray returningJSONArray = new JSONArray();
			for(SQLAsset sqlAsset : listOfSQLAssetBasedOnNamesAndOrgId){
				JSONObject object = new JSONObject();
				object.put("id", sqlAsset.getId());
				object.put("s3Link", sqlAsset.getLinkOfS3());
				returningJSONArray.add(object);
			}
			return new ResponseEntity<>(returningJSONArray,HttpStatus.OK);
	}
	
	@RequestMapping(value = "/asset/sqlAsset", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> addSQLAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "IsRelatedAsset",defaultValue="false",required=false) boolean isRelatedAsset,
			@RequestBody AssetDetailedInformation assetDetailInformation) {
		logger.info("graphiti-tid:{}.Creation of SQL Asset for Member with Id:{} and OrgId:{}",graphiti_tid,memberId,assetDetailInformation.getOrgId());
		JSONObject responseJSONObject = new JSONObject();
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
		if (assetDetailInformation.getAssetType().getValue().equalsIgnoreCase(AssetType.SQL.getValue())
				&& assetDetailInformation.getDataSourceType().equals(DataSourceType.APP)) {
			logger.info("graphiti-tid:{}.SQLAsset is to be created. DataSourceType:{}",graphiti_tid,DataSourceType.APP.getValue());
			logger.info("graphiti-tid:{}.Creating SQLAsset with Id:{}",graphiti_tid,assetId);
			SQLAsset sqlAsset = new SQLAsset(assetId, assetDetailInformation.getAssetName(), assetDetailInformation.getLinkOfS3(),
					assetDetailInformation.getDataSourceType(), assetDetailInformation.getConnectionId(), null);
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
			responseJSONObject.put("sqlAssetId", assetId);
		}
		logger.info("graphiti-tid:{}.Asset added with Id:{}", graphiti_tid, assetId);
		
		ResponseEntity entity = assetController.getDiscovabilityScore(graphiti_tid,memberId,assetDetailInformation.getOrgId(),true,(String)responseJSONObject.get("sqlAssetId"));
		int discoverabilityScore = Integer.parseInt((String) entity.getBody());
		responseJSONObject.put("sqlAssetId" + STRING_APPENDED_FOR_DS , discoverabilityScore);
		return new ResponseEntity<JSONObject>(responseJSONObject, HttpStatus.CREATED);
	}
}
