package com.graphiti.controller;

import javax.ws.rs.PathParam;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import com.graphiti.Constants;
import com.graphiti.exceptions.CollectionCreationException;
import com.graphiti.exceptions.CollectionDeletionException;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.externalServices.CollectionService;


@RestController
public class CollectionController {
	
	private Logger logger = LoggerFactory.getLogger(CollectionController.class);
		
	@RequestMapping(value="/search/collection",method = RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<String> createCollection(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String collectionInformation){
		try{
			CollectionService collectionService = new CollectionService();
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObject = (JSONObject) jsonParser.parse(collectionInformation);
			logger.info("graphiti_tid:{}. Making a call to create a collection in SOLR with name:{}",graphiti_tid,jsonObject.get("collectionName"));
			collectionService.createCollection(graphiti_tid, (String) jsonObject.get("collectionName"), (String) Constants.getInstance().properties.get("numOfShards"), (String) Constants.getInstance().properties.get("numOfReplicas"), (String) Constants.getInstance().properties.get("configName"));
			logger.info("graphiti_tid:{}. Successfully created a collection in SOLR with name:{}",graphiti_tid,jsonObject.get("collectionName"));
			return new ResponseEntity<String>("Successfully created a collection with name:"+jsonObject.get("collectionName"),HttpStatus.CREATED);
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}. Error parsing incoming JSON Data",graphiti_tid);
			throw new JSONParseException("Unable to parse the query");
		}
		catch(CollectionCreationException e){
			throw e;
		}
	}
	
	@RequestMapping(value="/search/collection/{collectionName}",method = RequestMethod.DELETE)
	public ResponseEntity<String> deleteCollection(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@PathVariable String collectionName){
		try{
			CollectionService collectionService = new CollectionService();
			logger.info("graphiti_tid:{}. Making a call to delete a collection in SOLR with name:{}",graphiti_tid,collectionName);
			collectionService.deleteCollection(graphiti_tid, collectionName);
			logger.info("graphiti_tid:{}. Successfully deleted a collection in SOLR with name:{}",graphiti_tid,collectionName);
			return new ResponseEntity<String>("Successfully deleted a collection:"+collectionName,HttpStatus.NO_CONTENT);
		}
		catch(CollectionDeletionException e){
			throw e;
		}
	}
}
