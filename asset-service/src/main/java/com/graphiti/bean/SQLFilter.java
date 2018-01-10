package com.graphiti.bean;

public class SQLFilter {
	
	private String filterSetId;
	private String name;
	private String sqlFilterURLInS3;
	
	// Default
	public SQLFilter(){
		
	}
	
	// Constructor with parameters
	public SQLFilter(String filterSetId,String name,String sqlFilterURLInS3){
		this.filterSetId = filterSetId;
		this.name = name;
		this.sqlFilterURLInS3 = sqlFilterURLInS3;
	}
	
	public String getFilterSetId() {
		return filterSetId;
	}
	public void setFilterSetId(String filterSetId) {
		this.filterSetId = filterSetId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getSqlFilterURLInS3() {
		return sqlFilterURLInS3;
	}
	public void setSqlFilterURLInS3(String sqlFilterURLInS3) {
		this.sqlFilterURLInS3 = sqlFilterURLInS3;
	}
}
