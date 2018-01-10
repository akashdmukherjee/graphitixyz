package com.graphiti.client.externalServices;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.graphiti.Constants;
import com.graphiti.exceptions.DatabaseCreationException;
import com.graphiti.exceptions.SessionRetreivalException;
import com.graphiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class RedisService {
	private Logger logger = LoggerFactory.getLogger(RedisService.class);
	
	public String setSession(String graphiti_tid,String userId){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("redis-service-url")).path("/session");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			builder.header("Content-Type", "application/json");
			JSONObject jsonObject = new JSONObject();
			jsonObject.put("userId", userId);
			ClientResponse clientResonseData = builder.post(ClientResponse.class,jsonObject.toJSONString());
			if(clientResonseData.getStatus()==HttpStatus.CREATED.value()){
				JSONParser parser = new JSONParser();
				JSONObject result = (JSONObject) parser.parse(clientResonseData.getEntity(String.class));
				return (String) result.get("sessionId");
			}
			else{ 
				String messageFromAPI = clientResonseData.getEntity(String.class);
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}. Error Message:{}",graphiti_tid,clientResonseData.getStatus(),messageFromAPI);
				throw new SessionRetreivalException("Unable to retreive session");
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw new SessionRetreivalException("Unable to retreive session");
		}
	}
	
	public boolean validateSession(String graphiti_tid, String userId, String sessionId){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("redis-service-url")).path("/session/validate");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			builder.header("Content-Type", "application/json");
			JSONObject jsonObject = new JSONObject();
			jsonObject.put("userId", userId);
			jsonObject.put("sessionId", sessionId);
			ClientResponse clientResonseData = builder.put(ClientResponse.class, jsonObject.toString());
			if(clientResonseData.getStatus()==HttpStatus.NO_CONTENT.value()){
				return true;
			}
			return false;
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw new SessionRetreivalException("Unable to retreive session");
		}
	}
}
