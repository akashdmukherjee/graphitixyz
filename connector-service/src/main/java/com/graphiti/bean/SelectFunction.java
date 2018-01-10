package com.graphiti.bean;

public class SelectFunction {

	private SQLFunction sqlFunction;
	private String columnName;
	
	
	public SQLFunction getSqlFunction() {
		return sqlFunction;
	}
	public void setSqlFunction(SQLFunction sqlFunction) {
		this.sqlFunction = sqlFunction;
	}
	public String getColumnName() {
		return columnName;
	}
	public void setColumnName(String columnName) {
		this.columnName = columnName;
	}
}
