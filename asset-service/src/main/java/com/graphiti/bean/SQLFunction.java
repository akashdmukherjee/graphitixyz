package com.graphiti.bean;

import javax.validation.constraints.Null;

/**
 * Enum for FUNCTION capability
 * 
 * @author 
 *
 */

public enum SQLFunction {

	DISTINCT("DISTINCT"),
	NULL("NULL"),
	MIN("MIN"),
	MAX("MAX"),
	SUM("SUM"),
	COUNT("COUNT"),
	AVG("AVG"),
	// Have the DATE related functions PREFIXED by DATE ----- Important
	DATE_GET_DAY("EXTRACT(DAY FROM $COLUMNNAME$)"),
	DATE_GET_MONTH("EXTRACT(MONTH FROM $COLUMNNAME$)"),
	DATE_GET_YEAR("EXTRACT(YEAR FROM $COLUMNNAME$)"),
	DATE_GET_QUARTER("EXTRACT(QUARTER FROM $COLUMNNAME$)"),
	// Have the TIMESTAMP related functions PREFIXED by TIMESTAMP ----- Important
	TIMESTAMP_GET_DAY("EXTRACT(DAY FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_MONTH("EXTRACT(MONTH FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_YEAR("EXTRACT(YEAR FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_QUARTER("EXTRACT(QUARTER FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_HOUR("EXTRACT(HOUR FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_MIN("EXTRACT(MIN FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_SEC("EXTRACT(SEC FROM $COLUMNNAME$)"),
	TIMESTAMP_GET_DATE("$COLUMNNAME$::date");
	
	private final String value;
	
	private SQLFunction(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
