package com.graphiti.Factory;

import com.graphiti.database.Database;
import com.graphiti.database.MSSQL;
import com.graphiti.database.Oracle;
import com.graphiti.database.PostGreSQL;
import com.graphiti.database.SQL;

public class DatabaseFactory {
	/**
	 * Get appropriate Database object
	 * depending on the type of the database
	 * @param databaseName
	 * @return
	 */
	public Database getDatabase(String databaseName){
		if(databaseName==null){
			return null;
		}
		else if(databaseName.equalsIgnoreCase("SQL")){
			return new SQL();
		}
		else if(databaseName.equalsIgnoreCase("POSTGRESQL")){
			return new PostGreSQL();
		}
		else if(databaseName.equalsIgnoreCase("ORACLE")){
			return new Oracle();
		}
		else if(databaseName.equalsIgnoreCase("MS-SQL")){
			return new MSSQL();
		}
		return null;
	}
}
