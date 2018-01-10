package com.graphiti.client.externalServices;

import java.io.IOException;
import java.util.ArrayList;

import javax.ws.rs.core.MultivaluedMap;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.graphiti.Constants;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.ChartAsset;
import com.graphiti.bean.ChartConfigs;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.User;
import com.graphiti.exceptions.AssetCreationException;
import com.graphiti.exceptions.AssetUpdateException;
import com.graphiti.exceptions.DataAssetCreationException;
import com.graphiti.exceptions.DataAssetNotFoundException;
import com.graphiti.exceptions.DataAssetRetrievalException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;
import com.sun.jersey.core.util.MultivaluedMapImpl;

/**
 * Asset Service calls
 * 
 * 
 * @author 
 *
 */
public class AssetService {
	
	private Logger logger = LoggerFactory.getLogger(AssetService.class);
	
	/**
	 * Asset Detailed Information
	 * @throws IOException 
	 * @throws JsonMappingException 
	 * @throws JsonGenerationException 
	 * 
	 */
	public JSONObject addDetailedAsset(String graphiti_tid,String memberId,AssetDetailedInformation assetDetailedInformation,boolean isRelatedAsset) throws JsonGenerationException, JsonMappingException, IOException{
		logger.info("graphiti_tid:{}. Making a REST call to provide AssetDetailedInformation for member with id:{}",graphiti_tid,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("Content-Type", "application/json");
		if(isRelatedAsset){
			builder.header("isRelatedAsset", true);
		}
		builder.header("Accept","application/json");
		ClientResponse clientResonseData = builder.post(ClientResponse.class,assetDetailedInformation);
		if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){ // Created successfully
			logger.info("graphiti_tid:{}.Asset created successfully",graphiti_tid);
			String response = clientResonseData.getEntity(String.class);
			JSONParser jsonParser = new JSONParser();
			try{
				JSONObject responseObjectInJSON = (JSONObject) jsonParser.parse(response);
				return responseObjectInJSON;
			}
			catch(ParseException e){
				logger.error("graphiti_tid:{}. Error while parsing the response from the REST Service.Response Received:{}",graphiti_tid,response);
				throw new AssetCreationException("Error while parsing the response from the REST Service.Response Received:"+response);
			}
		}
		else{
			logger.error("graphiti_tid:{}. Error while creating Asset for UserId:{} and Asset Name:{}. Status Code:{}",graphiti_tid,memberId,assetDetailedInformation.getAssetName(),clientResonseData.getStatus());
			throw new AssetCreationException("Error while creating Asset for UserId:"+memberId+" and Asset Name:"+assetDetailedInformation.getAssetName());
		}
	}
	
	/**
	 * Asset SQL Information
	 * @throws IOException 
	 * @throws JsonMappingException 
	 * @throws JsonGenerationException 
	 * 
	 */
	public JSONObject addSQLDetailedAsset(String graphiti_tid,String memberId,AssetDetailedInformation assetDetailedInformation,boolean isRelatedAsset) throws JsonGenerationException, JsonMappingException, IOException{
		logger.info("graphiti_tid:{}. Making a REST call to provide AssetDetailedInformation for member with id:{}",graphiti_tid,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/sqlAsset");
		Builder builder = webResource.header("graphiti-tid", graphiti_tid)
									 .header("memberId", memberId)
									 .header("orgId", assetDetailedInformation.getOrgId())
									 .header("Content-Type", "application/json");
		if(isRelatedAsset){
			builder.header("isRelatedAsset", true);
		}
		builder.header("Accept","application/json");
		ClientResponse clientResonseData = builder.post(ClientResponse.class,assetDetailedInformation);
		if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){ // Created successfully
			logger.info("graphiti_tid:{}.Asset created successfully",graphiti_tid);
			String response = clientResonseData.getEntity(String.class);
			JSONParser jsonParser = new JSONParser();
			try{
				JSONObject responseObjectInJSON = (JSONObject) jsonParser.parse(response);
				return responseObjectInJSON;
			}
			catch(ParseException e){
				logger.error("graphiti_tid:{}. Error while parsing the response from the REST Service.Response Received:{}",graphiti_tid,response);
				throw new AssetCreationException("Error while parsing the response from the REST Service.Response Received:"+response);
			}
		}
		else{
			logger.error("graphiti_tid:{}. Error while creating Asset for UserId:{} and Asset Name:{}. Status Code:{}",graphiti_tid,memberId,assetDetailedInformation.getAssetName(),clientResonseData.getStatus());
			throw new AssetCreationException("Error while creating Asset for UserId:"+memberId+" and Asset Name:"+assetDetailedInformation.getAssetName());
		}
	}
	
	/**
	 * Asset SQL Information
	 * @throws IOException 
	 * @throws JsonMappingException 
	 * @throws JsonGenerationException 
	 * 
	 */
	public JSONObject attachDetailedDataSetAsset(String graphiti_tid,String memberId,String sqlAssetIdToAttachTo,AssetDetailedInformation assetDetailedInformation,boolean isRelatedAsset) throws JsonGenerationException, JsonMappingException, IOException{
		logger.info("graphiti_tid:{}. Making a REST call to provide AssetDetailedInformation for member with id:{}",graphiti_tid,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/dataset/attachToSQL");
		Builder builder = webResource.header("graphiti-tid", graphiti_tid)
									 .header("memberId", memberId)
									 .header("sqlAssetId", sqlAssetIdToAttachTo)
									 .header("orgId", assetDetailedInformation.getOrgId())
									 .header("Content-Type", "application/json");
		if(isRelatedAsset){
			builder.header("isRelatedAsset", true);
		}
		builder.header("Accept","application/json");
		ClientResponse clientResonseData = builder.post(ClientResponse.class,assetDetailedInformation);
		if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){ // Created successfully
			logger.info("graphiti_tid:{}.Asset created successfully",graphiti_tid);
			String response = clientResonseData.getEntity(String.class);
			JSONParser jsonParser = new JSONParser();
			try{
				JSONObject responseObjectInJSON = (JSONObject) jsonParser.parse(response);
				return responseObjectInJSON;
			}
			catch(ParseException e){
				logger.error("graphiti_tid:{}. Error while parsing the response from the REST Service.Response Received:{}",graphiti_tid,response);
				throw new AssetCreationException("Error while parsing the response from the REST Service.Response Received:"+response);
			}
		}
		else{
			logger.error("graphiti_tid:{}. Error while creating Asset for UserId:{} and Asset Name:{}. Status Code:{}",graphiti_tid,memberId,assetDetailedInformation.getAssetName(),clientResonseData.getStatus());
			throw new AssetCreationException("Error while creating Asset for UserId:"+memberId+" and Asset Name:"+assetDetailedInformation.getAssetName());
		}
	}
	
	/**
	 * REST helper to add an asset into AssetUsers
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param assetUsers
	 * @return
	 */
	public String addAsset(String graphiti_tid,String memberId,AssetUsers assetUsers){
		logger.info("graphiti_tid:{}. Making a REST call to store Asset related details for member with id:{}",graphiti_tid,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("Content-Type", "application/json");
		builder.header("Accept","application/json");
		ClientResponse clientResonseData = builder.post(ClientResponse.class,assetUsers);
		if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){ // Created successfully
			logger.info("graphiti_tid:{}.Asset created successfully",graphiti_tid);
			String response = clientResonseData.getEntity(String.class);
			JSONParser jsonParser = new JSONParser();
			try{
				JSONObject responseObjectInJSON = (JSONObject) jsonParser.parse(response);
				return (String) responseObjectInJSON.get("assetId");
			}
			catch(ParseException e){
				logger.error("graphiti_tid:{}. Error while parsing the response from the REST Service.Response Received:{}",graphiti_tid,response);
				throw new AssetCreationException("Error while parsing the response from the REST Service.Response Received:"+response);
			}
		}
		else{
			logger.error("graphiti_tid:{}. Error while creating Asset for UserId:{} and Asset Name:{}. Status Code:{}",graphiti_tid,memberId,assetUsers.getName(),clientResonseData.getStatus());
			throw new AssetCreationException("Error while creating Asset for UserId:"+memberId+" and Asset Name:"+assetUsers.getName());
		}
	}
	
	/**
	 * REST helper to add a DataSetAsset
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param 
	 * @return
	 */
	public void addDataSetAsset(String graphiti_tid,String memberId,DataSet dataset){
		logger.info("graphiti_tid:{}. Making a REST call to store Asset related details for member with id:{}",graphiti_tid,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/dataset");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("Content-Type", "application/json");
		ClientResponse clientResonseData = builder.post(ClientResponse.class,dataset);
		if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){ // Created successfully
			// Do nothing
			logger.info("graphiti_tid:{}. Successfully created data asset",graphiti_tid);
			
		}
		else{
			logger.error("graphiti_tid:{}. Error while creating Data Asset for UserId:{} and Asset Name:{}. Status Code:{}",graphiti_tid,memberId,dataset.getName(),clientResonseData.getStatus());
			// TODO
			throw new DataAssetCreationException("Error while creating Data Asset for UserId:"+memberId+" and Asset Name:"+dataset.getName());
		}
	}
	
	/**
	 * REST helper to get a DataSetAsset
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param assetId
	 * @param orgId
	 * @return
	 **/
	
	public DataSet getDataSetAssetDetails(String graphiti_tid,String memberId,String assetId,String orgId){
		logger.info("graphiti_tid:{}. Making a REST call to get DataSet details for an asset with id:{}",graphiti_tid,assetId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/dataset/"+assetId);
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId",orgId).header("Accept", "application/json");
		ClientResponse clientResonseData = builder.get(ClientResponse.class);
		if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // If the data is properly received
			String dataSet = clientResonseData.getEntity(String.class);
			Gson gson = new Gson();
			DataSet dataSetDetails = gson.fromJson(dataSet,DataSet.class);
			return dataSetDetails;
		}
		else if(clientResonseData.getStatus()==HttpStatus.INTERNAL_SERVER_ERROR.value()){
			logger.error("graphiti_tid:{}.Error while retrieving asset details for asset with id:{}",graphiti_tid,assetId+". Error Code Received:"+clientResonseData.getStatus());
			throw new DataAssetRetrievalException("Error while retrieving details of DataAsset");
		}
		else if(clientResonseData.getStatus()==HttpStatus.NOT_FOUND.value()){
			logger.error("graphiti_tid:{}.Asset not found for id:{}",graphiti_tid,assetId);
			throw new DataAssetNotFoundException("DataAsset was not found");
		}
		return null;
	}
	
	/**
	 * REST helper to get a SQLAsset
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param assetId
	 * @return SQLAsset
	 */
	public SQLAsset getSQLAsset(String graphiti_tid,String memberId,String assetId, String orgId){
		logger.info("graphiti_tid:{}. Making a REST call to get SQLAsset related details for asset with id:{} member with id:{}",graphiti_tid,assetId,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/sqlAsset/"+assetId);
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", orgId);
		ClientResponse clientResonseData = builder.get(ClientResponse.class);
		if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Got response successfully
			// Do nothing
			logger.info("graphiti_tid:{}. Successfully got data asset",graphiti_tid);
			String sqlAssetDetailsInString = clientResonseData.getEntity(String.class);
			Gson gson = new Gson();
			SQLAsset sqlAsset = gson.fromJson(sqlAssetDetailsInString,SQLAsset.class);
			return sqlAsset;
		}
		else{
			logger.error("graphiti_tid:{}. Error while getting SQLAsset for UserId:{} and assetId:{}. Status Code:{}",graphiti_tid,memberId,assetId,clientResonseData.getStatus());
			if(clientResonseData.getStatus()==HttpStatus.NOT_FOUND.value()){
				throw new DataAssetNotFoundException("SQLAsset with Id: {} was not found");
			}
			else{
				throw new DataAssetRetrievalException("Error while retreiving data for asset with id:"+assetId);
			}
		}
	}
	
	
	/**
	 * REST helper to update DataSet, AssetUsers
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param assetId
	 * @param 
	 * @return
	 * @throws JsonProcessingException 
	 */
	public JSONObject updateAsset(String graphiti_tid,String memberId,String orgId,String assetId, AssetDetailedInformation assetDetailedInformation, String assetUpdateType, String sourceType,boolean isRelatedAssets) throws JsonProcessingException{
		logger.info("graphiti_tid:{}. Making a REST call to get DataSetAsset related details for asset with id:{} member with id:{}",graphiti_tid,assetId,memberId);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/"+assetId);
		MultivaluedMap queryParams = new MultivaluedMapImpl();
		queryParams.add("type", assetUpdateType);
		queryParams.add("sourceType", sourceType);
		webResource = webResource.queryParams(queryParams);
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", orgId);
		if(isRelatedAssets){
			builder.header("IsRelatedAsset",true);
		}
		ClientResponse clientResonseData = builder.header("Content-Type", MediaType.APPLICATION_JSON).put(ClientResponse.class, assetDetailedInformation);
		if(clientResonseData.getStatus()==HttpStatus.NO_CONTENT.value() || clientResonseData.getStatus()==HttpStatus.OK.value()){ // Created successfully
			// Do nothing
			logger.info("graphiti_tid:{}. Successfully updated data asset",graphiti_tid);
			String response = clientResonseData.getEntity(String.class);
			JSONParser jsonParser = new JSONParser();
			try{
				JSONObject responseObjectInJSON = (JSONObject) jsonParser.parse(response);
				return responseObjectInJSON;
			}
			catch(ParseException e){
				logger.error("graphiti_tid:{}. Error while parsing the response from the REST Service.Response Received:{}",graphiti_tid,response);
				throw new AssetUpdateException("Error while parsing the response from the REST Service.Response Received:"+response);
			}
		}
		else{
			logger.error("graphiti_tid:{}. Error while updating Data Asset for UserId:{} and assetId:{}. Status Code:{}",graphiti_tid,memberId,assetId,clientResonseData.getStatus());
			// TODO
			throw new AssetUpdateException("Error while updating Data Asset for UserId:"+memberId+" and assetId:"+assetId);
		}
	}
	
	/**
	 * This will return a JSON String consisting of 
	 * AssetNames and corresponding table names
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param organizationId
	 * @param assetNames
	 * @return
	 */
	public String getTableNamesFromAssetNames(String graphiti_tid,String memberId,String organizationId,ArrayList<String> assetNames)
	{
		try{
			logger.info("graphiti_tid:{}. Making a REST call to get table names for given asset names");
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/tableNames");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", organizationId);
			ClientResponse clientResonseData = builder.header("Content-Type","text/plain").post(ClientResponse.class,String.join(",", assetNames));
			if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Success
				String responseInString = clientResonseData.getEntity(String.class);
				return responseInString;
			}
			else{ // Failure
				logger.error("graphiti_tid:{}. Error while retrieving table names from asset names");
				throw new DataAssetRetrievalException("Error while retrieving table names from asset names");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}. Error while retrieving table names from asset names");
			throw new DataAssetRetrievalException("Error while retrieving table names from asset names");
		}
	}
	
	
	public String getAssetInformationWithTypes(String graphiti_tid,String memberId,String organizationId,ArrayList<String> assetNames,String fieldName)
	{
		try{
			logger.info("graphiti_tid:{}. Making a REST call to get Asset Information given asset names");
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/assetType");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", organizationId).header("getDataByField",fieldName);
			ClientResponse clientResonseData = builder.header("Content-Type","text/plain").post(ClientResponse.class,String.join(",", assetNames));
			if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Success
				String responseInString = clientResonseData.getEntity(String.class);
				return responseInString;
			}
			else{ // Failure
				logger.error("graphiti_tid:{}. Error while retrieving Asset Information from asset names");
				throw new DataAssetRetrievalException("Error while retrieving Asset Information from asset names");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}. Error while retrieving Asset Information from asset names");
			throw new DataAssetRetrievalException("Error while retrieving Asset Information from asset names");
		}
	}
	
	/**
	 * This will return a JSON String consisting of 
	 * AssetId and corresponding table names
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param organizationId
	 * @param assetIds
	 * @return
	 */
	public String getTableNamesFromAssetIds(String graphiti_tid,String memberId,String organizationId,ArrayList<String> assetIds)
	{
		try{
			logger.info("graphiti_tid:{}. Making a REST call to get table names for given asset names");
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/tableNames");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", organizationId);
			ClientResponse clientResonseData = builder.header("Content-Type","text/plain").post(ClientResponse.class,String.join(",", assetIds));
			if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Success
				String responseInString = clientResonseData.getEntity(String.class);
				return responseInString;
			}
			else{ // Failure
				logger.error("graphiti_tid:{}. Error while retrieving table names from asset names");
				throw new DataAssetRetrievalException("Error while retrieving table names from asset names");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}. Error while retrieving table names from asset names");
			throw new DataAssetRetrievalException("Error while retrieving table names from asset names");
		}
	}
	
	public String getS3LinksFromAssetIds(String graphiti_tid,String memberId,String organizationId,ArrayList<String> assetIds)
	{
		try{
			logger.info("graphiti_tid:{}. Making a REST call to get S3 links for given assets");
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/s3Links");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", organizationId);
			ClientResponse clientResonseData = builder.header("Content-Type","text/plain").post(ClientResponse.class,String.join(",", assetIds));
			if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Success
				String responseInString = clientResonseData.getEntity(String.class);
				return responseInString;
			}
			else{ // Failure
				logger.error("graphiti_tid:{}. Error while retrieving S3 links from asset names");
				throw new DataAssetRetrievalException("Error while retrieving S3 links from asset names");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}. Error while retrieving S3 links from asset names");
			throw new DataAssetRetrievalException("Error while retrieving S3 links from asset names");
		}
	}
	
	public String getTableNamePoweringTheChart(String graphiti_tid, String memberId, String orgId, String assetId){
		try{
			logger.info("graphiti_tid:{}. Making a REST call to get table name powering the chart");
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/chartAsset/"+assetId+"/getTableName");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", orgId);
			ClientResponse clientResonseData = builder.header("Accept","application/json").get(ClientResponse.class);
			if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Success
				logger.info("graphiti_tid:{}. Got table name ");
				String responseInString = clientResonseData.getEntity(String.class);
				JSONParser jsonParser = new JSONParser(); //tableName
				JSONObject jsonObject = (JSONObject) jsonParser.parse(responseInString);
				String tableName = (String) jsonObject.get("tableName");
				return tableName;
			}
			else {
				return null;
			}
		}
		catch(Exception e){
			// TODO
			return null;
		}
	}
	
	public ChartConfigs getChartConfigsBasedOnIdOfChart(String graphiti_tid, String memberId, String orgId, String assetId){
		try{
			logger.info("graphiti_tid:{}. Making a REST call to get configs for the chart");
			// First get the details of the chart
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("asset-service-url")).path("/asset/chartAsset/"+assetId);
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", orgId);
			ClientResponse clientResonseData = builder.header("Accept","application/json").get(ClientResponse.class);
			if(clientResonseData.getStatus()==HttpStatus.OK.value()){ // Success
				logger.info("graphiti_tid:{}. Got table name ");
				String responseInString = clientResonseData.getEntity(String.class);
				Gson gson = new Gson();
				ChartAsset chartAsset = gson.fromJson(responseInString,ChartAsset.class);
				return chartAsset.getChartConfigs();
			}
			else {
				return null;
			}
		}
		catch(Exception e){
			// TODO
			return null;
		}
	}
}
