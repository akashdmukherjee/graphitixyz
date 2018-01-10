package com.graphiti.database;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import com.graphiti.exceptions.ColumnInformationRetrievalFromConnectorException;
import com.graphiti.exceptions.JDBCConnectionCloseException;
import com.graphiti.exceptions.NoColumnNamesRetrievedFromConnector;
import com.graphiti.exceptions.NoTablesRetrievedFromConnector;
import com.graphiti.exceptions.TablesInformationRetrievalFromConnectorException;

public class PostGreSQL implements Database{
	
	public Object getConnection(com.graphiti.bean.Connection connection) throws ClassNotFoundException, SQLException {
		String connectionURL = "jdbc:postgresql://"+connection.getServerUrl()+":"+connection.getPort()+"/"+connection.getDatabaseName();
        Class.forName("org.postgresql.Driver");
        if(connection.isIsSSLEnabled()){
        	connectionURL = connectionURL+ "?sslmode=require";
        }
        Connection dbConnection = DriverManager.getConnection(connectionURL, connection.getUsername(), connection.getPassword());
        return dbConnection;
	}
	
	public boolean testConnection(com.graphiti.bean.Connection connection){
		try{
			Connection dbConnection = (Connection) this.getConnection(connection);
			if(!dbConnection.isClosed()){
				dbConnection.close();
				return true;
			}
			else{
				return false;
			}
		}
		catch(ClassNotFoundException | SQLException e){
			return false;
		}
	}

	/**
	 * 
	 * 
	 * @param connection
	 * @param query
	 * @return
	 * @throws SQLException
	 */
	public Object getData(Connection connection,String query) throws SQLException{
		Statement stmt = null;
		try {
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
	        	Object columnName="";
	        	Object columnValue=null;
	        	// iterate over the columns
	        	for(int colItr=1;colItr<=resultSetMetadata.getColumnCount();colItr++){
	        		columnName = resultSetMetadata.getColumnLabel(colItr);
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
	        			// TODO - Not sure if this will work for all use cases
	        			columnValue = rs.getString(colItr);
	        		}
	        		//System.out.println(resultSetMetadata.getColumnType(colItr));
	        		jsonRow.put(columnName, columnValue);
	        	}
	        	jsonArray.add(jsonRow);
	        }
//	        Long endTime = System.currentTimeMillis();
//	        int mb = 1024*1024;
//	        long heapFreeSizeAfter = Runtime.getRuntime().freeMemory();
//	        System.out.println("HeapSize"+((heapFreeSizeBefore-heapFreeSizeAfter)/mb));
//	        System.out.println("Time Taken:"+(endTime-startTime)/1000);
	        if(jsonArray==null || dataTypesInJSON==null){
	        	return null;
	        }
	        else{
		        JSONObject resultingJSONObject = new JSONObject();
		        resultingJSONObject.put("data", jsonArray);
		        resultingJSONObject.put("dataTypes", dataTypesInJSON);
		        return resultingJSONObject;
	        }
	    } catch (SQLException e ) {
	        e.printStackTrace();
	    } finally {
	        if (stmt != null) { 
	        	stmt.close(); 
	        }
	    }
		return null;
	}
	
	public void closeConnection(Connection connection) throws SQLException{
		if(!connection.isClosed()){
			connection.close();
		}
	}

	// Reference:http://stackoverflow.com/questions/14730228/postgres-query-to-list-all-table-names
	@Override
	public Object getTableNamesFromConnection(
			com.graphiti.bean.Connection connection, String schemaName){
		Connection dbConnection = null;
		try{
			dbConnection = (Connection) this.getConnection(connection);
			// TODO - This will only get tables in public schema
			String query = "SELECT table_name FROM information_schema.tables"
							+ " WHERE table_schema='"+schemaName+"' AND table_type='BASE TABLE'";
			PreparedStatement preparedStatement = dbConnection.prepareStatement(query);
			ResultSet rs = preparedStatement.executeQuery();
			ArrayList<String> tableNames = new ArrayList<String>();
			while (rs.next()) {
				tableNames.add(rs.getString(1)); // This will get all table names
			}
			if(tableNames.size()>0){
				JSONObject returningJSON = new JSONObject();
				returningJSON.put("tableNames", tableNames);
				return returningJSON;
			}
			else{
				throw new NoTablesRetrievedFromConnector("No Table Retrieved from Connector");
			}
		}
		catch(ClassNotFoundException | SQLException e){
			throw new TablesInformationRetrievalFromConnectorException("Error while retrieving table information from connector");
		}
		finally{
			try{
				if(!dbConnection.isClosed()){
					dbConnection.close();
				}
			}
			catch(SQLException e){
				throw new JDBCConnectionCloseException("Error closing database connection");
			}
		}
	}

	@Override
	public Object getColumnNamesForATableFromConnection(
			com.graphiti.bean.Connection connection, String schemaName,
			String tableName) {
		Connection dbConnection = null;
		try{
			dbConnection = (Connection) this.getConnection(connection);
			// TODO - This will only get tables in public schema
			String query = "SELECT column_name FROM information_schema.columns"
							+ " WHERE table_schema='"+schemaName+"' AND table_name='"+tableName+"'";
			PreparedStatement preparedStatement = dbConnection.prepareStatement(query);
			ResultSet rs = preparedStatement.executeQuery();
			ArrayList<String> columnNames = new ArrayList<String>();
			while (rs.next()) {
				columnNames.add(rs.getString(1)); // This will get all table names
			}
			if(columnNames.size()>0){
				JSONObject returningJSON = new JSONObject();
				returningJSON.put("columnNames", columnNames);
				return returningJSON;
			}
			else{
				throw new NoColumnNamesRetrievedFromConnector("No Table Retrieved from Connector");
			}
		}
		catch(ClassNotFoundException | SQLException e){
			throw new ColumnInformationRetrievalFromConnectorException("Error while retrieving table information from connector");
		}
		finally{
			try{
				if(!dbConnection.isClosed()){
					dbConnection.close();
				}
			}
			catch(SQLException e){
				throw new JDBCConnectionCloseException("Error closing database connection");
			}
		}
	}
}
