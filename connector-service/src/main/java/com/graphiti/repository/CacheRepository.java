package com.graphiti.repository;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.Iterator;
import java.util.Properties;

import org.hibernate.validator.internal.util.privilegedactions.GetConstraintValidatorList;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import com.graphiti.Constants;
import com.graphiti.exceptions.DataInjestionException;
import com.graphiti.exceptions.DatabaseDeletionException;
import com.graphiti.exceptions.JDBCConnectionCloseException;
import com.graphiti.exceptions.NoDataReturnedFromQuery;
import com.graphiti.exceptions.ReadDataException;
import com.graphiti.exceptions.TableCreationInCacheException;
import com.graphiti.exceptions.TableDeletionExceptionInCache;
import com.graphiti.pool.CacheConnectionPool;

@Repository
public class CacheRepository {
	
	Logger logger = LoggerFactory.getLogger(CacheRepository.class);
	
	/**
	 * Get Cache Repository Connection
	 * @param databaseVendor this will be wither PostGres
	 * @param databaseName the name of the database
	 * @throws SQLException 
	 * @throws ClassNotFoundException 
	 * @throws IOException 
	 * @throws FileNotFoundException 
	 */
	private Connection getCacheConnection(String databaseVendor,String databaseName) throws SQLException, ClassNotFoundException, FileNotFoundException, IOException{
		Properties properties = Constants.getInstance().properties;
		Connection dbConnection = null;
		if(databaseVendor.equalsIgnoreCase("POSTGRES")){
			String connectionURL = properties.getProperty("postgres-jdbc-connection-string")+"/"+databaseName+"?OpenSourceSubProtocolOverride=true";
		    Class.forName("org.postgresql.Driver");
			if(Boolean.parseBoolean(properties.getProperty("postgres-isSSLEnabled"))==true){
		    	connectionURL = connectionURL+ "?sslmode=require"; // TODO - Have to do this
		    }
		    dbConnection = DriverManager.getConnection(connectionURL,properties.getProperty("postgres-username"),properties.getProperty("postgres-password"));
		    return dbConnection;
		}
		return dbConnection;
	}
	
	/**
	 * 
	 * @param graphiti_tid
	 * @param databaseName
	 * @param createTableString
	 * @param organizationId
	 * @return
	 * @throws JDBCConnectionCloseException
	 */
	public boolean createTable(String graphiti_tid,String databaseName,String createTableString,String organizationId) throws JDBCConnectionCloseException{
		Connection connection = null;
		CacheConnectionPool cacheConnectionPool = CacheConnectionPool.getInstance(databaseName);
		try{
			connection = cacheConnectionPool.checkOut(organizationId);//getCacheConnection(databaseVendor,databaseName);
			PreparedStatement ps = connection.prepareStatement(createTableString);
			int resultOfCrationOfTable = ps.executeUpdate();
			// Committing connection
			connection.setAutoCommit(false);
			connection.commit();
			if(resultOfCrationOfTable==0){
				return true;
			}
			else{
				return false; // Failed in creation of table
			}
		}
		catch (SQLException e) {
			logger.error("graphiti-tid:{}.Error Message:{}",graphiti_tid,e.getMessage());
			throw new TableCreationInCacheException("Create Table Method."+e.getMessage());
		}
		finally{
			if(connection!=null){
				cacheConnectionPool.checkIn(organizationId, connection);
			}
		}
	}
	
	public boolean deleteDataSetFromCache(String graphiti_tid,String databaseName,String tableName,String organizationId) throws JDBCConnectionCloseException{
		// First get the connection
		Connection connection = null;
		CacheConnectionPool cacheConnectionPool = CacheConnectionPool.getInstance(databaseName);
		try{
			connection = cacheConnectionPool.checkOut(organizationId);//getCacheConnection(databaseVendor,databaseName);
			String dropTableQuery = "DROP TABLE "+tableName;
			PreparedStatement ps = connection.prepareStatement(dropTableQuery);
			int resultOfDeletionOfTable = ps.executeUpdate();
			if(resultOfDeletionOfTable==0){
				logger.info("graphiti-tid:{}. Successfully deleted table from cache");
				return true;
			}
			else{
				logger.info("graphiti-tid:{}. Could not delete table from cache");
				return false; // Failed in creation of table
			}
		}
		catch (SQLException e) {
			logger.info("graphiti_tid:{}.Error Message:{}",graphiti_tid,e.getMessage());
			throw new TableDeletionExceptionInCache("Delete Table Method.Error while dropping the table."+e.getMessage());
		}
		finally{
			if(connection!=null){
				cacheConnectionPool.checkIn(organizationId, connection);
			}
		}
	}
	
	/**
	 * 
	 * 
	 * @param databaseName
	 * @param datasetName
	 * @param jsonArrayToInjest
	 * @param datatypes
	 * @return
	 * @throws DataInjestionException
	 * @throws JDBCConnectionCloseException
	 */
	public boolean injestDataIntoCache(String graphiti_tid,String databaseName,String datasetName,JSONArray jsonArrayToInjest,JSONObject datatypes,String organizationId) throws DataInjestionException,JDBCConnectionCloseException{
		// Create the connection
		Connection connection = null;	
		CacheConnectionPool cacheConnectionPool = CacheConnectionPool.getInstance(databaseName);
		try{
			connection = cacheConnectionPool.checkOut(organizationId);
			// setting auto-commit to false
			connection.setAutoCommit(false);
			String[] keySetInArray = (String[]) datatypes.keySet().toArray(new String[datatypes.keySet().size()]);
			StringBuffer orderedListOfColumnNamesForInsertion = new StringBuffer();
			//orderedListOfColumnNamesForInsertion.append("(GRAPHITI_ID,");
			orderedListOfColumnNamesForInsertion.append("(");
			for(int colItr = 0;colItr<keySetInArray.length;colItr++){
				if(colItr==keySetInArray.length-1){
					orderedListOfColumnNamesForInsertion.append(keySetInArray[colItr]);// For last col no need of comma
				}
				else{
					orderedListOfColumnNamesForInsertion.append(keySetInArray[colItr]).append(",");
				}
			}
			orderedListOfColumnNamesForInsertion.append(")");
			String orderedListOfColumnNamesForInsertionInString = orderedListOfColumnNamesForInsertion.toString();
			orderedListOfColumnNamesForInsertion = null;
			// We will do a bulk insert
			StringBuffer query = new StringBuffer("INSERT INTO "+(datasetName+orderedListOfColumnNamesForInsertionInString)+" VALUES");
			logger.info("Insert Statment:{}",query);
			Statement statement = connection.createStatement();
			for(int i=0; i<jsonArrayToInjest.size();i++) {
				if (i == 0) {
						query = query.append(formatJSONObject(i,(JSONObject)jsonArrayToInjest.get(i),datatypes,keySetInArray));
						logger.info("Query"+query);
				} else if(i % 400 != 0) {
						query = query.append("," + formatJSONObject(i,(JSONObject)jsonArrayToInjest.get(i),datatypes,keySetInArray));
				} else {
						statement.addBatch(query.toString());
						query = new StringBuffer("INSERT INTO "+(datasetName+orderedListOfColumnNamesForInsertionInString)+" VALUES");
						query = query.append(formatJSONObject(i,(JSONObject)jsonArrayToInjest.get(i),datatypes,keySetInArray));
				}
				if(i!=0 && i % 2000 == 0) {
						statement.executeBatch();
				}
			}
			statement.addBatch(query.toString());
			statement.executeBatch();
			connection.commit();
			return true;
		} catch (SQLException e) {
			throw new DataInjestionException("Injest Method.Error while injestion of data."+e.getMessage());
		}
		finally{
			if(connection!=null){
				cacheConnectionPool.checkIn(organizationId, connection);
			}
		}
	}
	
	/**
	 * Get data along with datatypes from cache
	 * 
	 * @param graphiti_tid
	 * @param databaseName
	 * @param query
	 * @param organizationId
	 * @return
	 */
	public Object getDataFromCacheAlongWithMetadata(String graphiti_tid,String databaseName,String query,String organizationId){
		// Create the connection
				Statement stmt = null;
				CacheConnectionPool cacheConnectionPool = CacheConnectionPool.getInstance(databaseName);
				Connection connection = null;	
				try{
					String env = Constants.getInstance().properties.getProperty("env");
					String databaseVendor = null;
					// First get the connection
					if(env.equalsIgnoreCase("local")){
						databaseVendor = "POSTGRES";
					}
					else if(env.equalsIgnoreCase("prod")){
						// Need to correct this
					}
					connection = cacheConnectionPool.checkOut(organizationId); //(databaseVendor,databaseName);
					if(databaseVendor.equalsIgnoreCase("POSTGRES")){
						stmt = connection.createStatement(java.sql.ResultSet.TYPE_FORWARD_ONLY,
			                    java.sql.ResultSet.CONCUR_READ_ONLY);
				        connection.setAutoCommit(false);
				        stmt.setFetchSize(100);// TODO - This is kept 100 as of now, based on recommendations 
				        ResultSet rs = stmt.executeQuery(query);
				        ResultSetMetaData resultSetMetadata = (ResultSetMetaData) rs.getMetaData();
				        JSONObject dataTypesInJSON = new JSONObject();
				        for(int colItr=1;colItr<=resultSetMetadata.getColumnCount();colItr++){
				        	if(resultSetMetadata.getColumnType(colItr)==Types.VARCHAR){
				        		dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"String");
			        		}
			        		else if(resultSetMetadata.getColumnType(colItr)==Types.INTEGER){
			        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Integer");
			        		}
			        		else if(resultSetMetadata.getColumnType(colItr)==Types.DECIMAL || resultSetMetadata.getColumnType(colItr)==Types.DOUBLE || resultSetMetadata.getColumnType(colItr)==Types.NUMERIC){
			        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Decimal");
			        		}
			        		else if(resultSetMetadata.getColumnType(colItr)==Types.BIGINT){
			        			// The reason for doing Integer because Integer is stored in cache as BIGINT
			        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Integer"); 
			        		}
			        		else if(resultSetMetadata.getColumnType(colItr)==Types.DATE){
			        			// The reason for doing Integer because Integer is stored in cache as BIGINT
			        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Date"); 
			        		}
			        		else if(resultSetMetadata.getColumnType(colItr)==Types.TIMESTAMP){
			        			// The reason for doing Integer because Integer is stored in cache as BIGINT
			        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Timestamp"); 
			        		}
				        }
				        JSONArray jsonArray = new JSONArray();
				        //Long startTime = System.currentTimeMillis();
				        //long heapFreeSizeBefore = Runtime.getRuntime().freeMemory(); 
				        while(rs.next()){
				        	JSONObject jsonRow = new JSONObject();
				        	String columnName="";
				        	Object columnValue=null;
				        	// iterate over the columns
				        	for(int colItr=1;colItr<=resultSetMetadata.getColumnCount();colItr++){
				        		columnName = (String) resultSetMetadata.getColumnLabel(colItr);
				        		columnName = columnName.replaceFirst("____", "(");
				        		columnName = columnName.replaceFirst("____", ")");
				        		columnValue = null;
				        		if(resultSetMetadata.getColumnType(colItr)==Types.VARCHAR){
				        			columnValue = rs.getString(colItr);
				        		}
				        		else if(resultSetMetadata.getColumnType(colItr)==Types.INTEGER){
				        			columnValue = rs.getInt(colItr);
				        		}
				        		else if(resultSetMetadata.getColumnType(colItr)==Types.DECIMAL || resultSetMetadata.getColumnType(colItr)==Types.DOUBLE || resultSetMetadata.getColumnType(colItr)==Types.NUMERIC){
				        			columnValue = rs.getDouble(colItr);
				        		}
				        		else if(resultSetMetadata.getColumnType(colItr)==Types.BIGINT){
				        			columnValue = rs.getBigDecimal(colItr);
				        		}
				        		else if(resultSetMetadata.getColumnType(colItr)==Types.DATE || resultSetMetadata.getColumnType(colItr)==Types.TIMESTAMP){
				        			columnValue = rs.getString(colItr);
				        		}
				        		//System.out.println(resultSetMetadata.getColumnType(colItr));
				        		jsonRow.put(columnName, columnValue);
				        	}
				        	jsonArray.add(jsonRow);
				        }
				        if(jsonArray==null || dataTypesInJSON==null || jsonArray.size()==0){
				        	return null;
				        }
				        else{
					        JSONObject resultingJSONObject = new JSONObject();
					        resultingJSONObject.put("data", jsonArray);
					        resultingJSONObject.put("dataTypes", dataTypesInJSON);
					        return resultingJSONObject;
				        }
					}
				}
				catch(SQLException e){
					throw new ReadDataException("GetData from Cache. Error while reading data from cache."+e.getMessage());
				}
				finally{
					 if(connection!=null){
						 cacheConnectionPool.checkIn(organizationId,connection);   
					 }
				}
				return null;
	}

	/** 
	 * The purpose of this function is to get data from cache
	 * @param databaseName
	 * @param query
	 * @return
	 */
	public Object getDataFromCache(String databaseName,String query,String organizationId) throws ReadDataException{
		// Create the connection
		Statement stmt = null;
		CacheConnectionPool cacheConnectionPool = CacheConnectionPool.getInstance(databaseName);
		Connection connection = null;	
		try{
			String env = Constants.getInstance().properties.getProperty("env");
			String databaseVendor = null;
			// First get the connection
			if(env.equalsIgnoreCase("local")){
				databaseVendor = "POSTGRES";
			}
			else if(env.equalsIgnoreCase("prod")){
				// 
			}
			connection = cacheConnectionPool.checkOut(organizationId); //(databaseVendor,databaseName);
			if(databaseVendor.equalsIgnoreCase("POSTGRES")){
				stmt = connection.createStatement(java.sql.ResultSet.TYPE_FORWARD_ONLY,
	                    java.sql.ResultSet.CONCUR_READ_ONLY);
		        connection.setAutoCommit(false);
		        stmt.setFetchSize(100);// TODO - This is kept 100 as of now, based on recommendations 
		        ResultSet rs = stmt.executeQuery(query);
		        ResultSetMetaData resultSetMetadata = (ResultSetMetaData) rs.getMetaData();
		        JSONArray jsonArray = new JSONArray();
		        //Long startTime = System.currentTimeMillis();
		        //long heapFreeSizeBefore = Runtime.getRuntime().freeMemory(); 
		        while(rs.next()){
		        	JSONObject jsonRow = new JSONObject();
		        	String columnName="";
		        	Object columnValue=null;
		        	// iterate over the columns
		        	for(int colItr=1;colItr<=resultSetMetadata.getColumnCount();colItr++){
		        		columnName = (String) resultSetMetadata.getColumnLabel(colItr);
		        		columnName = columnName.replaceFirst("____", "(");
		        		columnName = columnName.replaceFirst("____", ")");
		        		columnValue = null;
		        		if(resultSetMetadata.getColumnType(colItr)==Types.VARCHAR || resultSetMetadata.getColumnType(colItr)==Types.OTHER){
		        			columnValue = rs.getString(colItr);
		        		}
		        		else if(resultSetMetadata.getColumnType(colItr)==Types.INTEGER){
		        			columnValue = rs.getInt(colItr);
		        		}
		        		else if(resultSetMetadata.getColumnType(colItr)==Types.DECIMAL || resultSetMetadata.getColumnType(colItr)==Types.DOUBLE || resultSetMetadata.getColumnType(colItr)==Types.NUMERIC){
		        			columnValue = rs.getDouble(colItr);
		        		}
		        		else if(resultSetMetadata.getColumnType(colItr)==Types.BIGINT){
		        			columnValue = rs.getBigDecimal(colItr);
		        		}
		        		else if(resultSetMetadata.getColumnType(colItr)==Types.DATE || resultSetMetadata.getColumnType(colItr)==Types.TIMESTAMP){
		        			columnValue = rs.getString(colItr);
		        		}
		        		//System.out.println(resultSetMetadata.getColumnType(colItr));
		        		jsonRow.put(columnName, columnValue);
		        	}
		        	jsonArray.add(jsonRow);
		        }
		       return jsonArray;
			}
		}
		catch(SQLException e){
			throw new ReadDataException("GetData from Cache. Error while reading data from cache."+e.getMessage());
		}
		finally{
			 if(connection!=null){
				 cacheConnectionPool.checkIn(organizationId,connection);   
			 }
		}
		return null;
	}
	
	
	/**
	 * The purpose of this this function 
	 * is to get columnNames and their corresponding dataType
	 * for a specific table
	 * 
	 * @param databaseName
	 * @param query
	 * @return
	 */
	public JSONObject getColumnNameAndDataTypeFromCache(String databaseName,String query,String organizationId) {
		// Create the connection
		Statement stmt = null;
		Connection connection = null;
		CacheConnectionPool cacheConnectionPool = CacheConnectionPool.getInstance(databaseName);
		try {
			String databaseVendor = null;
			String env = Constants.getInstance().properties.getProperty("env");
			// First get the connection
			if(env.equalsIgnoreCase("local")){
				databaseVendor = "POSTGRES";
			}
			else if(env.equalsIgnoreCase("prod")){
				// Need to solve
			}
			connection = cacheConnectionPool.checkOut(organizationId);
			if (databaseVendor.equalsIgnoreCase("POSTGRES")) {
				stmt = connection.createStatement(
						java.sql.ResultSet.TYPE_FORWARD_ONLY,
						java.sql.ResultSet.CONCUR_READ_ONLY);
				connection.setAutoCommit(false);
				stmt.setFetchSize(100); // TODO - This is kept 100 as of now,
										// based on recommendations
				ResultSet rs = stmt.executeQuery(query);
				ResultSetMetaData resultSetMetadata = (ResultSetMetaData) rs
						.getMetaData();
				JSONObject dataTypesInJSON = new JSONObject();
				for(int colItr=1;colItr<=resultSetMetadata.getColumnCount();colItr++){
		        	if(resultSetMetadata.getColumnType(colItr)==Types.VARCHAR){
		        		dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"String");
	        		}
	        		else if(resultSetMetadata.getColumnType(colItr)==Types.INTEGER){
	        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Integer");
	        		}
	        		else if(resultSetMetadata.getColumnType(colItr)==Types.DECIMAL || resultSetMetadata.getColumnType(colItr)==Types.DOUBLE || resultSetMetadata.getColumnType(colItr)==Types.NUMERIC){
	        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Decimal");
	        		}
	        		else if(resultSetMetadata.getColumnType(colItr)==Types.BIGINT){
	        			// The reason for doing Integer because Integer is stored in cache as BIGINT
	        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Integer"); 
	        		}
	        		else if(resultSetMetadata.getColumnType(colItr)==Types.DATE){
	        			// The reason for doing Integer because Integer is stored in cache as BIGINT
	        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Date"); 
	        		}
	        		else if(resultSetMetadata.getColumnType(colItr)==Types.TIMESTAMP){
	        			// The reason for doing Integer because Integer is stored in cache as BIGINT
	        			dataTypesInJSON.put(resultSetMetadata.getColumnLabel(colItr),"Timestamp"); 
	        		}
		        }
				return dataTypesInJSON;
			}
		} catch(SQLException e){
			throw new ReadDataException("Get ColumnInfo from Cache. Error while getting column info from cache"+e.getMessage());
		}
		finally{
			if(connection!=null){
				cacheConnectionPool.checkIn(organizationId, connection);
			}
		}
		return null;
	}
	
	
	private String formatJSONObject(int recordNum,JSONObject jsonObjectToBeInserted,JSONObject dataTypeForObjectToBeInserted,String[] keySetInArray){
		StringBuffer insertRecordBuffer = new StringBuffer();
		//insertRecordBuffer.append("("+(recordNum+1)+",");// This is for Graphiti_Id
		insertRecordBuffer.append("(");
		Iterator<String> keysOfObjectToBeInserted = jsonObjectToBeInserted.keySet().iterator();
		for(int colItr=0;colItr<keySetInArray.length;colItr++){
			String key = keySetInArray[colItr];
			String dataType = (String) dataTypeForObjectToBeInserted.get(key);
			if(dataType.equalsIgnoreCase("String") || dataType.equalsIgnoreCase("Date") || dataType.equalsIgnoreCase("Timestamp")){
				if(jsonObjectToBeInserted.get(key)!=null){
					insertRecordBuffer.append("'"+((String)jsonObjectToBeInserted.get(key)).replaceAll("'", "''")+"\',");
				}
				else{
					insertRecordBuffer.append("null"+",");
				}
				//insertRecordBuffer.append("'"+jsonObjectToBeInserted.get(key)+"\',");
			}
			else{ // If its a double or an integer
				if(jsonObjectToBeInserted.get(key)!=null){
					insertRecordBuffer.append(jsonObjectToBeInserted.get(key)+",");		
				}
				else{
					insertRecordBuffer.append("null"+",");
				}
			}
		}
		String insertQueryInString = insertRecordBuffer.toString();
		insertQueryInString = insertQueryInString.substring(0,insertQueryInString.length()-1)+")";
		return insertQueryInString;
	}
	
}
