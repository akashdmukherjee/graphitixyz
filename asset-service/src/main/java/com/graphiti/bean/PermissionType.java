package com.graphiti.bean;

public enum PermissionType {
	ADMIN("ADMIN"),
	VIEWER("VIEWER"),
	AUTHOR("AUTHOR");
	
	private final String value;
	
	private PermissionType(String value) {
		this.value = value;
	}
	
	public String getValue() {
		return this.value;
	}
}
