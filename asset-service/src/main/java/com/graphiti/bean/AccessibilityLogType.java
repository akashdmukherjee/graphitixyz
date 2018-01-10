package com.graphiti.bean;

public enum AccessibilityLogType {
	
	VIEWERS("VIEWERS"),
	EDITORS("EDITORS");

	private final String value;

	private AccessibilityLogType(String value){
		this.value = value;
	}

	public String getValue() {
		return this.value;
	}
}
