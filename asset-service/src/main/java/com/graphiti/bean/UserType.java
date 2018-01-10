package com.graphiti.bean;

/**
 * Enum for storing type of the User
 * 
 * @author 
 *
 */

public enum UserType {

	MEMBER("MEMBER"),
	TEAM("TEAM");
	
	private final String value;
	
	private UserType(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
