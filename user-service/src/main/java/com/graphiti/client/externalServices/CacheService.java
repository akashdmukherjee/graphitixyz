package com.graphiti.client.externalServices;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.graphiti.Constants;
import com.graphiti.exceptions.CollectionCreationException;
import com.graphiti.exceptions.CollectionDeletionException;
import com.graphiti.exceptions.DatabaseCreationException;
import com.graphiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class CacheService {

	private Logger logger = LoggerFactory.getLogger(CacheService.class);
	
	public void createDatabaseInCache(String graphiti_tid,String databaseName){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("cache-service-url")).path("cache/database");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			builder.header("Content-Type", "application/json");
			JSONObject jsonObject = new JSONObject();
			jsonObject.put("databaseName", databaseName);
			ClientResponse clientResonseData = builder.post(ClientResponse.class,jsonObject.toJSONString());
			if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){
				// This means that the database has been successfully created
			}
			else{ 
				String messageFromAPI = clientResonseData.getEntity(String.class);
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}. Error Message:{}",graphiti_tid,clientResonseData.getStatus(),messageFromAPI);
				throw new DatabaseCreationException("Error while creating a database in cache");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw new DatabaseCreationException("Error while creation of collection.");
		}
	}
	
	public void deleteDatabaseInCache(String graphiti_tid, String databaseName){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("cache-service-url")).path("cache/database");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			builder.header("Content-Type", "application/json");
			JSONObject jsonObject = new JSONObject();
			jsonObject.put("databaseName", databaseName);
			ClientResponse clientResonseData = builder.delete(ClientResponse.class,jsonObject.toJSONString());
			logger.info("Delete database response data: {}", clientResonseData);
			if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){
				// This means that the database has been successfully created
			}
			else{ 
				String messageFromAPI = clientResonseData.getEntity(String.class);
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}. Error Message:{}",graphiti_tid,clientResonseData.getStatus(),messageFromAPI);
				throw new CollectionDeletionException("Error while deleting a database in cache");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw new CollectionDeletionException("Error while deletion of collection.");
		}
	}
	
}
