package com.graphiti.bean;


/**
 * Enum for storing type of the Asset
 * 
 * @author 
 *
 */

public enum AssetType {
	
	SQL("SQL"),
	DATASET("DATASET"),
	CHART("CHART");
	
	private final String value;
	
	private AssetType(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
