package com.graphiti.externalServices;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.graphiti.Constants;
import com.graphiti.exceptions.SessionRetreivalException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class RedisService {
	private Logger logger = LoggerFactory.getLogger(RedisService.class);
	
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
