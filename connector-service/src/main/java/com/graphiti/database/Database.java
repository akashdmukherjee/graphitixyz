package com.graphiti.database;

import java.sql.Connection;
import java.sql.SQLException;

public interface Database {
	
	/**
	 * 
	 * @param serverDomain
	 * @param port
	 * @param databaseName
	 * @param userName
	 * @param password
	 * @return
	 * @throws ClassNotFoundException
	 * @throws SQLException
	 */
	public Object getConnection(com.graphiti.bean.Connection connection) throws ClassNotFoundException, SQLException;

	public boolean testConnection(com.graphiti.bean.Connection connection);
	
	public Object getTableNamesFromConnection(com.graphiti.bean.Connection connection, String schemaName);
	
	public Object getColumnNamesForATableFromConnection(com.graphiti.bean.Connection connection, String schemaName,String tableName);

}
	
