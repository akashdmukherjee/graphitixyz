package com.graphiti.repository;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import com.graphiti.Application;
import com.graphiti.bean.Connection;
import com.graphiti.exceptions.ConnectionCreationException;
import com.graphiti.exceptions.ConnectionNotFoundException;
import com.graphiti.security.Encryptor;
import com.mongodb.WriteResult;

@Repository
public class ConnectionRepository {
	
	// Logger
	private Logger logger = LoggerFactory.getLogger(ConnectionRepository.class);
	
	@Autowired 
	MongoTemplate mongoTemplate;
	
	/**
	 * Insert into table Connection
	 * @param connection
	 * 
	 * 
	 */
	public void add(final String graphiti_tid,final com.graphiti.bean.Connection connection){
		try{
			mongoTemplate.save(connection, "Connections");
		}
		catch(Exception e){
			logger.error("graphiti_tid: {}.Error while creating connection.Message: {}",graphiti_tid,e.getMessage());
			throw new ConnectionCreationException("There was an error while storing the connection");
		}
	}	
	
	/**
	 * Get connection details based on 
	 * connectionId
	 * @param connectionId
	 * @return connection
	 */
	@SuppressWarnings(value = { "all" })
	public com.graphiti.bean.Connection get(final String connectionId,final String organization){
			Query searchConnectionQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(connectionId),Criteria.where("organization").is(organization)));
			Connection connection = mongoTemplate.findOne(searchConnectionQuery,Connection.class,"Connections");
			if(connection==null){
				throw new ConnectionNotFoundException("Connection not Found");
			}
			// Setting password to null
			connection.setPassword("");
			return connection;
	}
	
	/**
	 * This function will only be used internally
	 * @param connectionId
	 * @return
	 */
	@SuppressWarnings(value = { "all" })
	public com.graphiti.bean.Connection getWithPassword(final String connectionId,final String ORG){
			Query searchConnectionQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(connectionId),Criteria.where("organization").is(ORG)));
			Connection connection = mongoTemplate.findOne(searchConnectionQuery,Connection.class,"Connections");
			if(connection==null){
				throw new ConnectionNotFoundException("Connection not Found");
			}
			connection.setPassword(Encryptor.decrypt(Application.getENCRYPTION_KEY(),Application.getINITVECTOR() , connection.getPassword()));
			return connection;
	}
		
	/**
	 * Update connection details for a specific connection
	 * @param connection 
	 * 
	 */
	public boolean update(final String connectionId,final com.graphiti.bean.Connection connection){
		Query searchConnectionQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(connectionId),Criteria.where("organization").is(connection.getOrganization())));
		Connection existingConnection = mongoTemplate.findOne(searchConnectionQuery,Connection.class,"Connections");
		if(existingConnection==null){
			throw new ConnectionNotFoundException("Connection not Found");
		}
		Update update = new Update();
		update.set("connectionName", connection.getConnectionName());
		update.set("databaseType",connection.getDatabaseType());
		update.set("serverUrl", connection.getServerUrl());
		update.set("port", connection.getPort());
		update.set("username", connection.getUsername());
		if(connection.getPassword()!=null && connection.getPassword().trim().length()>0){
			update.set("password", Encryptor.encrypt(Application.getENCRYPTION_KEY(), Application.getINITVECTOR(), connection.getPassword()));
		}
		update.set("isSSLEnabled", connection.isIsSSLEnabled());
		update.set("lastModifiedBy", connection.getLastModifiedBy());
		update.set("lastModifiedOn", connection.getLastModifiedOn());
		WriteResult result = mongoTemplate.updateFirst(searchConnectionQuery,update,Connection.class,"Connections");
		if(result.getN()==1){
			return true;
		}
		else if(result.getN()==0){
			return false;
		}
		return false;
	}
	
	/**
	 *  Get all connections for a user
	 *  @param organization
	 *  @return listOfConnections for a user
	 * 
	 */
	public List<com.graphiti.bean.Connection> getAll(String organization){
		Query searchConnectionQuery = new Query(new Criteria().andOperator(Criteria.where("organization").is(organization)));
		List<Connection> connectionList = mongoTemplate.find(searchConnectionQuery,Connection.class,"Connections");
		if(connectionList==null){
			throw new ConnectionNotFoundException("No Connection found for the organization the user belongs to");
		}
		for(Connection connection : connectionList){
			connection.setPassword("");
		}
		return connectionList;
	}
	
	/**
	 * Delete connection based on connectionId and org
	 * Doing a hard delete
	 * @param connectionId
	 * @param org
	 * 
	 */
	public boolean delete(final String connectionId,final String org){
		Query searchConnectionQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(connectionId),Criteria.where("organization").is(org)));
		Connection existingConnection = mongoTemplate.findOne(searchConnectionQuery,Connection.class,"Connections");
		if(existingConnection==null){
			throw new ConnectionNotFoundException("Connection not Found");
		}
		WriteResult result = mongoTemplate.remove(searchConnectionQuery,"Connections");
		if(result.getN()==1){
			return true;
		}
		else if(result.getN()==0){
			return false;
		}
		return false;
	}
}
