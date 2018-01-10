package com.graphiti.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.sql.ResultSetMetaData;

public class SQL implements Database{

	public Object getConnection(com.graphiti.bean.Connection connection) throws ClassNotFoundException, SQLException {
		String connectionURL = "jdbc:mysql://"+connection.getServerUrl()+":"+connection.getPort()+"/"+connection.getDatabaseName();
        Class.forName("com.mysql.jdbc.Driver");
        // TODO - SSL
        Connection dbConnection = DriverManager.getConnection(connectionURL, connection.getUsername(), connection.getPassword());
        return dbConnection;
	}
	
	@Override
	public boolean testConnection(com.graphiti.bean.Connection connection) {
		// TODO Auto-generated method stub
		return false;
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
	        stmt.setFetchSize(100);
	        ResultSet rs = stmt.executeQuery(query);
	        ResultSetMetaData resultSetMetadata = rs.getMetaData();
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
	        		
	        		jsonRow.put(columnName, columnValue);
	        	}
	        	jsonArray.add(jsonRow);
	        }
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

	@Override
	public Object getTableNamesFromConnection(
			com.graphiti.bean.Connection connection, String schemaName) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Object getColumnNamesForATableFromConnection(
			com.graphiti.bean.Connection connection, String schemaName,
			String tableName) {
		// TODO Auto-generated method stub
		return null;
	}

}
