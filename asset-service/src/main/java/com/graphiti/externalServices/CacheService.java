package com.graphiti.externalServices;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.graphiti.Constants;
import com.graphiti.exceptions.AssetNotFoundException;
import com.graphiti.exceptions.GenericInternalServerErrorException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class CacheService {

	private final Logger logger = LoggerFactory.getLogger(CacheService.class);
	
	public JSONObject deleteTable(String graphiti_tid, String orgId,String memberId,String assetId) {
		try{
			logger.info("graphiti-tid:{}. Making a request to delete cache table for asset with Id:{}. Request made by member with Id:{}",graphiti_tid,assetId,memberId);
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("cache-service-url")).path("/cache/dataAsset/"+assetId+"/table");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid).header("memberId", memberId).header("orgId", orgId);
			ClientResponse clientResponse = builder.delete(ClientResponse.class);
			if(clientResponse.getStatus()==200){ // The status is same if there is error also
				// If SUCCESS then return from the function 
				// else throw an exception
				String user = clientResponse.getEntity(String.class);
				JSONParser parser = new JSONParser();
				return (JSONObject) parser.parse(user);
			}
			else if(clientResponse.getStatus()==HttpStatus.NOT_FOUND.value()){
				logger.error("graphiti-tid:{}. Status recieved from REST service:{}",graphiti_tid,clientResponse.getStatus());
				throw new AssetNotFoundException("Asset not found");
			}
			else if(clientResponse.getStatus()==HttpStatus.INTERNAL_SERVER_ERROR.value()){
				logger.error("graphiti-tid:{}. Status recieved from REST service:{}",graphiti_tid,clientResponse.getStatus());
				throw new GenericInternalServerErrorException("Internal Server error while deleting the table in cache");
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.Error while getting member.Error Message:{}",graphiti_tid,e.getMessage());
			throw new GenericInternalServerErrorException("Internal Server error while deleting the table in cache");
		}
		return null;
	}
}
