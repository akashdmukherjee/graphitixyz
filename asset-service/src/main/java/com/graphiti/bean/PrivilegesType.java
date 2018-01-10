package com.graphiti.bean;


/**
 * Enum for Privileges Type
 * 
 * @author 
 *
 */

public enum PrivilegesType {
	
	ADMIN("admin"),
	AUTHOR("author"),
	CREATOR("creator"),
	VIEWER("viewer");
	
	private final String value;
	
	private PrivilegesType(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
