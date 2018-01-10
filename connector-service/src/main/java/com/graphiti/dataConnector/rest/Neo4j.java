package com.graphiti.dataConnector.rest;

import java.sql.SQLException;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import com.graphiti.bean.Connection;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;

public class Neo4j {

	/**
	 * Get Neo4j data
	 * server url:http://localhost:7474
	 * @param connection
	 * @param query
	 * @return
	 * @throws 
	 */
	@SuppressWarnings("unchecked")
	public String getData(Connection connection,String query){
		//TODO - Make the rest service externalized 
		String endURL = connection.getServerUrl()+"db/data/transaction/commit";
		WebResource webResource = new Utils().getWebResource(endURL,connection.getUsername() , connection.getPassword());
		JSONObject finalJSONObject = new JSONObject();
		JSONObject jsonObject = new JSONObject();
		jsonObject.put("statement", query);
		JSONArray jsonArray = new JSONArray();
		jsonArray.add(jsonObject);
		finalJSONObject.put("statements", jsonArray);
		ClientResponse response = webResource.header("Content-Type","application/json").post(ClientResponse.class,finalJSONObject.toJSONString());
		String responseInString = response.getEntity(String.class);
		return responseInString;
	}
	
	/*public static void main(String[] args) throws ClassNotFoundException, SQLException{
		com.graphiti.bean.Connection con = new com.graphiti.bean.Connection();
		con.setServerUrl("http://localhost:7474/");
		con.setUsername("neo4j");
		con.setPassword("abc123");
		Neo4j neo4j = new Neo4j();
		String str = neo4j.getData(con, "MATCH(emp:EMPLOYE) return emp");
		System.out.println(str);
		
	}*/
	
}
