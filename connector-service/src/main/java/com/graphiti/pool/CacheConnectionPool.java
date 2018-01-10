package com.graphiti.pool;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.graphiti.Constants;
import com.graphiti.bean.PropertiesBean;


public class CacheConnectionPool extends ObjectPool<Connection>{
	
	private Logger logger = LoggerFactory.getLogger(CacheConnectionPool.class);
	
	Properties properties = Constants.getInstance().properties;
	
	private String databaseName;
	private static Map<String, CacheConnectionPool> cacheConnectionMap;
	
	static {
		cacheConnectionMap = new HashMap<>();
	}
	
	public CacheConnectionPool(String databaseName){
		super();
		this.databaseName = databaseName;
	}
	
	public static CacheConnectionPool getInstance(String databaseName) {
		CacheConnectionPool cacheConnectionPoolInstance = cacheConnectionMap.get(databaseName);
	    if (cacheConnectionPoolInstance == null) {
	    	cacheConnectionPoolInstance = new CacheConnectionPool(databaseName);
	    	cacheConnectionMap.put(databaseName, cacheConnectionPoolInstance);
        }
        return cacheConnectionPoolInstance;
    }

	@Override
	protected Connection create() {
			Connection dbConnection = null;
			try{
				// TODO - Lot of duplication. Please refactor
				if(properties.getProperty("env").equalsIgnoreCase("local")){
					String connectionURL = properties.getProperty("postgres-jdbc-connection-string")+"/"+databaseName+"?OpenSourceSubProtocolOverride=true";
				    Class.forName("org.postgresql.Driver");
					if(Boolean.parseBoolean(properties.getProperty("postgres-isSSLEnabled"))==true){
				    	connectionURL = connectionURL+ "?sslmode=require"; // TODO - Have to do this
				    }
				    dbConnection = DriverManager.getConnection(connectionURL,properties.getProperty("postgres-username"),properties.getProperty("postgres-password"));
				    return dbConnection;
				}
				else{
					// Need to solve for it
				}
			}
			catch(ClassNotFoundException | SQLException e){
				logger.error("Error connecting to the database");
			}
			return dbConnection;
	}

	@Override
	public boolean validate(Connection o) {
		try {
		      return (!((Connection) o).isClosed());
		} catch (SQLException e) {
			  logger.error("Not able to close the database connection");
		      return (false);
		}
	}

	@Override
	public void expire(Connection o) {
		try {
		      ((Connection) o).close();
		} catch (SQLException e) {
			logger.error("Not able to close the database connection");
		}
	}
}
