package com.graphiti.bean;

/**
 * Enum for DataType of Field
 * 
 * @author 
 *
 */

public enum FieldDataType {

	STRING("STRING"),
	INTEGER("INTEGER"),
	DECIMAL("DECIMAL"),
	DATE("DATE"),
	TIMESTAMP("TIMESTAMP");
	
	private final String value;
	
	private FieldDataType(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
