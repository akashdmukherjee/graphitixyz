package com.graphiti.client.externalServices;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.google.gson.Gson;
import com.graphiti.Constants;
import com.graphiti.bean.User;
import com.graphiti.exceptions.CollectionCreationException;
import com.graphiti.exceptions.CollectionDeletionException;
import com.graphiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;


/**
 * Contains Methods to call Search Service 
 * 
 * @author 
 *
 */
public class SearchService {
	
	private Logger logger = LoggerFactory.getLogger(SearchService.class);
	
	public void createCollection(String graphiti_tid,String collectionName){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("search/collection");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			builder.header("Accept","application/text");
			builder.header("Content-Type", "application/json");
			JSONObject jsonObject = new JSONObject();
			jsonObject.put("collectionName", collectionName);
			ClientResponse clientResonseData = builder.post(ClientResponse.class,jsonObject.toJSONString());
			if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){
				String messageFromAPI = clientResonseData.getEntity(String.class);
				if(messageFromAPI != null && messageFromAPI.contains("Successfully")){
					// Do nothing
				}
				else{
					logger.error("graphiti-tid:{}.Error while creating a collection.",graphiti_tid);
					throw new CollectionCreationException("Error while creation of collection.");
				}
			}
			else{ 
				String messageFromAPI = clientResonseData.getEntity(String.class);
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}. Error Message:{}",graphiti_tid,clientResonseData.getStatus(),messageFromAPI);
				throw new CollectionCreationException("Error while creation of collection.");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw new CollectionCreationException("Error while creation of collection.");
		}
	}
	
	public void deleteCollection(String graphiti_tid,String collectionName){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("search-service-url")).path("search/collection/"+collectionName);
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			ClientResponse clientResonseData = builder.delete(ClientResponse.class);
			if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){
				String messageFromAPI = clientResonseData.getEntity(String.class);
				if(messageFromAPI != null && messageFromAPI.contains("Successfully")){
					// Do nothing
				}
				else{
					logger.error("graphiti-tid:{}.Error while deletion of collection.",graphiti_tid);
					throw new CollectionCreationException("Error while deletion of collection.");
				}
			}
			else{ 
				String messageFromAPI = clientResonseData.getEntity(String.class);
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}. Error Message:{}",graphiti_tid,clientResonseData.getStatus(),messageFromAPI);
				throw new CollectionCreationException("Error while deletion of collection.");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw new CollectionCreationException("Error while deletion of collection.");
		}
	}
}
