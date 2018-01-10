package com.graphiti.bean;

/**
 * Enum for DataType of Field
 * 
 * @author 
 *
 */

public enum Order {

	ASC("ASC"),
	DESC("DESC");
	
	private final String value;
	
	private Order(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
