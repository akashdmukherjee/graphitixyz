package com.graphiti.controller;

import java.sql.SQLException;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.JsonParser;
import com.graphiti.exceptions.DatabaseCreationException;
import com.graphiti.exceptions.DatabaseDeletionException;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.repository.CacheAdministratorRepository;

/**
 * The purpose of this class is to have admin related things on the cache.
 * What are admin related things ?
 * 		1. Creating a database in the cache(When a organization comes you will have to create a new database)
 * 		2. Deleting - *********** Will Not be Done from here ****************
 * 
 * @author 
 *
 */

@RestController
public class CacheAdministrator {
	
	Logger logger = LoggerFactory.getLogger(CacheAdministrator.class);
	
	@Autowired
	CacheAdministratorRepository cacheAdminRepo; 
	
	@RequestMapping(value="/cache/database",method= RequestMethod.POST)
	public ResponseEntity<String> createDatabaseInCache(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String databaseDetails){
		try{
			JSONParser parser = new JSONParser();
			JSONObject object = (JSONObject) parser.parse(databaseDetails);
			// This will call repository to create a database in cache
			cacheAdminRepo.createDatabase(graphiti_tid, (String) object.get("databaseName"));
			return new ResponseEntity<String>("Successfully Created the Database!!!",HttpStatus.CREATED);
		}
		catch(ParseException e){
			logger.error("graphiti-tid:{}. Error parsing the input JSON data.",graphiti_tid);
			throw new JSONParseException("Error while parsing JSON data");
			
		}
		catch(DatabaseCreationException e){
			logger.error("graphiti-tid:{}. Unable to create databse.",graphiti_tid, e);
			throw e;
		}
	}
	
	@RequestMapping(value="/cache/database",method= RequestMethod.DELETE)
	public ResponseEntity<String> deleteDatabaseInCache(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String databaseDetails){
		try{
			JSONParser parser = new JSONParser();
			JSONObject object = (JSONObject) parser.parse(databaseDetails);
			// This will call repository to create a database in cache
			cacheAdminRepo.deleteDatabase(graphiti_tid, (String) object.get("databaseName"));
			return new ResponseEntity<String>("Successfully Deleted the Database!!!",HttpStatus.CREATED);
		}
		catch(ParseException e){
			logger.error("graphiti-tid:{}. Error parsing the input JSON data.",graphiti_tid);
			throw new JSONParseException("Error while parsing JSON data");
			
		}
		catch(DatabaseDeletionException e){
			throw e;
		}
	}
}
