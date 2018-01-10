package com.graphiti.bean;



/**
 * This has AssetUserInfo related details 
 * 
 * @author 
 *
 */

public class UserAccessibilityCountInfo {
	
	private String userId; 
	private String name;
	private int count;
	
	public UserAccessibilityCountInfo(String userId,String name,int count){
		this.userId = userId;
		this.name = name;
		this.count = count;
	}
	
	// Default Contructor
	public UserAccessibilityCountInfo(){
		
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}
}
