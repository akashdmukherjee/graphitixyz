package com.graphiti.bean;

/**
 * Enum for various criteria for String
 * 
 * @author 
 *
 */

public enum IntegerCriteria {

	EQUAL("="),
	NOT_EQUAL("!="),
	LESS_THAN("<"),
	LESS_THAN_EQUAL("<="),
	GREATER_THAN(">"),
	GREATER_THAN_EQUAL(">="),
	BETWEEN("BETWEEN"),
	IS_EMPTY("IS NULL"),
	IS_NOT_EMPTY("IS NOT NULL");
	
	private final String value;
	
	private IntegerCriteria(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}

