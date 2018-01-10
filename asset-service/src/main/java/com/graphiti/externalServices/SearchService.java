package com.graphiti.externalServices;

import java.util.List;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.reflect.TypeToken;
import com.graphiti.Constants;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.exceptions.AssetCreationInSearchException;
import com.graphiti.exceptions.AssetDeletionInSearchException;
import com.graphiti.exceptions.AssetUpdateInSearchException;
import com.grapthiti.utils.Utils;
import com.mongodb.util.JSON;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;
import com.sun.jersey.core.util.MultivaluedMapImpl;

import ch.qos.logback.core.net.server.Client;

public class SearchService {
	
	private final Logger logger = LoggerFactory.getLogger(SearchService.class);
	
	public void addAssetForSearch(String graphiti_tid,String assetId, String assetName,
			String assetType,String assetContent, String createdBy_id, String createdBy_name,
			String orgId, String[] dataColumns, String asset_description) throws JsonProcessingException {
		Asset asset = new Asset(assetId, assetName, assetType, assetContent,
				createdBy_id, createdBy_name, createdBy_id, createdBy_name,
				orgId, dataColumns, asset_description, 1);
		logger.info("graphiti-tid:{}.Making an entry of the asset into Search",graphiti_tid);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("/search/asset");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", createdBy_id).header("Content-Type", "application/json");
		ObjectMapper mapper = new ObjectMapper();
		String assetInformationInString =  mapper.writeValueAsString(asset);
		ClientResponse clientResonseData = builder.post(ClientResponse.class,assetInformationInString);
		if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){
			logger.info("graphiti-tid:{}.Successfully created entry of asset with id:{} into search",graphiti_tid,assetId);
		}
		else{
			logger.error("graphiti-tid:{}.Problem while inserting data into search. Response Code:{}",graphiti_tid,clientResonseData.getStatus());
			throw new AssetCreationInSearchException("Problem while inserting asset data into search. Error code received:"+clientResonseData.getStatus());
		}
	}
	
	public void updateAssetPermissions(String graphiti_tid, String assetId, List<AssetUsersInfo> admins,
			List<AssetUsersInfo> authors, List<AssetUsersInfo> viewers, List<AssetUsersInfo> followers,
			String orgId, String memberId, String memberName) {
		try {
			WebResource webResource = new Utils()
					.getWebResource(Constants.getInstance().properties.getProperty("search-service-url"))
					.path("/search/asset/" + assetId+"/permissions");
			AssetDetailedInformation assetPermissionsDetailedInformation = new AssetDetailedInformation(admins, authors,viewers,
					followers, orgId, assetId, memberId, memberName);
			ObjectMapper objectMapper = new ObjectMapper();
			String assetPermissionsDetailedInformationInString = objectMapper.writeValueAsString(assetPermissionsDetailedInformation);
			ClientResponse clientResponse = webResource.header("graphiti-tid", graphiti_tid)
					.header("memberId", memberId)
					.put(ClientResponse.class, assetPermissionsDetailedInformationInString);
			if (clientResponse.getStatus() == 200) {
				// If SUCCESS then return from the function
				// else throw an exception

			} else {
				String clientResponseInString = clientResponse.getEntity(String.class);
				logger.error("graphiti_tid:{}.Error while updating. Error Code:{}.Error Message:{}", graphiti_tid,
						clientResponse.getStatus(), clientResponseInString);
			}
		} catch (Exception e) {
			logger.error("graphiti_tid:{}.Error while updating document. Error Message:{}", graphiti_tid,
					e.getMessage());
		}
	}
	
	public void updateAssetForSearch(String graphiti_tid,String memberId,String assetId, Asset asset,String commaSeparatedFieldsToBeUpdatedExplicitly) throws AssetUpdateInSearchException {
		try{
			logger.info("graphiti-tid:{}.Making an update of the asset into Search",graphiti_tid);
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("/search/asset");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("Content-Type", "application/json")
										 .header("commaSeparatedFieldsToUpdateExplicilty", commaSeparatedFieldsToBeUpdatedExplicitly);;
			ObjectMapper mapper = new ObjectMapper();
			String assetInformationInString =  mapper.writeValueAsString(asset);
			ClientResponse clientResonseData = builder.put(ClientResponse.class,assetInformationInString);								
			if(clientResonseData.getStatus()==HttpStatus.NO_CONTENT.value()){
				logger.info("graphiti-tid:{}.Successfully updated an asset with id:{} into search",graphiti_tid,assetId);
			}
			else{
				logger.error("graphiti-tid:{}.Problem while updating asset into search. Response Code:{}",graphiti_tid,clientResonseData.getStatus());
				throw new AssetCreationInSearchException("Problem while updating asset into search. Error code received:"+clientResonseData.getStatus());
			}
		}
		catch(Exception e){
			logger.error("graphiti-tid:{}.There was an error while updating the asset in search with Id:{}. Stacktrace:{}",graphiti_tid,assetId,e.getStackTrace());
			throw new AssetUpdateInSearchException("graphiti-tid:{}.There was an error while updating the asset");
			
		}
	}
	
	public void deleteAssetsFromSearch(String graphiti_tid,String memberId,String orgId,String commaSeparatedListOfAssetIds) {
		logger.info("graphiti-tid:{}.Making an update of the asset into Search",graphiti_tid);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("/search/assets");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("Content-Type", "application/json").header("orgId", orgId);
		ClientResponse clientResonseData = builder.delete(ClientResponse.class,commaSeparatedListOfAssetIds);
		if(clientResonseData.getStatus()==HttpStatus.OK.value()){
			logger.info("graphiti-tid:{}.Successfully deleted assets with Ids:{}",graphiti_tid,commaSeparatedListOfAssetIds);
		}
		else{
			logger.error("graphiti-tid:{}.Problem while deleting assets from search. Status Code from service:{}",graphiti_tid,clientResonseData.getStatus());
			throw new AssetDeletionInSearchException("Problem while deleting asset from search.");
		}
	}
}
