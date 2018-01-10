package com.graphiti.externalServices;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.graphiti.Constants;
import com.graphiti.bean.Organization;
import com.graphiti.exceptions.OrganizationNotFoundException;
import com.graphiti.exceptions.TeamRetreivalException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

public class IdentityService {
	private Logger logger = LoggerFactory.getLogger(IdentityService.class);

	public Organization getOrganization(String graphiti_tid, String orgId) {
		try {
			Organization organization;
			logger.info("graphiti_tid:{}.Getting organization with orgId:{}", graphiti_tid, orgId);
			WebResource webResource = new Utils()
					.getWebResource(Constants.getInstance().properties.getProperty("user-service-url"))
					.path("/org/" + orgId);
			Builder builder = webResource.header("graphiti-tid", graphiti_tid);
			ClientResponse clientResponse = builder.get(ClientResponse.class);
			if (clientResponse.getStatus() == 200) { // The status is same if
														// there is error also
				// If SUCCESS then return from the function
				// else throw an exception
				String organizationString = clientResponse.getEntity(String.class);
				Gson gson = new Gson();
				organization = gson.fromJson(organizationString, Organization.class);
				return organization;
			} else {
				String clientResponseInString = clientResponse.getEntity(String.class);
				logger.error("graphiti_tid:{}.Error while getting organization. Error Code:{}.Error Message:{}",
						graphiti_tid, clientResponse.getStatus(), clientResponseInString);
				throw new OrganizationNotFoundException("Error while getting organization.");
			}
		} catch (OrganizationNotFoundException e) {
			throw e;
		} catch (Exception e) {
			logger.error("graphiti_tid:{}.Error while getting organization.Error Message:{}", graphiti_tid,
					e.getMessage());
			throw new OrganizationNotFoundException("Error while getting organization.");

		}
	}

	public JSONArray getTeams(String graphiti_tid, String memberId,String orgId) {
		try {
			WebResource webResource = new Utils()
					.getWebResource(Constants.getInstance().properties.getProperty("user-service-url"))
					.path("/member/" + memberId + "/teams");
			Builder builder = webResource.header("graphiti-tid", graphiti_tid).header("memberId", memberId).header("orgId", orgId);
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
