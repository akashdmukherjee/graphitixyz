package com.graphiti.bean;

import java.io.Serializable;

public class Session implements Serializable {
	private static final long serialVersionUID = 1L;
	private String id;
	private String userId;
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	
	@Override
	public String toString() {
		return "UserID: "+getUserId()+" SessionID: "+getId();
	}
}
