package com.graphiti.bean;

/**
 * Enum for various criteria for String
 * 
 * @author 
 *
 */

public enum Criteria {

	IS("IN"),
	IS_NOT("NOT IN"),
	CONTAINS("LIKE"),
	DOES_NOT_CONTAIN("NOT LIKE"),
	EQUAL("IN"),
	NOT_EQUAL("NOT IN"),
	LESS_THAN("<"),
	LESS_THAN_EQUAL("<="),
	GREATER_THAN(">"),
	GREATER_THAN_EQUAL(">="),
	BETWEEN("BETWEEN"),
	IS_NULL("IS NULL"),
	IS_NOT_NULL("IS NOT NULL");
	
	private final String value;
	
	private Criteria(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
