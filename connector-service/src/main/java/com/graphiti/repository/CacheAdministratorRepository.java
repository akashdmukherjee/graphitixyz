package com.graphiti.repository;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import com.graphiti.Constants;
import com.graphiti.exceptions.ConnectionCreationException;
import com.graphiti.exceptions.DatabaseCreationException;
import com.graphiti.exceptions.DatabaseDeletionException;
import com.graphiti.exceptions.JDBCConnectionCloseException;

@Repository
public class CacheAdministratorRepository {

	// Logger
	Logger logger = LoggerFactory.getLogger(CacheAdministratorRepository.class);
	
	/**
	 * This is to create a database in Cache
	 * 
	 * @param graphiti_tid
	 * @param databaseName
	 */
	public void createDatabase(String graphiti_tid,String databaseName){
		Connection dbConnection = null;
		try{
			logger.info("graphiti-tid:{}. Creating a database with name:{}",graphiti_tid,databaseName);
			Properties properties = Constants.getInstance().properties;
			// In this case we will get a singleton Connection instance to Cache and then return it
			// Just create a connection here and close it down.
			// very rare operation
			String connectionURL = properties.getProperty("postgres-jdbc-connection-string")+"/"+properties.getProperty("postgres-default-database");
			if(((String) Constants.getInstance().properties.get("env")).equalsIgnoreCase("local")){
				Class.forName("org.postgresql.Driver");
			}
			else{
				// TODO
			}
		    if(Boolean.parseBoolean(properties.getProperty("postgres-isSSLEnabled"))==true){
		    	connectionURL = connectionURL+ "?sslmode=require"; // TODO - Have to do this
		    }
		    dbConnection = DriverManager.getConnection(connectionURL,properties.getProperty("postgres-username"),properties.getProperty("postgres-password"));
		    // TODO - Check how to make it parameterized
		    PreparedStatement ps = dbConnection.prepareStatement("CREATE DATABASE "+databaseName);
			ps.executeUpdate();
			logger.info("graphiti-tid:{}. Successfully created database with name {}",graphiti_tid,databaseName);
		} catch (ClassNotFoundException e) {
			logger.error("graphiti-tid:{}. Message:{}",graphiti_tid,e.getMessage());
			throw new ConnectionCreationException("Error creating a connection to a database");
		} catch (SQLException e) {
			logger.error("graphiti-tid:{}. Message:{}",graphiti_tid,e.getMessage());
			throw new DatabaseCreationException("Error creating a connection to a database");
		}
		finally{
			try {
				if(dbConnection!=null && !dbConnection.isClosed()){
					dbConnection.close();
				}
			} catch (SQLException e) {
				logger.error("graphiti-tid:{}. Message:{}",graphiti_tid,e.getMessage());
				throw new JDBCConnectionCloseException("Error while closing a connection to cache");
			}
		}
	}
	
	public void deleteDatabase(String graphiti_tid,String databaseName){
		Connection dbConnection = null;
		try{
			logger.info("graphiti-tid:{}. Deleteing a database with name:{}",graphiti_tid,databaseName);
			Properties properties = Constants.getInstance().properties;
			// In this case we will get a singleton Connection instance to Cache and then return it
			// Just create a connection here and close it down.
			// very rare operation
			String connectionURL = properties.getProperty("postgres-jdbc-connection-string")+"/"+properties.getProperty("postgres-default-database");
			if(((String) Constants.getInstance().properties.get("env")).equalsIgnoreCase("local")){
				Class.forName("org.postgresql.Driver");
			}
			else{
				// TODO
			}
		    if(Boolean.parseBoolean(properties.getProperty("postgres-isSSLEnabled"))==true){
		    	connectionURL = connectionURL+ "?sslmode=require"; // TODO - Have to do this
		    }
		    dbConnection = DriverManager.getConnection(connectionURL,properties.getProperty("postgres-username"),properties.getProperty("postgres-password"));
		    // TODO - Check how to make it parameterized
		    PreparedStatement ps = dbConnection.prepareStatement("DROP DATABASE "+databaseName);
			ps.executeUpdate();
			logger.info("graphiti-tid:{}. Successfully deleted database with name {}",graphiti_tid,databaseName);
		} catch (ClassNotFoundException e) {
			logger.error("graphiti-tid:{}. Message:{}",graphiti_tid,e.getMessage());
			throw new ConnectionCreationException("Error creating a connection to a database");
		} catch (SQLException e) {
			logger.error("graphiti-tid:{}. Message:{}",graphiti_tid,e.getMessage());
			throw new DatabaseDeletionException("Error deleting a database");
		}
		finally{
			try {
				if(dbConnection!=null && !dbConnection.isClosed()){
					dbConnection.close();
				}
			} catch (SQLException e) {
				logger.error("graphiti-tid:{}. Message:{}",graphiti_tid,e.getMessage());
				throw new JDBCConnectionCloseException("Error while closing a connection to cache");
			}
		}
	}
}
