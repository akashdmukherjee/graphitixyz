package com.graphiti.externalServices;

import javax.ws.rs.core.MultivaluedMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.graphiti.Constants;
import com.graphiti.exceptions.CollectionCreationException;
import com.graphiti.exceptions.CollectionDeletionException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.util.MultivaluedMapImpl;

public class CollectionService {
	
	private Logger logger = LoggerFactory.getLogger(CollectionService.class);
	
	/**
	 * The purpose is to create a new collection in SOLR
	 * 
	 * @param graphti_tid
	 * @param collectionName
	 * @param configName
	 */
	public void createCollection(String graphiti_tid,String collectionName,String numOfShards,String numOfReplicas,String configName){
		try{
			logger.info("graphiti_tid:{}.Creating a collection with name:{}",graphiti_tid,numOfReplicas);
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("solr-url")).path("/admin/collections");
			MultivaluedMap<String,String> queryParams = new MultivaluedMapImpl();
			queryParams.add("action","CREATE");
			queryParams.add("name", collectionName);
			queryParams.add("numShards",numOfShards);
			queryParams.add("numOfReplicas",numOfReplicas);
			queryParams.add("collection.configName",configName);
			webResource = webResource.queryParams(queryParams);
			ClientResponse clientResponse = webResource.get(ClientResponse.class);
			if(clientResponse.getStatus()==200){ // The status is same if there is error also
				// TODO - XML Parsing To Check Status
				// If SUCCESS then return from the function 
				// else throw an exception
				
			}
			else{
				String clientResponseInString = clientResponse.getEntity(String.class);
				logger.error("graphiti_tid:{}.Error while creation of collection. Error Code:{}.Error Message:{}",graphiti_tid,clientResponse.getStatus(),clientResponseInString);
				throw new CollectionCreationException("Error while creation of Collection.");
			}
		}
		catch(CollectionCreationException e){
			throw e;
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}.Error while creation of collection.Error Message:{}",graphiti_tid,e.getMessage());
			throw new CollectionCreationException("Error while creation of Collection.");
			
		}
	}
	
	/**
	 * The purpose of the function is to delete a collection in SOLR
	 * 
	 * @param
	 * 
	 */
	public void deleteCollection(String graphiti_tid,String collectionName){
		try{
			// TODO - As of now making this a SYNC request. Not important
			// to make it an AYNC request since this will be hardly be done 
			logger.info("graphiti_tid:{}. Deleting a collection with name:{}",graphiti_tid,collectionName);
			WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("solr-url")).path("/admin/collections");
			MultivaluedMap<String,String> queryParams = new MultivaluedMapImpl();
			queryParams.add("action","DELETE");
			queryParams.add("name", collectionName);
			webResource = webResource.queryParams(queryParams);
			ClientResponse clientResponse = webResource.get(ClientResponse.class);
			if(clientResponse.getStatus()==200){ // The status is same if there is error also
				// TODO - XML Parsing To Check Status
				// If SUCCESS then return from the function 
				// else throw an exception
			}
			else{
				String clientResponseInString = clientResponse.getEntity(String.class);
				logger.error("graphiti_tid:{}.Error while deleton of collection.Error Code:{}.Error Message:{}",graphiti_tid,clientResponse.getStatus(),clientResponseInString);
				throw new CollectionDeletionException("Error while deletion of Collection.");
			}
		}
		catch(CollectionDeletionException e){
			throw e;
		}
		catch(Exception e){
			logger.error("graphiti_tid:{}.Error while deletion of collection.Error Message:{}",graphiti_tid,e.getMessage());
			throw new CollectionDeletionException("Error while deletion of Collection.");
		}
	}
}
