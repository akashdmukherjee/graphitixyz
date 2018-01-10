package com.graphiti.controller;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Random;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.regex.Pattern;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.filter.HttpPutFormContentFilter;

import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.util.IOUtils;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.graphiti.Constants;
import com.graphiti.Factory.DatabaseFactory;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.ChartConfigurations;
import com.graphiti.bean.Connection;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.DataSourceType;
import com.graphiti.bean.InjestionOperationType;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.User;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.bean.UserType;
import com.graphiti.client.externalServices.AssetService;
import com.graphiti.client.externalServices.IdentityService;
import com.graphiti.client.externalServices.SearchService;
import com.graphiti.dataConnector.rest.Jira;
import com.graphiti.database.Database;
import com.graphiti.database.MSSQL;
import com.graphiti.database.Oracle;
import com.graphiti.database.PostGreSQL;
import com.graphiti.database.SQL;
import com.graphiti.exceptions.ColumnInformationRetrievalFromConnectorException;
import com.graphiti.exceptions.DataInjestionException;
import com.graphiti.exceptions.DatabaseConnectionException;
import com.graphiti.exceptions.DatabaseNotSupportedException;
import com.graphiti.exceptions.JDBCConnectionCloseException;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.MissingValueInDataException;
import com.graphiti.exceptions.RequiredFieldMissing;
import com.graphiti.exceptions.TableCreationInCacheException;
import com.graphiti.exceptions.TablesInformationRetrievalFromConnectorException;
import com.graphiti.repository.AmazonS3Repository;
import com.graphiti.repository.CacheRepository;
import com.graphiti.repository.ConnectionRepository;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

@RestController
public class DataConnectorController {

	private Logger logger = LoggerFactory.getLogger(DataConnectorController.class);
	
	
	public static final String CACHE_UPDATE = "CACHE_UPDATE"; 
	public static final String FIELD_UPDATE_ONLY = "FIELD_UPDATE_ONLY"; 
	public static final String DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME = "DATASET - ";
	private final String STRING_APPENDED_FOR_DS = "_DS";
	
	@Autowired
	private ConnectionRepository connectionRepository;
	
	@Autowired
	private CacheRepository cacheRepository;
	
	@Autowired
	private Environment env;
	
	@RequestMapping(value = "/health", method = RequestMethod.GET)
	public ResponseEntity<String> testConnection(){
		return new ResponseEntity<>("OK",HttpStatus.OK);
	}
	
	// Make External
	@RequestMapping(value = "/connection/testConnection", method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public ResponseEntity<Object> testConnection(@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestBody Connection connection){
		boolean isConnectionSuccessful = false;
		if(connection.getId()!=null){ // existing connection
			if(connection.getPassword()==null){ // No change in password
				Connection oldConnection = connectionRepository.getWithPassword(connection.getId(), connection.getOrganization());
				connection.setPassword(oldConnection.getPassword());
			}
		}
		if(connection.getDatabaseType().equalsIgnoreCase("POSTGRESQL")){
			Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
			PostGreSQL postGresqlDb = (PostGreSQL) database;
			isConnectionSuccessful = postGresqlDb.testConnection(connection);
		}
		JSONObject responseJSONObject = new JSONObject();
		responseJSONObject.put("statusOfConnectionCheck", isConnectionSuccessful);
		return new ResponseEntity<>(responseJSONObject,HttpStatus.OK);
	}
	
	@RequestMapping(value = "/ext/connection/testConnection", method = RequestMethod.POST, produces = "application/json", consumes = "application/json")
	public ResponseEntity<Object> exttestConnection(@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestBody Connection connection){
		return testConnection(memberId,graphiti_tid,connection);
	}
	
	// Make External
	@RequestMapping(value="/data/upload",method=RequestMethod.POST,produces="application/json")
	public ResponseEntity<Object> fileUpload(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestParam("dataAssetName") String dataAssetName,
			@RequestParam("typeOfFile") String typeOfFile,
			@RequestParam("file") MultipartFile file) {
		// Identity Service instances
		IdentityService identityService = new IdentityService();
		DataUtilController dataUtilController = new DataUtilController();
		CacheRepository cacheRepository = new CacheRepository();
		Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
		logger.info("Organization:{}", organization);
		// Change this to get the database name 
		String databaseName = organization.getCacheDatabaseName(); //Constants.getInstance().properties.getProperty("databaseName");
		String bucketName = organization.getS3BucketName();
		User userDetails = identityService.getUser(memberId, graphiti_tid);
		String tableNameInCache = Utils.generateRandomString(6);
		if (!file.isEmpty()) {
			try {
				Reader reader = new InputStreamReader(file.getInputStream(),"UTF-8");
				BufferedReader br = new BufferedReader(reader);
				String header = br.readLine().toLowerCase();// Read the header
				String delimiter;
				String line;
				switch(typeOfFile=typeOfFile.toLowerCase()){
					case "csv" : delimiter = ",";
					break;
					case "tsv" : delimiter = "\t";
					break;
					case "space" : delimiter = "\\s";
					break;
					default : delimiter = ",";
					break;
					}
				String[] headerInArray = header.split(delimiter);
				JSONArray dataJSONArray = new JSONArray();
				while((line=br.readLine())!=null){
					JSONObject jsonObject = new JSONObject();
					String[] valuesInArray = line.split(delimiter);
					for(int i=0;i<headerInArray.length;i++){
						if(valuesInArray[i]==null){
							throw new MissingValueInDataException("Missing Value in line:"+line+" for column:"+headerInArray[i]);
						}
						jsonObject.put(headerInArray[i],valuesInArray[i]);
					}
					dataJSONArray.add(jsonObject);
					line = null;
				}
				// Once we have get the data
				// we need to call the data types api to get the data types of each of the keys in 
				// the JSON objects
				int num = Integer.parseInt(env.getProperty("noOfrecordsToCheckForDataTypes"));
				// If dataJSONArray is very less then we can go over every 
				// record
				if(dataJSONArray.size()<num){
					num = dataJSONArray.size();
				}
				// these many number of JSONObjects will be used to get the data types for 
				// a JSONObject
				JSONArray arrayOfObjectsForDataTypesKnowledge = new JSONArray();
				Random rndNumGen = new Random();
				for(int i=0;i<num;i++){
					JSONObject objectForDataTypesInspection = (JSONObject) dataJSONArray.get(rndNumGen.nextInt(num));
					arrayOfObjectsForDataTypesKnowledge.add(objectForDataTypesInspection);
				}
				// get data types
				JSONObject dataTypesInJSON = (JSONObject) dataUtilController.getDataTypes(arrayOfObjectsForDataTypesKnowledge);
				arrayOfObjectsForDataTypesKnowledge = null;
				logger.info("DataTypesInJson: {}", dataTypesInJSON);
				Boolean createTableStatus = dataUtilController.createTableInCacheBasedOnDatatypes(graphiti_tid,databaseName,tableNameInCache, dataTypesInJSON,organization.getId());
				boolean injestSuccessStatus=false;
				if(createTableStatus){
					// Once the table has been created 
					// We need to injest the data
					injestSuccessStatus = cacheRepository.injestDataIntoCache(graphiti_tid,databaseName, tableNameInCache, dataJSONArray, dataTypesInJSON,organization.getId());
				}
				if(injestSuccessStatus==true){
					// Make an entry into asset
					// REST call to Asset service
					List<String> listOfColumnNames = new ArrayList<String>(dataTypesInJSON.keySet());
					// In this case - connectionId is null
					AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,userDetails.getName(),UserType.MEMBER,dataAssetName,AssetType.DATASET,tableNameInCache,DataSourceType.FILE_UPLOAD,file.getOriginalFilename(),listOfColumnNames,null,userDetails.getOrganization(), null);
					AssetService assetService = new AssetService();
					JSONObject assetDetails = assetService.addDetailedAsset(graphiti_tid, memberId, assetDetailInformation,false);
					String assetId = (String) assetDetails.get("dataSetAssetId");
					int discoverabilityScore = ((Long) assetDetails.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
					// REST call to Search service
					SearchService searchService = new SearchService();
					String[] columnNamesInArray = new String[listOfColumnNames.size()];
					listOfColumnNames.toArray(columnNamesInArray);
					// assetContent and assetDescription are null
					searchService.addAssetForSearch(graphiti_tid, assetId, dataAssetName, AssetType.DATASET.getValue(),null, memberId, userDetails.getName(),userDetails.getOrganization(),columnNamesInArray, null,discoverabilityScore);
					JSONObject jsonObjectResponse = new JSONObject();
					jsonObjectResponse.put("message", "You successfully uploaded!!!");
					jsonObjectResponse.put("dataTypes",dataTypesInJSON);
					jsonObjectResponse.put("assetId", assetId);
					return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.OK);
				}
				else{
					JSONObject jsonObjectResponse = new JSONObject();
					jsonObjectResponse.put("message", "File Upload Unsuccessful!!!");
					jsonObjectResponse.put("dataTypes",null);
					return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
				}
			}
			catch (UnsupportedEncodingException e) {
				JSONObject jsonObjectResponse = new JSONObject();
				jsonObjectResponse.put("message", "Unsupported encoding exception while reading file.");
				jsonObjectResponse.put("dataTypes",null);
				return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.BAD_REQUEST);
			}
			catch (IOException e){
				JSONObject jsonObjectResponse = new JSONObject();
				jsonObjectResponse.put("message", "Error while reading the file that has been uploaded."+e.getMessage());
				jsonObjectResponse.put("dataTypes",null);
				return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
			}
			catch(ParseException e){
				JSONObject jsonObjectResponse = new JSONObject();
				jsonObjectResponse.put("message", "File Upload Unsuccessful!!!");
				jsonObjectResponse.put("dataTypes",null);
				// TODO -  Excepting while parsing JSONObject for datatypes
				// Add a logger statement
				return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
			}
			catch(TableCreationInCacheException e){
				JSONObject jsonObjectResponse = new JSONObject();
				jsonObjectResponse.put("message", "Error while creation of table in cache");
				jsonObjectResponse.put("dataTypes",null);
				logger.info("graphiti-tid:{}. Error while creating table in database");
				return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
			}
			catch(DataInjestionException e){
				JSONObject jsonObjectResponse = new JSONObject();
				jsonObjectResponse.put("message", "Error while injestion of data to cache.");
				jsonObjectResponse.put("dataTypes",null);
				// TODO - Here we need to delete the table that was created
				// Add logger to log the actual exception
				cacheRepository.deleteDataSetFromCache(graphiti_tid,databaseName,tableNameInCache,organization.getId());
				return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
			}
		} else {
			// BAD request for file empty
			JSONObject jsonObjectResponse = new JSONObject();
			jsonObjectResponse.put("message", "Failed to Upload as the file was empty!!!");
			jsonObjectResponse.put("dataTypes",null);
			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.BAD_REQUEST);
		}
	}
	
	@RequestMapping(value="/ext/data/upload",method=RequestMethod.POST,produces="application/json")
	public ResponseEntity<Object> extfileUpload(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestParam("dataAssetName") String dataAssetName,
			@RequestParam("typeOfFile") String typeOfFile,
			@RequestParam("file") MultipartFile file) {
		return fileUpload(memberId,graphiti_tid,dataAssetName,typeOfFile,file);
	}
	
	/**
	 * Replace file and update asset 
	 */
	@RequestMapping(value="/data/upload/update",method=RequestMethod.POST,produces="application/json")
	public ResponseEntity<Object> updateFileUpload(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "assetId") String assetId,
			@RequestParam(value = "dataAssetName") String dataAssetName,
			@RequestParam(value = "typeOfFile") String typeOfFile,
			@RequestParam(value = "orgId") String orgId,
			@RequestParam(value = "file") MultipartFile file) {
		// Identity Service instances
		IdentityService identityService = new IdentityService();
		AssetService assetService = new AssetService();
		DataUtilController dataUtilController = new DataUtilController();
        CacheRepository cacheRepository = new CacheRepository();
        Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
        logger.info("graphiti-tid:{}. Organization:{}", graphiti_tid, organization);
        // Change this to get the database name 
        String databaseName = organization.getCacheDatabaseName(); //Constants.getInstance().properties.getProperty("databaseName");
        User userDetails = identityService.getUser(memberId, graphiti_tid);
        if (!file.isEmpty()) {
            try {
            	Reader reader = new InputStreamReader(file.getInputStream(),"UTF-8");
            	BufferedReader br = new BufferedReader(reader);
            	String header = br.readLine().toLowerCase();// Read the header
            	String delimiter;
            	String line;
            	switch(typeOfFile=typeOfFile.toLowerCase()){
	            	case "csv" : delimiter = ",";
	            				 break;
	            	case "tsv" : delimiter = "\t";
	            				 break;
	            	case "space" : delimiter = "\\s";
	            				   break;
	            	default : delimiter = ",";
	            			  break;
            	}
            	String[] headerInArray = header.split(delimiter);
            	JSONArray dataJSONArray = new JSONArray();
            	while((line=br.readLine())!=null){
            		JSONObject jsonObject = new JSONObject();
            		String[] valuesInArray = line.split(delimiter);
            		for(int i=0;i<headerInArray.length;i++){
            			if(valuesInArray[i]==null){
            				throw new MissingValueInDataException("Missing Value in line:"+line+" for column:"+headerInArray[i]);
            			}
            			jsonObject.put(headerInArray[i],valuesInArray[i]);
            		}
            		dataJSONArray.add(jsonObject);
            		line = null;
            	}
            	// Once we have get the data
            	// we need to call the data types api to get the data types of each of the keys in 
            	// the JSON objects
            	int num = Integer.parseInt(env.getProperty("noOfrecordsToCheckForDataTypes"));
				// If dataJSONArray is very less then we can go over every 
				// record
				if(dataJSONArray.size()<num){
					num = dataJSONArray.size();
				}
            	// these many number of JSONObjects will be used to get the data types for 
            	// a JSONObject
            	JSONArray arrayOfObjectsForDataTypesKnowledge = new JSONArray();
            	Random rndNumGen = new Random();
            	for(int i=0;i<num;i++){
            		JSONObject objectForDataTypesInspection = (JSONObject) dataJSONArray.get(rndNumGen.nextInt(num));
            		arrayOfObjectsForDataTypesKnowledge.add(objectForDataTypesInspection);
            	}
            	JSONObject dataTypesInJSON = (JSONObject) dataUtilController.getDataTypes(arrayOfObjectsForDataTypesKnowledge);
				arrayOfObjectsForDataTypesKnowledge = null;
        		logger.info("DataTypesInJson: {}", dataTypesInJSON);
        		DataSet dataSetDetails= assetService.getDataSetAssetDetails(graphiti_tid, memberId, assetId,organization.getId());
        		boolean statusOfDeletionOfTable = cacheRepository.deleteDataSetFromCache(graphiti_tid, databaseName, dataSetDetails.getCacheTableName(),organization.getId());
        		if(statusOfDeletionOfTable){
        			// TODO - throw Exception of failure to delete table
        		}
        		Boolean createTableStatus = dataUtilController.createTableInCacheBasedOnDatatypes(graphiti_tid,databaseName,dataSetDetails.getCacheTableName(), dataTypesInJSON,organization.getId());
        		boolean injestSuccessStatus=false;
        		if(createTableStatus){
        			// Once the table has been created 
        			// We need to injest the data
        			injestSuccessStatus = cacheRepository.injestDataIntoCache(graphiti_tid,databaseName, dataSetDetails.getCacheTableName(), dataJSONArray, dataTypesInJSON,organization.getId());
        		}
        		if(injestSuccessStatus==true){
        			// Make an entry into asset
        			// REST call to Asset service
        			// TODO use update assets
        			List<String> listOfColumnNames = new ArrayList<String>(dataTypesInJSON.keySet());
        			String[] columnNamesInArray = new String[listOfColumnNames.size()];
        			listOfColumnNames.toArray(columnNamesInArray);
        			
        			// In this case - connectionId is null
        			AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,userDetails.getName(),UserType.MEMBER,dataAssetName,AssetType.DATASET,dataSetDetails.getCacheTableName(),DataSourceType.FILE_UPLOAD,file.getOriginalFilename(),listOfColumnNames,null,userDetails.getOrganization(),null);
        			JSONObject jsonObject = assetService.updateAsset(graphiti_tid, memberId, orgId,assetId, assetDetailInformation, CACHE_UPDATE, DataSourceType.FILE_UPLOAD.getValue(),false);
        			int discoverabilityScore = ((Long) jsonObject.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
        			StringBuffer commaSeparatedListOfFields = new StringBuffer();
        			SearchService searchService = new SearchService();
        			Asset solrAssetToUpdate = new Asset();
        			solrAssetToUpdate.setAssetId(assetId);
        			solrAssetToUpdate.setLastModifiedBy_id(memberId);
        			solrAssetToUpdate.setLastModifiedBy_name(userDetails.getName());
        			solrAssetToUpdate.setOrgId(organization.getId());
        			solrAssetToUpdate.setDataColumns(columnNamesInArray);
        			solrAssetToUpdate.setDiscoverabilityScore(discoverabilityScore);
        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
                    						  .append("assetId,").append("dataColumns,").append("discoverabilityScore,").append("orgId");
        			searchService.updateAssetForSearch(graphiti_tid, memberId,assetId, solrAssetToUpdate,commaSeparatedListOfFields.toString());
        			
        			// assetContent and assetDescription are null
        			JSONObject jsonObjectResponse = new JSONObject();
        			jsonObjectResponse.put("message", "You successfully uploaded!!!");
        			jsonObjectResponse.put("dataTypes",dataTypesInJSON);
        			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.OK);
        		}
        		else{
        			JSONObject jsonObjectResponse = new JSONObject();
        			jsonObjectResponse.put("message", "File Upload Unsuccessful!!!");
        			jsonObjectResponse.put("dataTypes",null);
        			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
        		}
            }
            catch (UnsupportedEncodingException e) {
            	JSONObject jsonObjectResponse = new JSONObject();
    			jsonObjectResponse.put("message", "Unsupported encoding exception while reading file.");
    			jsonObjectResponse.put("dataTypes",null);
    			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.BAD_REQUEST);
			}
            catch (IOException e){
            	JSONObject jsonObjectResponse = new JSONObject();
    			jsonObjectResponse.put("message", "Error while reading the file that has been uploaded."+e.getMessage());
    			jsonObjectResponse.put("dataTypes",null);
    			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
            }
            catch(ParseException e){
            	JSONObject jsonObjectResponse = new JSONObject();
    			jsonObjectResponse.put("message", "File Upload Unsuccessful!!!");
    			jsonObjectResponse.put("dataTypes",null);
    			// TODO -  Excepting while parsing JSONObject for datatypes
    			// Add a logger statement
    			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
            }
            catch(TableCreationInCacheException e){
            	JSONObject jsonObjectResponse = new JSONObject();
    			jsonObjectResponse.put("message", "Error while creation of table in cache");
    			jsonObjectResponse.put("dataTypes",null);
    			logger.info("graphiti-tid:{}. Error while creating table in database");
    			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
            }
            catch(DataInjestionException e){
            	JSONObject jsonObjectResponse = new JSONObject();
    			jsonObjectResponse.put("message", "Error while injestion of data to cache.");
    			jsonObjectResponse.put("dataTypes",null);
    			// TODO - Here we need to delete the table that was created
    			// Add logger to log the actual exception
    			cacheRepository.deleteDataSetFromCache(graphiti_tid,databaseName,dataAssetName,organization.getId());
    			return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } else {
        	// BAD request for file empty
        	JSONObject jsonObjectResponse = new JSONObject();
			jsonObjectResponse.put("message", "Failed to Upload as the file was empty!!!");
			jsonObjectResponse.put("dataTypes",null);
            return new ResponseEntity<Object>(jsonObjectResponse,HttpStatus.BAD_REQUEST);
        }
    }
	
	/**
	 * Get data using connectors
	 * 
	 * @param orgId
	 * @param graphiti
	 * @param connectionId
	 * @param query
	 * @return
	 */
	public Object getDataFromConnector(String orgId,String graphiti_tid,String connectionId,String query){
		try{
			Connection connection =  connectionRepository.getWithPassword(connectionId,orgId);
			Object returnedData = null;
			if(connection.getDatabaseType().equalsIgnoreCase("SQL")){
				Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
				SQL sqlDb = (SQL) database;
				Object dbConnection = sqlDb.getConnection(connection);
				java.sql.Connection sqlConnection = (java.sql.Connection) dbConnection;
				returnedData = sqlDb.getData(sqlConnection, query);
			}
			else if(connection.getDatabaseType().equalsIgnoreCase("POSTGRESQL")){
				Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
				PostGreSQL postGresqlDb = (PostGreSQL) database;
				Object dbConnection = postGresqlDb.getConnection(connection);
				java.sql.Connection postGresqlConnection = (java.sql.Connection) dbConnection;
				returnedData = postGresqlDb.getData(postGresqlConnection, query);
			}
			else if(connection.getDatabaseType().equalsIgnoreCase("ORACLE")){
				Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
				Oracle oracleDb = (Oracle) database;
				Object dbConnection = oracleDb.getConnection(connection);
				java.sql.Connection oracleConnection = (java.sql.Connection) dbConnection;
				returnedData = oracleDb.getData(oracleConnection, query);
			}
			else if(connection.getDatabaseType().equalsIgnoreCase("MS-SQL")){
				Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
				MSSQL mssqlDb = (MSSQL) database;
				Object dbConnection = mssqlDb.getConnection(connection);
				java.sql.Connection mssqlConnection = (java.sql.Connection) dbConnection;
				returnedData = mssqlDb.getData(mssqlConnection, query);
			}
			else if(connection.getDatabaseType().equalsIgnoreCase("JIRA")){
				Jira jira = new Jira();
				returnedData = jira.getData(connection, query);
			}
			else{
				throw new DatabaseNotSupportedException("The connector for thi database "+connection.getDatabaseType()+" is not supported yet");
			}
			return returnedData;
		}
		catch(ClassNotFoundException e){
			throw new DatabaseConnectionException("Error connecting to the database. Please check the details you have provided for this connection.");
		}
		catch(SQLException e){
			throw new DatabaseConnectionException("Error connecting to the database. Please check the details you have provided for this connection.");
		} catch (UnsupportedEncodingException e) {
			throw new DatabaseConnectionException("Error occured while getting results from JIRA");
		}
		finally{
			System.gc();
		}
	}
	
	// Make External
	@RequestMapping(value = "/connection/{connectionId}/tables", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getTableInformation(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "schemaName", required = false) String schemaName,
			@PathVariable String connectionId) {
		try{
			Connection connection =  connectionRepository.getWithPassword(connectionId,orgId);
			Object returnedTableInformation = null;
			if(connection.getDatabaseType().equalsIgnoreCase("POSTGRESQL")){
				Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
				PostGreSQL postGresqlDb = (PostGreSQL) database;
				if(schemaName == null) {
					schemaName = "public";
				}
				returnedTableInformation = postGresqlDb.getTableNamesFromConnection(connection, schemaName);
			}
			return new ResponseEntity<>(returnedTableInformation,HttpStatus.OK);
		}
		catch(TablesInformationRetrievalFromConnectorException|JDBCConnectionCloseException e){
			throw e;
		}
	}
	
	@RequestMapping(value = "/connection/{connectionId}/table/{tableName}/columns", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getColumnInformation(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "schemaName", required = false) String schemaName,
			@PathVariable String connectionId,
			@PathVariable String tableName) {
		try{
			Connection connection =  connectionRepository.getWithPassword(connectionId,orgId);
			Object returnedColumnInformation = null;
			if(connection.getDatabaseType().equalsIgnoreCase("POSTGRESQL")){
				Database database = new DatabaseFactory().getDatabase(connection.getDatabaseType());
				PostGreSQL postGresqlDb = (PostGreSQL) database;
				if(schemaName == null) {
					schemaName = "public";
				}
				returnedColumnInformation = postGresqlDb.getColumnNamesForATableFromConnection(connection,schemaName,tableName);
			}
			return new ResponseEntity<>(returnedColumnInformation,HttpStatus.OK);
		}
		catch(ColumnInformationRetrievalFromConnectorException|JDBCConnectionCloseException e){
			throw e;
		}
	}
	
	@RequestMapping(value = "/ext/connection/{connectionId}/table/{tableName}/columns", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extgetColumnInformation(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "schemaName", required = false) String schemaName,
			@PathVariable String connectionId,
			@PathVariable String tableName) {
		return getColumnInformation(memberId,graphiti_tid,orgId,schemaName,connectionId,tableName);
	}
	
	@RequestMapping(value = "/ext/connection/{connectionId}/tables", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extgetTableInformation(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestParam(value = "schemaName", required = false) String schemaName,
			@PathVariable String connectionId) {
		return getTableInformation(memberId,graphiti_tid,orgId,schemaName,connectionId);
	}
	
	// Make External
	@RequestMapping(value = "/connection/{connectionId}/data", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> getData(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@PathVariable String connectionId, @RequestBody String queryAndAssetDetails) {
		try{
			// setting default value for operationType
			if(operationType==null){
				operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
			}
			
			// check if the query field is not null
			JSONParser parser = new JSONParser();
			JSONObject responseJSONObject = new JSONObject();
			Object obj = parser.parse(queryAndAssetDetails);
			JSONObject queryDetailsInJSON = (JSONObject) obj;
			IdentityService identityService = new IdentityService();
			AssetService assetService = new AssetService();
			User user = identityService.getUser(memberId, graphiti_tid);
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			if(user==null){
				throw new MemberNotFoundException("Member not found");
			}
			String queryString = (String) queryDetailsInJSON.get("query");
			String sqlAssetName = (String) queryDetailsInJSON.get("sqlAssetName");
			String dataAssetName = (String) queryDetailsInJSON.get("dataAssetName"); // This will be set if there is a custom name given by the user to give name for the data asset
			
			Object returnedDataFromConnector = getDataFromConnector(user.getOrganization(),graphiti_tid,connectionId, queryString);
			Object returnedData = returnedDataFromConnector==null ? null : (JSONArray) ((JSONObject) returnedDataFromConnector).get("data");
			if(returnedData!=null){
				if(operationType==InjestionOperationType.BOTH_SQL_AND_DATA || operationType==InjestionOperationType.ONLY_SQL){
						boolean injestSuccessStatus=false;
						JSONObject dataTypesInJSON = null;
						String tableNameInCache = null;
						if(operationType==InjestionOperationType.BOTH_SQL_AND_DATA){
							String databaseName = organization.getCacheDatabaseName();//(graphiti_tid,memberId);
							DataUtilController dataUtilController = new DataUtilController();
							// Get Data Types
							if(((JSONObject) returnedDataFromConnector).containsKey("dataTypes")){
								dataTypesInJSON = (JSONObject) ((JSONObject) returnedDataFromConnector).get("dataTypes");
							}
							else{
								dataTypesInJSON = (JSONObject) dataUtilController.getDataTypes(returnedData);
							}
							// logger.info("DataTypesInJson: {}", dataTypesInJSON);
							tableNameInCache = Utils.generateRandomString(6);
							Boolean createTableStatus = dataUtilController.createTableInCacheBasedOnDatatypes(graphiti_tid,databaseName,tableNameInCache, dataTypesInJSON,organization.getId());
							if(createTableStatus){
								// Once the table has been created 
								// We need to injest the data
								injestSuccessStatus = cacheRepository.injestDataIntoCache(graphiti_tid,databaseName, tableNameInCache, (JSONArray) returnedData, dataTypesInJSON,organization.getId());
							}
						}
						// This will only happen once injestion is true and operationType==InjestionOperationType.BOTH_SQL_AND_DATA
						if(injestSuccessStatus==true || operationType==InjestionOperationType.ONLY_SQL){
							// upload the query to S3
							InputStream inputStream = new ByteArrayInputStream(queryString.getBytes("UTF-8"));
							ObjectMetadata objectMetadata = new ObjectMetadata();
							// AWS-S3 warns to set the content-length
							// but not mandatory
							// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
							objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
							AmazonS3Repository s3Repository = new AmazonS3Repository();
							Properties properties = Constants.getInstance().properties;
							String sqlPathName = properties.getProperty("path-sql-s3");
							String objectKey = sqlPathName + "/" + Utils.generateRandomAlphaNumericString(10);
							String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream,
									objectMetadata);
							logger.info("graphiti-tid:{}. Query uploaded to S3. Generated link:{}", graphiti_tid, s3FileLink);
							if(operationType==InjestionOperationType.ONLY_SQL){ // If only SQL
								AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAssetName,AssetType.SQL,null,DataSourceType.APP,null,null,connectionId,user.getOrganization(), s3FileLink);
								JSONObject responseObject = assetService.addSQLDetailedAsset(graphiti_tid, memberId, assetDetailInformation,false);
								String sqlAssetId = (String) responseObject.get("sqlAssetId");
								responseJSONObject.put("sqlAssetId", sqlAssetId);
								// Here we have to make a call to get discoverability score
								int sqlAssetdiscoverabilityScore = ((Long) responseObject.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
								SearchService searchService = new SearchService();
								// in this case the asset content is the query
								searchService.addAssetForSearch(graphiti_tid, sqlAssetId, sqlAssetName, AssetType.SQL.getValue(),(String) queryDetailsInJSON.get("query"), memberId, user.getName(),user.getOrganization(),null, null,sqlAssetdiscoverabilityScore);
							}
							else if(operationType==InjestionOperationType.BOTH_SQL_AND_DATA){ // If both SQL and Data together
								// Make an entry into asset
								// REST call to Asset service
								ArrayList<String> listOfColumnNames = new ArrayList<String>(dataTypesInJSON.keySet());
								AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAssetName,AssetType.SQL,tableNameInCache,DataSourceType.APP,null,listOfColumnNames,connectionId,user.getOrganization(), s3FileLink);
								if(dataAssetName!=null && dataAssetName.length()>0){ 
									assetDetailInformation.setDataAssetName(dataAssetName);
								}
								else{
									String customDataAssetName = DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAssetName;
									assetDetailInformation.setDataAssetName(customDataAssetName);
								}
								JSONObject responseObject = assetService.addDetailedAsset(graphiti_tid, memberId, assetDetailInformation,false);
								String datasetAssetId = (String) responseObject.get("dataSetAssetId");
								String sqlAssetId = (String) responseObject.get("sqlAssetId");
								responseJSONObject.put("sqlAssetId", sqlAssetId);
								responseJSONObject.put("dataSetAssetId", datasetAssetId);
								// Here we have to make a call to get discoverability score
								int dataAssetdiscoverabilityScore = ((Long) responseObject.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
								int sqlAssetdiscoverabilityScore = ((Long) responseObject.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
								// This needs to be added for search
								SearchService searchService = new SearchService();
								String[] columnNamesInArray = new String[listOfColumnNames.size()];
								listOfColumnNames.toArray(columnNamesInArray);
								// search added for data asset
								if(dataAssetName!=null && dataAssetName.length()>0){
									searchService.addAssetForSearch(graphiti_tid, datasetAssetId, dataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
								}
								else{
									// Here we are setting default name for the DataAsset
									String customDataAssetName = DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAssetName;
									searchService.addAssetForSearch(graphiti_tid, datasetAssetId, customDataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
								}
								// in this case the asset content is the query
								searchService.addAssetForSearch(graphiti_tid, sqlAssetId, sqlAssetName, AssetType.SQL.getValue(),(String) queryDetailsInJSON.get("query"), memberId, user.getName(),user.getOrganization(),null, null,sqlAssetdiscoverabilityScore);
							}
	
						}
					}
					else{ 	// This is when its NO_SQL_NO_DATA
							// This is when injestSuccessStatus is set to false. 
						responseJSONObject.put("data", returnedData);
					}
					return new ResponseEntity<JSONObject>(responseJSONObject,HttpStatus.OK);
			}
			else{
				logger.info("graphiti-tid:{}.No data received from connector",graphiti_tid);
				return new ResponseEntity<Object>(null,HttpStatus.NO_CONTENT);
			}
		}
		catch(ParseException e){
			throw new JSONParseException("Unable to parse the query");
		}
		catch(DatabaseConnectionException e){
			throw e;
		} catch (UnsupportedEncodingException e) {
			logger.error("graphiti-tid:{}. Unsupported encoding exception.");
			return new ResponseEntity<String>("UTF-8 encoding is not supported.", HttpStatus.INTERNAL_SERVER_ERROR);
		} catch (IOException e) {
			logger.error("graphiti-tid:{}. Unable to determine InputStream content length.");
			return new ResponseEntity<Object>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
		finally{
			System.gc();
		}
	}
	
	@RequestMapping(value = "/ext/connection/{connectionId}/data", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> extgetData(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@PathVariable String connectionId, @RequestBody String queryAndAssetDetails) {
		return getData(memberId, graphiti_tid, orgId, operationType, connectionId, queryAndAssetDetails);
	}
	
	@RequestMapping(value = "/connection/{connectionId}/data", method = RequestMethod.PUT, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> updateData(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "assetId", required = true) String assetId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@PathVariable String connectionId, @RequestBody String queryAndAssetDetails) {
	try{
			if(operationType==null){ // If operationType is null then in that case assign a default operation of BOTH_SQL_AND_DATA
				operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
			}
			// First we have to get SQLAsset information
			// Get outflow AssetId for the SQLAsset
			IdentityService identityService = new IdentityService(); 
			Organization organization = identityService.getOrganization(graphiti_tid, orgId); //getOrganizationUsingMemberId(graphiti_tid, memberId);
			AssetService assetService = new AssetService();
			SQLAsset sqlAsset = assetService.getSQLAsset(graphiti_tid, memberId, assetId, organization.getId());
			if(operationType!=null && !operationType.equals(InjestionOperationType.NO_SQL_NO_DATA)){
				if(sqlAsset.getRelatedAssets().getOutflow()!=null && sqlAsset.getRelatedAssets().getOutflow().size()>0){
					// We have to first search here if there is a DataAssetId on the outflow or not
					// Search for a DataAsset for this SQL
					boolean isDataSetAssetThereInOutflow = false;
					for(int itertr = 0;itertr<sqlAsset.getRelatedAssets().getOutflow().size();itertr++){
						UserAssetsInfo userAssetsInfo = sqlAsset.getRelatedAssets().getOutflow().get(itertr);
						if(userAssetsInfo.getAssetType()==AssetType.DATASET){
							operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
							isDataSetAssetThereInOutflow = true;
							break; // The reason of having break here is because every SQL will have only 1 DataSet in output flow
						}
					}
					if (isDataSetAssetThereInOutflow == true && 
									(operationType.equals(InjestionOperationType.ONLY_SQL) || 
									operationType.equals(InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL))) {
						// In this case we overrride
						operationType = InjestionOperationType.BOTH_SQL_AND_DATA;
					}
				}
			}
			// check if the query field is not null
			JSONParser parser = new JSONParser();
			Object obj = parser.parse(queryAndAssetDetails);
			JSONObject queryDetailsInJSON = (JSONObject) obj;
			User user = identityService.getUser(memberId, graphiti_tid);
			if(user==null){
				throw new MemberNotFoundException("Member not found");
			}
			String queryString = (String) queryDetailsInJSON.get("query");
			// Removing this as name wont be updated from here
			//String dataAssetName = (String) queryDetailsInJSON.get("dataAssetName");
			Object returnedDataFromConnector = getDataFromConnector(user.getOrganization(),graphiti_tid,connectionId, queryString);
			Object returnedData = returnedDataFromConnector==null ? null : (JSONArray) ((JSONObject) returnedDataFromConnector).get("data");
			if(returnedData!=null){
				if(operationType == InjestionOperationType.BOTH_SQL_AND_DATA || operationType == InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL){
					String databaseName = organization.getCacheDatabaseName();//(graphiti_tid,memberId);
					DataUtilController dataUtilController = new DataUtilController();
					JSONObject dataTypesInJSON;
					// Get Data Types
					if(((JSONObject) returnedDataFromConnector).containsKey("dataTypes")){
						dataTypesInJSON = (JSONObject) ((JSONObject) returnedDataFromConnector).get("dataTypes");
					}
					else{
						dataTypesInJSON = (JSONObject) dataUtilController.getDataTypes(returnedData);
					}
					// The reason for having 0 is because there will be only 1 outflow for a SQlAsset
					String datasetAssetId =  null;//sqlAsset.getRelatedAssets().getOutflow().get(0).getId();
					String tableNameInCache = null;
					DataSet dataSetDetails = null;
					if(operationType == InjestionOperationType.BOTH_SQL_AND_DATA){
						// Search for the DataAsset for this SQL
						for(int itertr = 0;itertr<sqlAsset.getRelatedAssets().getOutflow().size();itertr++){
							UserAssetsInfo userAssetsInfo = sqlAsset.getRelatedAssets().getOutflow().get(itertr);
							if(userAssetsInfo.getAssetType()==AssetType.DATASET){
									datasetAssetId = userAssetsInfo.getId();
									break; // The reason of having break here is because every SQL will have only 1 DataSet in output flow
							}
						}
						dataSetDetails= assetService.getDataSetAssetDetails(graphiti_tid, memberId, datasetAssetId,organization.getId());
						tableNameInCache = dataSetDetails.getCacheTableName();
		        		boolean statusOfDeletionOfTable = cacheRepository.deleteDataSetFromCache(graphiti_tid, databaseName, dataSetDetails.getCacheTableName(),organization.getId());
		        		if(!statusOfDeletionOfTable){
		        			// TODO - throw Exception of failure to delete table
		        		}
					}
					else if(operationType == InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL){ // we have to create a new table in this case
						tableNameInCache = Utils.generateRandomString(6);
					}	
					Boolean createTableStatus = dataUtilController.createTableInCacheBasedOnDatatypes(graphiti_tid,databaseName,tableNameInCache, dataTypesInJSON,organization.getId());
	        		boolean injestSuccessStatus=false;
	        		if(createTableStatus) {
	        			// Once the table has been created 
	        			// We need to injest the data
	        			injestSuccessStatus = cacheRepository.injestDataIntoCache(graphiti_tid,databaseName, tableNameInCache, (JSONArray) returnedData, dataTypesInJSON,organization.getId());
	        		}
	        		if(injestSuccessStatus==true) {
	        			// upload the query to S3
	        			InputStream inputStream = new ByteArrayInputStream(queryString.getBytes("UTF-8"));
	        			ObjectMetadata objectMetadata = new ObjectMetadata();
	        			// AWS-S3 warns to set the content-length
	        			// but not mandatory
	        			// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
	        			objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
	        			AmazonS3Repository s3Repository = new AmazonS3Repository();
	        			Properties properties = Constants.getInstance().properties;
	        			String sqlPathName = properties.getProperty("path-sql-s3");
	        			String objectKey = sqlPathName+"/"+Utils.generateRandomAlphaNumericString(10);
	        			// In this case we should just update the version of the file
	        			// String s3ObjectKey = sqlPathName + "/" + sqlAsset.getLinkOfS3().substring(sqlAsset.getLinkOfS3().lastIndexOf("/")+1);
	        			String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream, objectMetadata);
	        			logger.info("graphiti-tid:{}. Query uploaded to S3 for assetId:{}. Generated link:{}", graphiti_tid, assetId, s3FileLink);
	        			// Make an entry into asset
	        			// REST call to Asset service
	        			ArrayList<String> listOfColumnNames = new ArrayList<String>(dataTypesInJSON.keySet());
	        			String[] columnNamesInArray = new String[listOfColumnNames.size()];
	        			listOfColumnNames.toArray(columnNamesInArray);
	        			
	        			// Only cache related changes and related assets are updated here. Minute field level changes like name changes are not done here
	        			AssetDetailedInformation sqlAssetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.SQL,null,DataSourceType.APP,null,null,connectionId,user.getOrganization(), s3FileLink);
	        			JSONObject  responseOfSQLAssetUpdate = assetService.updateAsset(graphiti_tid, memberId, orgId,assetId, sqlAssetDetailInformation, CACHE_UPDATE, DataSourceType.APP.getValue(),false);
	        			int discoverabilityScoreSQLAsset = ((Long) responseOfSQLAssetUpdate.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
						
	        			if(operationType == InjestionOperationType.BOTH_SQL_AND_DATA){
	        				AssetDetailedInformation dataSetAssetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.DATASET,tableNameInCache,DataSourceType.APP,null,listOfColumnNames,null,user.getOrganization(), null);
	        				JSONObject responseOfDataAssetUpdate = assetService.updateAsset(graphiti_tid, memberId, orgId,datasetAssetId, dataSetAssetDetailInformation, CACHE_UPDATE, DataSourceType.APP.getValue(),false);
	        				int discoverabilityScoreDataAsset = ((Long) responseOfDataAssetUpdate.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
	        				
	        				// Search service call for updating Asset for DataSet
		        			SearchService searchService = new SearchService();
		        			Asset solrAssetToUpdateForDataSetAsset = new Asset();
		        			StringBuffer commaSeparatedListOfFields = new StringBuffer();
		        			// If another user has updated the asset then in that case
		        			// the last modified by should be the person who updated it
		        			solrAssetToUpdateForDataSetAsset.setLastModifiedBy_id(memberId);
		        			solrAssetToUpdateForDataSetAsset.setLastModifiedBy_name(user.getName());
		        			solrAssetToUpdateForDataSetAsset.setAssetId(datasetAssetId);
		        			solrAssetToUpdateForDataSetAsset.setDataColumns(columnNamesInArray);
		        			solrAssetToUpdateForDataSetAsset.setOrgId(organization.getId());
		        			solrAssetToUpdateForDataSetAsset.setDiscoverabilityScore(discoverabilityScoreDataAsset);
		        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
		        			                          .append("assetId,").append("dataColumns,").append("discoverabilityScore,").append("orgId");
		        			searchService.updateAssetForSearch(graphiti_tid, memberId,datasetAssetId, solrAssetToUpdateForDataSetAsset,commaSeparatedListOfFields.toString());
		        			commaSeparatedListOfFields = null;
		        			// Search service call for updating Asset for SQLAsset
		        			// This needs to be added for search
		        			commaSeparatedListOfFields = new StringBuffer();
		        			Asset solrAssetToUpdateForSQLAsset = new Asset();
		        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_id(memberId);
		        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_name(user.getName());
		        			solrAssetToUpdateForSQLAsset.setAssetId(assetId);
		        			solrAssetToUpdateForSQLAsset.setAssetContent(queryString);
		        			solrAssetToUpdateForSQLAsset.setOrgId(organization.getId());
		        			solrAssetToUpdateForSQLAsset.setDiscoverabilityScore(discoverabilityScoreSQLAsset);
		        			solrAssetToUpdateForSQLAsset.setNumber_of_historical_versions(sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
		        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
	                        						  .append("assetId,").append("assetContent,").append("discoverabilityScore,").append("orgId,").append("discoverabilityScore,").append("number_of_historical_versions");
		        			searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, solrAssetToUpdateForSQLAsset,commaSeparatedListOfFields.toString());
		        		
	        			}
	        			else if(operationType == InjestionOperationType.ONLY_DATA_ATTACH_TO_SQL){
	        				// We have to create a new DataAsset 
	        				String dataAssetName = (String) queryDetailsInJSON.get("dataAssetName");
	        				AssetDetailedInformation assetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.DATASET,tableNameInCache,DataSourceType.APP,null,listOfColumnNames,connectionId,user.getOrganization(), null);
							if(dataAssetName!=null && dataAssetName.length()>0){ 
								assetDetailInformation.setDataAssetName(dataAssetName);
							}
							else{
								String customDataAssetName = DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAsset.getName();
								assetDetailInformation.setDataAssetName(customDataAssetName);
							}
							JSONObject responseObject = assetService.attachDetailedDataSetAsset(graphiti_tid, memberId, assetId,assetDetailInformation,false);
							
							datasetAssetId = (String) responseObject.get("dataSetAssetId");
							JSONObject responseJSONObject = new JSONObject();
							
							responseJSONObject.put("dataSetAssetId", datasetAssetId);
							// Here we have to make a call to get discoverability score
							int dataAssetdiscoverabilityScore = ((Long) responseObject.get("dataSetAssetId"+STRING_APPENDED_FOR_DS)).intValue();
							
							// This needs to be added for search
							SearchService searchService = new SearchService();
							columnNamesInArray = new String[listOfColumnNames.size()];
							listOfColumnNames.toArray(columnNamesInArray);
							// search added for data asset
							if(dataAssetName!=null && dataAssetName.length()>0){
								searchService.addAssetForSearch(graphiti_tid, datasetAssetId, dataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
							}
							else{
								// Here we are setting default name for the DataAsset
								String customDataAssetName = DEFAULT_PREFIX_FOR_DATASET_ASSET_NAME + sqlAsset.getName();
								searchService.addAssetForSearch(graphiti_tid, datasetAssetId, customDataAssetName, AssetType.DATASET.getValue(),null, memberId, user.getName(),user.getOrganization(),columnNamesInArray, null,dataAssetdiscoverabilityScore);
							}
							return new ResponseEntity<>(responseJSONObject,HttpStatus.CREATED);
	        			}
	        		}
				}
				else if(operationType == InjestionOperationType.ONLY_SQL){
					// upload the query to S3
        			InputStream inputStream = new ByteArrayInputStream(queryString.getBytes("UTF-8"));
        			ObjectMetadata objectMetadata = new ObjectMetadata();
        			// AWS-S3 warns to set the content-length
        			// but not mandatory
        			// objectMetadata.setContentLength(IOUtils.toByteArray(inputStream).length);
        			objectMetadata.setContentType(MediaType.TEXT_PLAIN_VALUE);
        			AmazonS3Repository s3Repository = new AmazonS3Repository();
        			Properties properties = Constants.getInstance().properties;
        			String sqlPathName = properties.getProperty("path-sql-s3");
        			String objectKey = sqlPathName+"/"+Utils.generateRandomAlphaNumericString(10);
        			// In this case we should just update the version of the file
        			// String s3ObjectKey = sqlPathName + "/" + sqlAsset.getLinkOfS3().substring(sqlAsset.getLinkOfS3().lastIndexOf("/")+1);
        			String s3FileLink = s3Repository.upload(organization.getS3BucketName(), objectKey, inputStream, objectMetadata);
        			logger.info("graphiti-tid:{}. Query uploaded to S3 for assetId:{}. Generated link:{}", graphiti_tid, assetId, s3FileLink);
        			
        			// Update SQLAsset here
        			AssetDetailedInformation sqlAssetDetailInformation = new AssetDetailedInformation(memberId,user.getName(),UserType.MEMBER,sqlAsset.getName(),AssetType.SQL,null,DataSourceType.APP,null,null,connectionId,user.getOrganization(), s3FileLink);
        			JSONObject  responseOfSQLAssetUpdate = assetService.updateAsset(graphiti_tid, memberId, orgId,assetId, sqlAssetDetailInformation, CACHE_UPDATE, DataSourceType.APP.getValue(),false);
        			int discoverabilityScoreSQLAsset = ((Long) responseOfSQLAssetUpdate.get("sqlAssetId"+STRING_APPENDED_FOR_DS)).intValue();
					
        			// Search update for SQLAsset
        			SearchService searchService = new SearchService();
        			StringBuffer commaSeparatedListOfFields = new StringBuffer();
        			Asset solrAssetToUpdateForSQLAsset = new Asset();
        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_id(memberId);
        			solrAssetToUpdateForSQLAsset.setLastModifiedBy_name(user.getName());
        			solrAssetToUpdateForSQLAsset.setAssetId(assetId);
        			solrAssetToUpdateForSQLAsset.setAssetContent(queryString);
        			solrAssetToUpdateForSQLAsset.setOrgId(organization.getId());
        			solrAssetToUpdateForSQLAsset.setDiscoverabilityScore(discoverabilityScoreSQLAsset);
        			solrAssetToUpdateForSQLAsset.setNumber_of_historical_versions(sqlAsset.getVersionNumber()==0 ? 1 : sqlAsset.getVersionNumber()+1);
        			commaSeparatedListOfFields.append("lastModifiedBy_id,").append("lastModifiedBy_name,")
                    						  .append("assetId,").append("assetContent,").append("discoverabilityScore,").append("orgId,").append("discoverabilityScore,").append("number_of_historical_versions");
        			searchService.updateAssetForSearch(graphiti_tid, memberId, assetId, solrAssetToUpdateForSQLAsset,commaSeparatedListOfFields.toString());
        			
				}
				return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
			}
			else{
				logger.info("graphiti-tid:{}.No data received from connector",graphiti_tid);
				return new ResponseEntity<Object>(null,HttpStatus.NO_CONTENT);
			}
		}
		catch(ParseException e){
			throw new JSONParseException("Unable to parse the query");
		}
		catch(DatabaseConnectionException e){
			throw e;
		} catch (UnsupportedEncodingException e) {
			logger.error("graphiti-tid:{}. Unsupported encoding exception.");
			return new ResponseEntity<String>("UTF-8 encoding is not supported.", HttpStatus.INTERNAL_SERVER_ERROR);
		} catch (IOException e) {
			logger.error("graphiti-tid:{}. Unable to determine InputStream content length.");
			return new ResponseEntity<Object>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
		finally{
			System.gc();
		}
	}
	
	@RequestMapping(value = "/ext/connection/{connectionId}/data", method = RequestMethod.PUT, consumes = "application/json", produces = "application/json")
	public ResponseEntity<?> extUpdateData(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "assetId", required = true) String assetId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestHeader(value = "operationType") InjestionOperationType operationType,
			@PathVariable String connectionId, @RequestBody String queryAndAssetDetails) {
		return updateData(memberId,assetId,graphiti_tid,orgId,operationType,connectionId,queryAndAssetDetails);
	}
	
	private ChartConfigurations convertEveryThingToLowerCase(ChartConfigurations chartConfigurations) throws IOException{
		ObjectMapper mapper = new ObjectMapper();
		mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,false);
		mapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES,false);
		mapper.configure(DeserializationFeature.FAIL_ON_IGNORED_PROPERTIES,false);
		mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true); 
		//mapper.configure(SerializationFeature.WRITE_SINGLE_ELEM_ARRAYS_UNWRAPPED
		String chartConfigs = mapper.writeValueAsString(chartConfigurations);
		chartConfigs = chartConfigs.toLowerCase();
		return (ChartConfigurations) mapper.readValue(chartConfigs,ChartConfigurations.class);
	}
	
	@RequestMapping(value="/pivotData",method=RequestMethod.POST,produces="application/json")
    public Object pivotData(
        @RequestParam(value = "table_name", required = false) String table_name,
        @RequestParam(value = "x_groupers", required = false) String x_groupers_string,
        @RequestParam(value = "y_groupers", required = false) String y_groupers_string,
        @RequestParam(value = "fragments", required = false) String fragments_string,
        @RequestParam(value = "size_metrics", required = false) String size_metrics_string,
        @RequestParam(value = "subject_metrics", required = false) String subject_metrics_string,
        @RequestParam(value = "color_metrics", required = false) String color_metrics_string,
        @RequestParam(value = "shape_groupers", required = false) String shape_groupers_string,
        @RequestParam(value = "color_groupers", required = false) String color_groupers_string,
        @RequestParam(value = "x_metrics", required = false) String x_metrics_string,
        @RequestParam(value = "y_metrics", required = false) String y_metrics_string,
        @RequestParam(value = "is_stacked", required = false) boolean is_stacked,
        @RequestParam(value = "orgId", required = false) String orgId,
        @RequestParam(value = "databaseName", required = false) String databaseName
        
    ) throws ParseException {
            // ===============================================================
            // code to convert String to array of objects (using JSON parsing)
            // ===============================================================
		    JSONParser jsonParser = new JSONParser();
		    JSONArray x_groupers = (JSONArray) jsonParser.parse(x_groupers_string);

		    String where_clause = " WHERE 1=1 ";
		    table_name = "(SELECT * FROM " + table_name + where_clause + ") " + table_name;
		    
            String x_grouper_py = "1";
            String x_groupers_csv = "1";

            for (int i = 0; i < x_groupers.size(); i++) {
                JSONObject x_grouper = (JSONObject) x_groupers.get(i); // Get the object
                String field_name = (String) x_grouper.get("field_name");

                if (i == 0) {
                    x_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    x_groupers_csv = field_name;
                } else {
                    x_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'','empty')";
                    x_groupers_csv += ", " + field_name;
                }
            }
            
            JSONArray y_groupers = (JSONArray) jsonParser.parse(y_groupers_string);

            String y_grouper_py = "1";
            String y_groupers_csv = "1";

            for (int i = 0; i < y_groupers.size(); i++) {
                JSONObject y_grouper = (JSONObject) y_groupers.get(i); // Get the object
                String field_name = (String) y_grouper.get("field_name");

                if (i == 0) {
                    y_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    y_groupers_csv = field_name;
                } else {
                    y_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'','empty')";
                    y_groupers_csv += ", " + field_name;
                }
            }

            String fragment_py = "1";
            String fragment_otherFields_py = "";
            String fragments_csv = "1";
            String first_fragment_field = "1";
            String second_fragment_field = "1";
            String fragments_pivotedData_csv = "1";
            String fragments_pivotedData_otherFields_csv = "";
            
            JSONArray fragments = (JSONArray) jsonParser.parse(fragments_string);

            for (int i = 0; i < fragments.size(); i++) {
                JSONObject fragment = (JSONObject) fragments.get(i); // Get the object
                String field_name = (String) fragment.get("field_name");
                
                if (i == 0) {
                    fragment_py = "COALESCE(" + field_name + " || '', 'empty')";
                    fragments_csv = field_name;
                    first_fragment_field = field_name;
                    fragments_pivotedData_csv = "pivotedData." + field_name;
                } else {
                    fragment_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                    fragments_csv += ", " + field_name;
                    fragments_pivotedData_csv += ", " + "pivotedData." + field_name;
                }

                if (i == 1) {
                    second_fragment_field = field_name;
                    fragment_otherFields_py = "COALESCE(" + field_name + " || '', 'empty')";
                    fragments_pivotedData_otherFields_csv = "pivotedData." + field_name;
                } else {
                    fragments_pivotedData_otherFields_csv += ", " + "pivotedData." + field_name;
                    fragment_otherFields_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                }
            }

            String color_grouper_py = "1";
            String color_groupers_csv = "1";
            
            JSONArray color_groupers = (JSONArray) jsonParser.parse(color_groupers_string);

            for (int i = 0; i < color_groupers.size(); i++) {
                JSONObject color_grouper = (JSONObject) color_groupers.get(i); // Get the object
                String field_name = (String) color_grouper.get("field_name");

                if (i == 0) {
                    color_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    color_groupers_csv = field_name;
                } else {
                    color_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                    color_groupers_csv += ", " + field_name;
                }
            }

            String size_metric_py = "1";
            String size_metrics_csv = "1";

            JSONArray size_metrics = (JSONArray) jsonParser.parse(size_metrics_string);

            for (int i = 0; i < size_metrics.size(); i++) {
                JSONObject size_metric = (JSONObject) size_metrics.get(i); // Get the object
                String field_name = (String) size_metric.get("field_name");

                if (i == 0) {
                    size_metric_py = "COALESCE('" + field_name + "' || '', 'empty')";
                    size_metrics_csv = field_name;
                } else {
                    size_metric_py += "||'$$$$'||COALESCE('" + field_name + "' || '', 'empty')";
                    size_metrics_csv += ", " + field_name;
                }
            } 

            String color_metric_py = "1";
            String color_metrics_csv = "1";
            
            JSONArray color_metrics = (JSONArray) jsonParser.parse(color_metrics_string);

            for (int i = 0; i < color_metrics.size(); i++) {
                JSONObject color_metric = (JSONObject) color_metrics.get(i); // Get the object
                String field_name = (String) color_metric.get("field_name");

                if (i == 0) {
                    color_metric_py = "COALESCE('" + field_name + "' || '', 'empty')";
                    color_metrics_csv = field_name;
                } else {
                    color_metric_py += "||'$$$$'||COALESCE('" + field_name + "' || '', 'empty')";
                    color_metrics_csv += ", " + field_name;
                }
            }

            String subject_metric_py = "1";
            String subject_metrics_csv = "1";
            
            JSONArray subject_metrics = (JSONArray) jsonParser.parse(subject_metrics_string);

            for (int i = 0; i < subject_metrics.size(); i++) {
                JSONObject subject_metric = (JSONObject) subject_metrics.get(i); // Get the object
                String field_name = (String) subject_metric.get("field_name");

                if (i == 0) {
                    subject_metric_py = "COALESCE('" + field_name + "' || '', 'empty')";
                    subject_metrics_csv = field_name;
                } else {
                    subject_metric_py += "||'$$$$'||COALESCE('" + field_name + "' || '', 'empty')";
                    subject_metrics_csv += ", " + field_name;
                }
            }

            String shape_grouper_py = "1";
            String shape_groupers_csv = "1";
            
            JSONArray shape_groupers = (JSONArray) jsonParser.parse(shape_groupers_string);

            for (int i = 0; i < shape_groupers.size(); i++) {
                JSONObject shape_grouper = (JSONObject) shape_groupers.get(i); // Get the object
                String field_name = (String) shape_grouper.get("field_name");

                if (i == 0) {
                    shape_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    shape_groupers_csv = field_name;
                } else {
                    shape_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                    shape_groupers_csv += ", " + field_name;
                }
            }

            //============================================================================
            // creating x_uqkeys
            //============================================================================
            JSONArray x_metrics = (JSONArray) jsonParser.parse(x_metrics_string);
            String x_uqkeys_sql = "";
            if (x_metrics.size() > 0) {
                for (int i = 0; i < x_metrics.size(); i++) {
                    JSONObject x_metric = (JSONObject) x_metrics.get(i); // Get the object
                    String x_metric_name = (String) x_metric.get("field_name");
                    String x_metric_scale_num = x_metric.get("scale_num")+"";

                    if (i == 0) {
                        x_uqkeys_sql += "";
                    } else {
                        x_uqkeys_sql += " UNION ALL ";
                    }

                    x_uqkeys_sql += "SELECT DISTINCT " +
                                                x_grouper_py + " || '~~~~' || '" + x_metric_name + "' as x_uqkey " +
                                        ", '" + x_metric_scale_num + "' as scale_num " +
                                        ", " + x_groupers_csv + 
                                    " FROM " + table_name +
                                    " ORDER BY " + x_groupers_csv;
                }
            } else {
                    x_uqkeys_sql += "SELECT DISTINCT " +
                                                    x_grouper_py + " || '~~~~' || '' as x_uqkey " +
                                                    ", '0'  as scale_num " +
                                                    ", " + x_groupers_csv +
                                    " FROM " + table_name +
                                    " ORDER BY " + x_groupers_csv;                                    
            }
            x_uqkeys_sql = "SELECT" +
                                "  x_uqkey as val" +
                                ", scale_num " +
                                ", ROW_NUMBER() OVER() || '' as index" +
                            " FROM (" + x_uqkeys_sql + ") x_uqkeys ";

            JSONArray x_uqkeys = (JSONArray) getDataFromCache(databaseName, x_uqkeys_sql, orgId);

            //============================================================================
            // creating y_uqkeys
            //============================================================================
            JSONArray y_metrics = (JSONArray) jsonParser.parse(y_metrics_string);
            String y_uqkeys_sql = "";
            if (y_metrics.size() > 0) {
                for (int i = 0; i < y_metrics.size(); i++) {
                    JSONObject y_metric = (JSONObject) y_metrics.get(i); // Get the object
                    String y_metric_name = (String) y_metric.get("field_name");
                    String y_metric_scale_num =  y_metric.get("scale_num")+"";

                    if (i == 0) {
                        y_uqkeys_sql += "";
                    } else {
                        y_uqkeys_sql += " UNION ALL ";
                    }

                    y_uqkeys_sql += "SELECT DISTINCT " +
                                                y_grouper_py + " || '~~~~' || '" + y_metric_name + "' as y_uqkey " +
                                        ", '" + y_metric_scale_num + "' as scale_num " +
                                        ", " + y_groupers_csv + 
                                    " FROM " + table_name +
                                    " ORDER BY " + y_groupers_csv;
                }
            } else {
                    y_uqkeys_sql += "SELECT DISTINCT " +
                                                    y_grouper_py + " || '~~~~' || '' as y_uqkey " +
                                                    ", '0'  as scale_num " +
                                                    ", " + y_groupers_csv +
                                    " FROM " + table_name +
                                    " ORDER BY " + y_groupers_csv;                                    
            }
            y_uqkeys_sql = "SELECT" +
                                "  y_uqkey as val" +
                                ", scale_num " +
                                ", ROW_NUMBER() OVER() || '' as index" +
                            " FROM (" + y_uqkeys_sql + ") y_uqkeys ";

            JSONArray y_uqkeys = (JSONArray) getDataFromCache(databaseName, y_uqkeys_sql, orgId);

            //============================================================================
            // creating fragment_uqkeys
            //============================================================================
            String fragment_uqkeys_sql =  "SELECT " +
            							  			"  fragments.*" +
            							  			", DENSE_RANK() OVER(PARTITION BY NULL ORDER BY val ASC) as dense_index " +
            							  "FROM (" +
		            							  "SELECT DISTINCT " + 
		                                                   fragment_py + " as val " +
		                                                ", DENSE_RANK() OVER(PARTITION BY NULL ORDER BY " + first_fragment_field + " ASC) as index " +
		                                                ", " + fragments_csv +
		                                         " FROM " + table_name  +
		                                         " ORDER BY " + fragments_csv +
                                         ") fragments";

            JSONArray fragment_uqkeys = (JSONArray) getDataFromCache(databaseName, fragment_uqkeys_sql, orgId);

            //============================================================================
            // creating first_fragment_uqkeys
            //============================================================================            
            String first_fragment_uqkeys_sql = " SELECT DISTINCT " +
                                                               first_fragment_field + " as val " +
                                                            ", DENSE_RANK() OVER(PARTITION BY NULL ORDER BY " + first_fragment_field + " ASC) as index " +
                                                " FROM " + table_name +
                                                " ORDER BY " + first_fragment_field;

            JSONArray first_fragment_uqkeys = (JSONArray) getDataFromCache(databaseName, first_fragment_uqkeys_sql, orgId);

            //============================================================================
            // creating color_uqkeys
            //============================================================================                        
            String color_uqkeys_sql = "SELECT DISTINCT " +
                                                           color_grouper_py + " as val " +
                                                    ", " + color_groupers_csv + 
                                        " FROM " + table_name +
                                        " ORDER BY " + color_groupers_csv;
            
            JSONArray color_uqkeys = (JSONArray) getDataFromCache(databaseName, color_uqkeys_sql, orgId);

            //============================================================================
            // creating pivotedData
            //============================================================================                                    
            String pivotedData_sql = "";
            String pivotedData_outer_sql = "";

            String size_metric_name = "0";
            String size_metric_agg = "SUM";
            String color_metric_name = "0";
            String color_metric_agg = "SUM";
            String subject_metric_name = "0";
            String subject_metric_agg = "SUM";
            if (size_metrics.size() > 0) {
                JSONObject first_size_metric = (JSONObject) size_metrics.get(0); // Get first object
                size_metric_name = (String) first_size_metric.get("field_name");
                size_metric_agg = (String) first_size_metric.get("field_aggregation");
            }
            if (color_metrics.size() > 0) {
                JSONObject first_color_metric = (JSONObject) color_metrics.get(0); // Get first object
                color_metric_name = (String) first_color_metric.get("field_name");
                color_metric_agg = (String) first_color_metric.get("field_aggregation");
            }
            if (subject_metrics.size() > 0) {
                JSONObject first_subject_metric = (JSONObject) subject_metrics.get(0); // Get first object
                subject_metric_name = (String) first_subject_metric.get("field_name");
                subject_metric_agg = (String) first_subject_metric.get("field_aggregation");
            }

            String str1 = "SELECT " +
                                       x_grouper_py + " as x_grouper " +
                                ", " + y_grouper_py + " as y_grouper ";
            
            String str2 = "";

            String str3 =       ", " + fragment_py + " as fragment_uqkey " +
                                ", " + color_grouper_py + " as color_uqkey " +
                                ", " + size_metric_py + " as size_metric " +
                                ", " + color_metric_py + " as color_metric " +
                                ", " + subject_metric_py + " as subject_metric " +
                                ", " + shape_grouper_py + " as shape_uqkey ";
            
            String str4 = "";

            String str5 =       ", COALESCE(" + size_metric_agg + "(" + size_metric_name + "), 0) as size_metric_val " +
                                ", COALESCE(" + color_metric_agg + "(" + color_metric_name + "), 0) as color_metric_val " +
                                ", COALESCE(" + subject_metric_agg + "(" + subject_metric_name + "), 0) as subject_metric_val ";

            String str6 =       ", " + fragments_csv + 
                            " FROM " + table_name +
                            " GROUP BY " +
                                       x_groupers_csv +
                                ", " + y_groupers_csv +
                                ", color_uqkey"  +
                                ", " + fragments_csv;

            
            String outer_str1 =  " SELECT " +
                                        "  pivotedData.x_grouper " +
                                        ", pivotedData.y_grouper ";
            
            String outer_str2 = ""; //fragments....

            String outer_str3 = ""; //x_metric, y_metric

            String outer_str4 =         ", pivotedData.x_uqkey " +
                                        ", pivotedData.y_uqkey " +
                                        ", pivotedData.fragment_uqkey " +
                                        ", pivotedData.color_uqkey " +
                                        ", pivotedData.size_metric " +
                                        ", pivotedData.color_metric " +
                                        ", pivotedData.subject_metric " +
                                        ", pivotedData.shape_uqkey";
            
            String outer_str5 = ""; //x_intercept, y_intercept, x_metric_val, y_metric_val

            String outer_str6 =         ", pivotedData.size_metric_val || '' as size_metric_val" + 
                                        ", pivotedData.color_metric_val || '' as color_metric_val" + 
                                        ", pivotedData.subject_metric_val || '' as subject_metric_val";            
            
            String outer_str7 = ""; //x_scale_num, y_scale_num

            String outer_str8 =         ", x_uqkeys.index as x_uqkey_index" + 
                                        ", y_uqkeys.index as y_uqkey_index" + 
                                        ", fragment_uqkeys.index as fragment_uqkey_index" +
                                        ", fragment_uqkeys.dense_index as fragment_uqkey_dense_index" +
                                        ", MAX(fragment_uqkeys.index) OVER() as fragment_uqkey_maxindex " +
                                        ", MAX(fragment_uqkeys.dense_index) OVER() as fragment_uqkey_maxdenseindex ";

            String outer_str9 = " LEFT OUTER JOIN (" + x_uqkeys_sql + " ) x_uqkeys ON x_uqkeys.val = pivotedData.x_uqkey " +
                                " LEFT OUTER JOIN (" + y_uqkeys_sql + " ) y_uqkeys ON y_uqkeys.val = pivotedData.y_uqkey " +
                                " LEFT OUTER JOIN (" + fragment_uqkeys_sql + " ) fragment_uqkeys ON fragment_uqkeys.val = pivotedData.fragment_uqkey " +
                                " ORDER BY " + fragments_pivotedData_csv;

            if (x_metrics.size() > 0 && y_metrics.size() > 0) {                

                for (int x = 0; x < x_metrics.size(); x++) {
                    JSONObject x_metric = (JSONObject) x_metrics.get(x); // Get the object
                    String x_metric_name = (String) x_metric.get("field_name");
                    String x_metric_agg = (String) x_metric.get("field_aggregation");

                    for (int y = 0; y < y_metrics.size(); y++) {
                        JSONObject y_metric = (JSONObject) y_metrics.get(y); // Get the object
                        String y_metric_name = (String) y_metric.get("field_name");
                        String y_metric_agg = (String) y_metric.get("field_aggregation");

                        if (x == 0 && y == 0) {
                            pivotedData_sql += "";
                        } else {
                            pivotedData_sql += " UNION ALL ";
                        }

                        str2 = ", '" + x_metric_name + "' as x_metric " +
                               ", '" + y_metric_name + "' as y_metric " +
                               ", " + x_grouper_py + " || '~~~~' || '" + x_metric_name + "' as x_uqkey " +
                               ", " + y_grouper_py + " || '~~~~' || '" + y_metric_name + "' as y_uqkey ";

                        str4 = ", COALESCE(" + x_metric_agg + "(" + x_metric_name + "), 0) as x_metric_val " +
                               ", COALESCE(" + y_metric_agg + "(" + y_metric_name + "), 0) as y_metric_val ";

                        pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;
                    
                    }
                }

                outer_str2 = "";

                outer_str3 = ", pivotedData.x_metric " +
                             ", pivotedData.y_metric ";

                outer_str5 = ", pivotedData.x_metric_val || '' as x_intercept" + 
                             ", pivotedData.y_metric_val || '' as y_intercept" +
                             ", pivotedData.x_metric_val || '' as x_metric_val" + 
                             ", pivotedData.y_metric_val || '' as y_metric_val";

                outer_str7 = ", x_uqkeys.scale_num as x_uqkey_scale_num" + 
                             ", y_uqkeys.scale_num as y_uqkey_scale_num";

            } else if (x_metrics.size() == 0 && y_metrics.size() > 0) {
                for (int y = 0; y < y_metrics.size(); y++) {
                    JSONObject y_metric = (JSONObject) y_metrics.get(y); // Get the object
                    String y_metric_name = (String) y_metric.get("field_name");
                    String y_metric_agg = (String) y_metric.get("field_aggregation");

                    if (y == 0) {
                        pivotedData_sql += "";
                    } else {
                        pivotedData_sql += " UNION ALL ";
                    }

                    str2 = ", '" + y_metric_name + "' as y_metric " +
                    		", " + x_grouper_py + " || '~~~~' || '' as x_uqkey " +
                            ", " + y_grouper_py + " || '~~~~' || '" + y_metric_name + "' as y_uqkey ";

                    str4 = ", COALESCE(" + y_metric_agg + "(" + y_metric_name + "), 0) as y_metric_val ";

                    pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;
                }

                String y_intercept = "";
                if (is_stacked == true && fragments.size() > 1) {
                    y_intercept = " SUM(pivotedData.y_metric_val) OVER(PARTITION BY ";
                    if (fragments.size() > 1) {
                        y_intercept += "pivotedData.x_grouper, pivotedData.y_grouper, pivotedData." + 
                                        first_fragment_field 
                                        + " ORDER BY " + fragments_pivotedData_otherFields_csv;
                    } else {
                        y_intercept += "1 ORDER BY NULL";
                    }
                    y_intercept += " ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) || '' as y_intercept ";
                } else {
                    y_intercept = " pivotedData.y_metric_val || '' as y_intercept";
                }
                
                outer_str2 = ", " + fragments_pivotedData_csv;

                outer_str3 = ", pivotedData.y_metric ";

                outer_str5 = ", " + y_intercept + 
                        	 ", pivotedData.y_metric_val || '' as y_metric_val";

                outer_str7 = ", 0 as x_uqkey_scale_num" + 
                             ", y_uqkeys.scale_num as y_uqkey_scale_num";                
                         
            } else if (x_metrics.size() > 0 && y_metrics.size() == 0) {
                for (int x = 0; x < x_metrics.size(); x++) {
                    JSONObject x_metric = (JSONObject) x_metrics.get(x); // Get the object
                    String x_metric_name = (String) x_metric.get("field_name");
                    String x_metric_agg = (String) x_metric.get("field_aggregation");

                    if (x == 0) {
                        pivotedData_sql += "";
                    } else {
                        pivotedData_sql += " UNION ALL ";
                    }

                    str2 = ", '" + x_metric_name + "' as x_metric " + 
                    		", " + x_grouper_py + " || '~~~~' || '" + x_metric_name + "' as x_uqkey " +
                            ", " + y_grouper_py + " || '~~~~' || '' as y_uqkey ";

                    str4 = ", COALESCE(" + x_metric_agg + "(" + x_metric_name + "), 0) as x_metric_val ";

                    pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;
                }

                String x_intercept = "";
                if (is_stacked == true && fragments.size() > 1) {
                    x_intercept = " SUM(pivotedData.x_metric_val) OVER(PARTITION BY ";
                    if (fragments.size() > 1) {
                        x_intercept += "pivotedData.x_grouper, pivotedData.y_grouper, pivotedData." + 
                                        first_fragment_field 
                                        + " ORDER BY " + fragments_pivotedData_otherFields_csv;
                    } else {
                        x_intercept += "1 ORDER BY NULL";
                    }
                    x_intercept += " ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) || '' as x_intercept ";
                } else {
                    x_intercept = " pivotedData.x_metric_val || '' as x_intercept";
                }
                
                outer_str2 = ", " + fragments_pivotedData_csv;

                outer_str3 = ", pivotedData.x_metric ";

                outer_str5 = ", " + x_intercept + 
                			 ", pivotedData.x_metric_val || '' as x_metric_val";

                outer_str7 = ", x_uqkeys.scale_num as x_uqkey_scale_num" + 
                             ", 0 as y_uqkey_scale_num";                  


            } else if (x_metrics.size() == 0 && y_metrics.size() == 0) {
                str2 = ", " + x_grouper_py + " || '~~~~' || '' as x_uqkey " +
                        ", " + y_grouper_py + " || '~~~~' || '' as y_uqkey ";

                str4 = "";

                pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;

                outer_str2 = ", " + fragments_pivotedData_csv;

                outer_str3 = "";

                outer_str5 = "";

                outer_str7 = ", 0 as x_uqkey_scale_num" + 
                             ", 0 as y_uqkey_scale_num";                  


            }

            pivotedData_outer_sql = outer_str1 + 
                                    outer_str2 +
                                    outer_str3 +
                                    outer_str4 +
                                    outer_str5 +
                                    outer_str6 +
                                    outer_str7 +
                                    outer_str8 + 
                                    " FROM (" +
                                        pivotedData_sql + 
                                    " ) pivotedData " +
                                    outer_str9;

            logger.info("pivotedData_outer_sql: {}", pivotedData_outer_sql);
            JSONArray pivotedData = (JSONArray) getDataFromCache(databaseName, pivotedData_outer_sql, orgId);

//            JSONObject vizData = {
//                                "data": pivotedData,
//                                "x_uqkeys": x_uqkeys,
//                                "y_uqkeys": y_uqkeys,
//                                "fragment_uqkeys": fragment_uqkeys,
//                                "first_fragment_uqkeys": first_fragment_uqkeys,
//                                "color_uqkeys": color_uqkeys
//                             };
            JSONObject vizData = new JSONObject();
            vizData.put("data", pivotedData);
            vizData.put("x_uqkeys", x_uqkeys);
            vizData.put("y_uqkeys",y_uqkeys);
            vizData.put("fragment_uqkeys", fragment_uqkeys);
            vizData.put("first_fragment_uqkeys", first_fragment_uqkeys);
            vizData.put("color_uqkeys", color_uqkeys);
            
            return vizData.toString();
    }
	/// TODO - Remove this from here
	@RequestMapping(value="/data/{databaseName}/{dataSourceName}",method = RequestMethod.POST,consumes = "application/json", produces = "application/json")
	public ResponseEntity<Object> getData(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@PathVariable String databaseName,
			@PathVariable String dataSourceName,
			@RequestBody ChartConfigurations chartConfigurations)
			throws ParseException, IOException {
		// We have to serialize and deserialize the JSONString so as to make it lower case
		chartConfigurations = convertEveryThingToLowerCase(chartConfigurations); 
			
		// Things to be processed irrespective of the chart
		String query = chartConfigurations.getQuery()!=null?chartConfigurations.getQuery():new DataUtilController().generateQuery(chartConfigurations,dataSourceName);
		JSONArray data = (JSONArray) getDataFromCache(databaseName,query,orgId); // TODO - This has to be replaced by getData() api call
		int from;
		int to;
		if(chartConfigurations.getFrom()!=null && chartConfigurations.getTo()!=null){
			from = chartConfigurations.getFrom();
			// if requested number is greater then restrict it to data size
			to = (chartConfigurations.getTo() > data.size()) ? data.size():chartConfigurations.getTo();
		}
		else if(chartConfigurations.getFrom()==null && chartConfigurations.getTo()==null){ // If both are null
			from = 0;
			to = (Integer.parseInt(env.getProperty("max-number-rows")) > data.size()) ? data.size() : Integer.parseInt(env.getProperty("max-number-rows"));
		}
		else if(chartConfigurations.getFrom()!=null && chartConfigurations.getTo()==null){ // from is not null and to is null
			// TODO - Check chartConfigurations.getFrom() is less than data size
			from = chartConfigurations.getFrom();
			to = from + Math.min((from+Integer.parseInt(env.getProperty("max-number-rows"))),data.size());
			
		}
		else{ // when both are not null
			  // TODO -  Check both from and to are less than data size
			  // TODO - Check the difference between from and to is less than acceptable size in environment
			  from = chartConfigurations.getFrom();
			  to = Math.min((from+Integer.parseInt(env.getProperty("max-number-rows"))),Math.min(chartConfigurations.getTo(),data.size()));
		}
		JSONObject returningJSONObject = null;
		/////// Bar Chart Code Starts ///////
		if(chartConfigurations.getTypeOfChart().equalsIgnoreCase("BAR")){
			Map<String,JSONObject> mapCombinedKeyAndJSONObject = new LinkedHashMap<String,JSONObject>();
			ArrayList<String> patternOfKeysToBeMerged = new ArrayList<String>();
			Set<String> dimentionEncodingToBeConsidered;
			Set<String> metricsEncodingToBeConsidered;
			// This part will be only executed if there are dimentions in color encodings
			Set<String> uniqueColorEncodingsCombinations = new TreeSet<String>();
						
			// If there is metrics in YEncoding then its assumed that dimentions are in XEncoding
			if(chartConfigurations.getYaxisVencoding().getMetrics().size()>0){
				metricsEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigurations.getYaxisVencoding().getMetrics());
				dimentionEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigurations.getXaxisVencoding().getDimensions());
			}
			else{
				metricsEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigurations.getXaxisVencoding().getMetrics());
				dimentionEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigurations.getYaxisVencoding().getDimensions());
			}
			// Converting to arrayList so that it can be accessed via index
			ArrayList<String> dimentionEncodingToBeConsideredInAL = new ArrayList<String>(dimentionEncodingToBeConsidered);
			ArrayList<String> metricsEncodingToBeConsideredInAL = new ArrayList<String>(metricsEncodingToBeConsidered);	
			// Things to be processed irrespective of the chart
			long startTime = System.currentTimeMillis();
			System.out.println("Getting records from:"+from+"to:"+to);
			// We have to do the processing of data here for BAR chart
			for(int i=from;i<to;i++){
				JSONObject obj = (JSONObject) data.get(i);// Get the object
				String[] arrOfValues = new String[dimentionEncodingToBeConsideredInAL.size()];
				// Go over the XAxisDimentions so as to create a combinedKey
				for(int j=0;j<dimentionEncodingToBeConsideredInAL.size();j++){
					arrOfValues[j] = (String) obj.get(dimentionEncodingToBeConsideredInAL.get(j));
				}
				obj.put("combinedKey",getCombinedStringFromArrayValues(arrOfValues,"$$$$"));
				arrOfValues = null; // GC
				// If there is no colorEncoding or detailEncoding
				if(chartConfigurations.getColorEncoding().getDimensions().size()==0 && chartConfigurations.getDetailEncoding().getDimensions().size()==0){
					for(int j=0;j<metricsEncodingToBeConsideredInAL.size();j++){
						obj.put(((String) obj.get("combinedKey")) + "___" + j,
								obj.get(metricsEncodingToBeConsideredInAL.get(j))); // Need to fix this
						//obj.put(((String) obj.get("combinedKey"))+"___"+j,obj.get(metricsEncodingToBeConsideredInAL.get(j).replace("(", "__").replace(")","__"))); // Need to fix this
					}
				}
				// Only when there is color_encoding
				if(chartConfigurations.getColorEncoding().getDimensions().size()>0){
					patternOfKeysToBeMerged.add("___colorEncodings");
					arrOfValues = new String[chartConfigurations.getColorEncoding().getDimensions().size()];
					// Lets do the calculatations when there are color encodings involved.
					for(int j=0;j<chartConfigurations.getColorEncoding().getDimensions().size();j++){
						arrOfValues[j] = (String) obj.get(chartConfigurations.getColorEncoding().getDimensions().get(j));
					}
					for(int j=0;j<metricsEncodingToBeConsideredInAL.size();j++){
						if(chartConfigurations.getDetailEncoding().getDimensions().size()==0){
//							obj.put(getCombinedStringFromArrayValues(arrOfValues, "$$$$")+ "___"+ j+ "___colorEncodings", obj
//									.get(metricsEncodingToBeConsideredInAL.get(j).replace("(", "__").replace(")", "__")));
							obj.put(getCombinedStringFromArrayValues(arrOfValues, "$$$$")+ "___"+ j+ "___colorEncodings", obj
									.get(metricsEncodingToBeConsideredInAL.get(j)));
							uniqueColorEncodingsCombinations.add(getCombinedStringFromArrayValues(arrOfValues,"$$$$")+"___"+j+"___colorEncodings");
						}
						else{
							arrOfValues = new String[chartConfigurations.getDetailEncoding().getDimensions().size()];
							for(int k=0;k<chartConfigurations.getDetailEncoding().getDimensions().size();k++){
								arrOfValues[k] = (String) obj.get(chartConfigurations.getDetailEncoding().getDimensions().get(k));
							}
							String detailEncodingCombination = getCombinedStringFromArrayValues(arrOfValues,"$$$$");
							arrOfValues = new String[chartConfigurations.getColorEncoding().getDimensions().size()];
							for(int k=0;k<chartConfigurations.getColorEncoding().getDimensions().size();k++){
								arrOfValues[k] = (String) obj.get(chartConfigurations.getColorEncoding().getDimensions().get(k));
							}
							String colorEncodingCombination = getCombinedStringFromArrayValues(arrOfValues,"$$$$");
							// detailEncodingCombination and colorEncodingCombincation are separated by ^^^^^
//							obj.put(colorEncodingCombination + "___" + j+ "___colorEncodings^^^^^"+ detailEncodingCombination+ "___detailEncodings",
//									obj.get(metricsEncodingToBeConsideredInAL.get(j).replace("(", "__").replace(")", "__")));
							obj.put(colorEncodingCombination + "___" + j+ "___colorEncodings^^^^^"+ detailEncodingCombination+ "___detailEncodings",
									obj.get(metricsEncodingToBeConsideredInAL.get(j)));
							uniqueColorEncodingsCombinations.add(colorEncodingCombination+"___"+j+"___colorEncodings^^^^^"+detailEncodingCombination+"___detailEncodings");
						}
					}
				}
				//only if there is detailEncoding and no colorEncoding
				else if(chartConfigurations.getDetailEncoding().getDimensions().size()>0){
					patternOfKeysToBeMerged.add("___detailEncodings");
					arrOfValues = new String[chartConfigurations.getDetailEncoding().getDimensions().size()];
					for(int k=0;k<chartConfigurations.getDetailEncoding().getDimensions().size();k++){
						arrOfValues[k] = (String) obj.get(chartConfigurations.getDetailEncoding().getDimensions().get(k));
					}
					for(int j=0;j<metricsEncodingToBeConsideredInAL.size();j++){
//						obj.put(getCombinedStringFromArrayValues(arrOfValues,"$$$$") + "___" + j + "___detailEncodings",
//								obj.get(metricsEncodingToBeConsideredInAL.get(j).replace("(", "__").replace(")", "__")));
						obj.put(getCombinedStringFromArrayValues(arrOfValues,"$$$$") + "___" + j + "___detailEncodings",
								obj.get(metricsEncodingToBeConsideredInAL.get(j)));
						uniqueColorEncodingsCombinations.add(getCombinedStringFromArrayValues(arrOfValues,"$$$$")+"___"+j+"___detailEncodings");
					}
				}
				// Check if the Map contains a entry for the combinedKey
				if(mapCombinedKeyAndJSONObject.containsKey(obj.get("combinedKey"))){
					JSONObject deepCopyOfJSONObject = mapCombinedKeyAndJSONObject.get(obj.get("combinedKey"));
					JSONObject jsonObjectAfterMerging = mergeJSONObjectsBasedOnPatternOfKeysAndPopulateUniqueColorEncodingCombinations(deepCopyOfJSONObject,obj,patternOfKeysToBeMerged,uniqueColorEncodingsCombinations);
					mapCombinedKeyAndJSONObject.put((String)jsonObjectAfterMerging.get("combinedKey"),jsonObjectAfterMerging);
				}
				else{
					JSONObject deepCopyOfJSONObject = getCloneObject(obj);
					mapCombinedKeyAndJSONObject.put((String) obj.get("combinedKey"),deepCopyOfJSONObject);
				}
			}
			if(uniqueColorEncodingsCombinations.size()==0 && chartConfigurations.getColorEncoding().getDimensions().size()==0 &&  chartConfigurations.getDetailEncoding().getDimensions().size()==0){
				uniqueColorEncodingsCombinations.add("combinedKey");
			}
			long endTime = System.currentTimeMillis();
			System.out.println("Total Time in mins" + ((endTime-startTime)/1000*60));
			System.out.println("Total Time in secs" + ((endTime-startTime)/1000));
			returningJSONObject = new JSONObject();
			returningJSONObject.put("data", mapCombinedKeyAndJSONObject.values());
			returningJSONObject.put("combinationsSet",uniqueColorEncodingsCombinations);
		}
		/////// Bar Chart Code Ends ///////
		else if(chartConfigurations.getTypeOfChart().equalsIgnoreCase("SCATTER")){
			// It doesnt make sense to have a from and to for scatter plot
			from = 0;
			to = data.size();
			Set<String> uniqueValuesInXAxis = new TreeSet<String>();
			Set<String> uniqueValuesInYAxis = new TreeSet<String>();
			Map<String, Integer> minMap = new HashMap<String,Integer>(chartConfigurations.getXaxisVencoding().getDimensions().size()+chartConfigurations.getYaxisVencoding().getDimensions().size());
			Map<String,Integer> maxMap = new HashMap<String,Integer>(chartConfigurations.getXaxisVencoding().getDimensions().size()+chartConfigurations.getYaxisVencoding().getDimensions().size());
			Set<String> uniqueColorEncodings = null;
			if(chartConfigurations.getColorEncoding()!=null && chartConfigurations.getColorEncoding().getDimensions().size()>0){
				uniqueColorEncodings = new HashSet<String>();
			}
			for(int i=from;i<to;i++){
				JSONObject obj = (JSONObject) data.get(i);// Get the object
				String[] arrOfValues_X = new String[chartConfigurations.getXaxisVencoding().getDimensions().size()];
				for(int j=0;j<chartConfigurations.getXaxisVencoding().getDimensions().size();j++){
					arrOfValues_X[j] = (String) obj.get((String)chartConfigurations.getXaxisVencoding().getDimensions().get(j));
				}
				String[] arrOfValues_Y = new String[chartConfigurations.getYaxisVencoding().getDimensions().size()];
				for(int j=0;j<chartConfigurations.getYaxisVencoding().getDimensions().size();j++){
					arrOfValues_Y[j] = (String) obj.get((String)chartConfigurations.getYaxisVencoding().getDimensions().get(j));
				}
				obj.put("combinedKey",getCombinedStringFromArrayValues(arrOfValues_X,"$$$$")+"^^^^^"+getCombinedStringFromArrayValues(arrOfValues_Y,"$$$$"));
				if(getCombinedStringFromArrayValues(arrOfValues_X,"$$$$").length()>0){
					uniqueValuesInXAxis.add(getCombinedStringFromArrayValues(arrOfValues_X,"$$$$"));
				}
				if(getCombinedStringFromArrayValues(arrOfValues_Y,"$$$$").length()>0){
					uniqueValuesInYAxis.add(getCombinedStringFromArrayValues(arrOfValues_Y,"$$$$"));
				}
				if(uniqueColorEncodings!=null){
					if(obj.get(chartConfigurations.getColorEncoding().getDimensions().get(0))!=null){
						uniqueColorEncodings.add((String)obj.get(chartConfigurations.getColorEncoding().getDimensions().get(0)));
					}
				}
			}
			returningJSONObject = new JSONObject();
			returningJSONObject.put("uniqueValuesInXAxis", uniqueValuesInXAxis);
			returningJSONObject.put("uniqueValuesInYAxis", uniqueValuesInYAxis);
			returningJSONObject.put("data", data);
			if(uniqueColorEncodings!=null && uniqueColorEncodings.size()>0){
				returningJSONObject.put("uniqueColorEncodings",uniqueColorEncodings);
			}
		}
		return new ResponseEntity<Object>(returningJSONObject,HttpStatus.OK);
	}	
	
	
	private JSONObject mergeJSONObjectsBasedOnPatternOfKeysAndPopulateUniqueColorEncodingCombinations(JSONObject source,JSONObject objectToBeMerged,ArrayList<String> patternOfKeysToBeMerged,Set<String> uniqueColorEncodingsCombinations){
		// Get the keys that match the specific pattern
		Set<String> keysThatMatchAPattern = new HashSet<String>();
		for(int j=0;j<patternOfKeysToBeMerged.size();j++){
			Pattern pattern = Pattern.compile(patternOfKeysToBeMerged.get(j));
			Iterator<String> iteratorOfKeys = objectToBeMerged.keySet().iterator();
			while(iteratorOfKeys.hasNext()){
					String key = iteratorOfKeys.next();
					// Check if the key has a pattern
					if(pattern.matcher(key).find()){
						if(source.containsKey(key)){
							// I dont think any code will be here.
						}
						else{
							source.put(key, objectToBeMerged.get(key));
						}
					}
			}
		}
		return source;
	}
	
	// Serialize and deserialize
	// for deep copy purpose
	// Since its a not that a complicated JSONObject, kept the cloning simple
	private static JSONObject getCloneObject(JSONObject object) throws ParseException{
		String jsonString = object.toString();
		return (JSONObject) (new JSONParser().parse(jsonString));
	}
	
	private String getCombinedStringFromArrayValues(String[] arrayOfValues,String dilimiter){
		StringBuffer stringBuffer = new StringBuffer();
		for(int i=0;i<arrayOfValues.length;i++){
			if(i!=arrayOfValues.length-1){
				stringBuffer.append(arrayOfValues[i]+dilimiter);
			}
			else{
				stringBuffer.append(arrayOfValues[i]);
			}
		}
		return stringBuffer.toString();
	}
	
	// TODO - Remove this from here
	private JSONArray getDataFromCache(String databaseName,String query,String orgId) throws ParseException{
		// Connect to POSTGRES database locally and return the results based on the query
		JSONArray jsonArray = (JSONArray) cacheRepository.getDataFromCache(databaseName, query,orgId);//cacheRepository.getDataFromCache(databaseName, query);
		return jsonArray;
	}
	
	/**This is a private method to validate if the connection fields 
	 * meet the standards or not
	 * @param connection
	 */
	private void validateIncomingData(Connection connection){
		if(connection.getConnectionName()==null || connection.getConnectionName().length()==0){
			throw new RequiredFieldMissing("Connection Name");
		}
	}
}
