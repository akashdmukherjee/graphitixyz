package com.graphiti.dataConnector.rest;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import com.graphiti.bean.Connection;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;

public class Jira {
	
	/**
	 * Function to connect to JIRA and get search data
	 * @throws UnsupportedEncodingException 
	 */
	@SuppressWarnings("deprecation")
	public String getData(Connection connection,String jql) throws UnsupportedEncodingException{
		String jiraEndURL = connection.getServerUrl()+"rest/api/2/search?jql="+URLEncoder.encode(jql)+"&startAt=0&maxResults=100000";
		WebResource webResource = new Utils().getWebResource(jiraEndURL,connection.getUsername() , connection.getPassword());
		ClientResponse response = webResource.get(ClientResponse.class);
		String responseInString = response.getEntity(String.class);
		return responseInString;
	}
}
