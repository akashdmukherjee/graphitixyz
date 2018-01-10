package com.graphiti.bean;

public enum Endorsement {
	TRUSTED("TRUSTED"),
	ERRONEOUS("ERRONEOUS"),
	DEPRECATED("DEPRECATED");

	private final String value;

	private Endorsement(String value){
		this.value = value;
	}

	public String getValue() {
		return this.value;
	}
}