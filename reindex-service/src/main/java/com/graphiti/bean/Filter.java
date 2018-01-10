package com.graphiti.bean;

import java.util.List;


public class Filter {
	
	private String columnName;
	private Criteria criteria;
	private SQLFunction sqlFunction;
	private FieldDataType dataType;
	private List<String> values;
	
	public String getColumnName() {
		return columnName;
	}
	public void setColumnName(String columnName) {
		this.columnName = columnName;
	}
	
	public Criteria getCriteria() {
		return criteria;
	}
	public SQLFunction getSqlFunction() {
		return sqlFunction;
	}
	public void setSqlFunction(SQLFunction sqlFunction) {
		this.sqlFunction = sqlFunction;
	}
	public void setCriteria(Criteria criteria) {
		this.criteria = criteria;
	}
	public FieldDataType getDataType() {
		return dataType;
	}
	public void setDataType(FieldDataType dataType) {
		this.dataType = dataType;
	}
	public List<String> getValues() {
		return values;
	}
	public void setValues(List<String> values) {
		this.values = values;
	}
}
