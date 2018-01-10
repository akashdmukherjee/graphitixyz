package com.graphiti.externalServices;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.graphiti.Constants;
import com.graphiti.bean.Member;
import com.graphiti.bean.Organization;
import com.graphiti.bean.User;
import com.graphiti.exceptions.TeamRetreivalException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class IdentityService {
	private final Logger logger = LoggerFactory.getLogger(IdentityService.class);
	
	public User getUser(String userId,String graphiti_tid){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("identity-service-url")).path("/user/"+userId);
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			builder.header("Accept","application/json");
			ClientResponse clientResonseData = builder.get(ClientResponse.class);
			if(clientResonseData.getStatus()==200){
				logger.info("graphiti_tid: {}.Got user details from the API",graphiti_tid);
				String userDetailsInString = clientResonseData.getEntity(String.class);
				Gson gson = new Gson();
				User user = gson.fromJson(userDetailsInString,User.class);
				return user;
			}
			else{ 
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}",graphiti_tid,clientResonseData.getStatus());
				return null;
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			return null;
		}
	}
	
	public Member getMember(String graphiti_tid, String memberId) {
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("user-service-url")).path("/member/"+memberId);
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			ClientResponse clientResponse = builder.get(ClientResponse.class);
			if(clientResponse.getStatus()==200){ // The status is same if there is error also
				logger.info("graphiti_tid: {}.Got member details from the API",graphiti_tid);
				String memberDetailsInString = clientResponse.getEntity(String.class);
				Gson gson = new Gson();
				Member member = gson.fromJson(memberDetailsInString, Member.class);
				return member;
			}
			else {
				logger.error("graphiti_tid: {}. Unexpected Error Code from the API. Error Code: {}", graphiti_tid, clientResponse.getStatus());
				return null;
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}.Error while getting member.Error Message:{}",graphiti_tid,e.getMessage());
		}
		return null;
	}
	
	public Organization getOrganizationUsingMemberId(String graphiti_tid, String memberId){
		try{
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("identity-service-url")).path("/member/"+memberId+"/organization");
			Builder builder = webResource.header("graphiti-tid",graphiti_tid);
			ClientResponse clientResponse = builder.get(ClientResponse.class);
			if(clientResponse.getStatus()==200){
				String organizationString = clientResponse.getEntity(String.class);
				logger.info("graphiti-tid:{}. Got organization:{}", graphiti_tid, organizationString);
				Gson gson = new Gson();
				Organization organization = gson.fromJson(organizationString, Organization.class);
				return organization;
			}
			else{ 
				logger.error("graphiti_tid: {}.Unexpected Error Code from the api. Error Code:{}",graphiti_tid,clientResponse.getStatus());
				return null;
			}
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid,e.getMessage());
			return null;
		}
	}
	
	public JSONArray getTeams(String graphiti_tid, String memberId) {
		try {
			WebResource webResource = new Utils()
					.getWebResource(Constants.getInstance().properties.getProperty("user-service-url"))
					.path("/member/"+memberId+"/teams");
			Builder builder = webResource.header("graphiti-tid", graphiti_tid);
			ClientResponse clientResponse = builder.get(ClientResponse.class);
			if (clientResponse.getStatus() == 200) { // The status is same if
														// there is error also
				// If SUCCESS then return from the function
				// else throw an exception
				String teams = clientResponse.getEntity(String.class);
				JSONParser parser = new JSONParser();
				JSONObject jsonObject = (JSONObject) parser.parse(teams);
				if(jsonObject.get("teams")!=null){
					return (JSONArray) jsonObject.get("teams");
				}
				else{
					return null;
				}
			}
		} catch (ParseException e) {
			logger.error("graphiti_tid:{}.Error while getting teams.Error Message:{}", graphiti_tid, e.getMessage());
			throw new TeamRetreivalException("Unable to get teams");
		}
		return null;
	}
	
}
