package com.graphiti.client.externalServices;

import java.io.IOException;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.graphiti.Constants;
import com.graphiti.bean.Asset;
import com.graphiti.exceptions.AssetCreationInSearchException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class SearchService {
	private Logger logger = LoggerFactory.getLogger(SearchService.class);
	
	public void addAssetForSearch(String graphiti_tid,String assetId, String assetName,
			String assetType,String assetContent, String createdBy_id, String createdBy_name,
			String orgId, String[] dataColumns, String asset_description,int discoverabilityScore) throws JsonGenerationException, JsonMappingException, IOException {
		Asset asset = new Asset(assetId, assetName, assetType, assetContent,
				createdBy_id, createdBy_name, createdBy_id, createdBy_name,
				orgId, dataColumns, asset_description, 1);
		asset.setDiscoverabilityScore(discoverabilityScore);
		logger.info("graphiti-tid:{}.Making an entry of the asset into Search",graphiti_tid);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("/search/asset");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", createdBy_id).header("Content-Type", "application/json");
		// Why I had to write this is because by default Jackson was sending discoverabilityScore
		// as String and not a number
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
	
	public void updateAssetForSearch(String graphiti_tid,String memberId,String assetId, Asset asset,String commaSeparatedFieldsToBeUpdatedExplicitly) throws JsonGenerationException, JsonMappingException, IOException {
		logger.info("graphiti-tid:{}.Making an update of the asset into Search",graphiti_tid);
		WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("/search/asset");
		Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("Content-Type", "application/json")
									 .header("commaSeparatedFieldsToUpdateExplicilty", commaSeparatedFieldsToBeUpdatedExplicitly);
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
}