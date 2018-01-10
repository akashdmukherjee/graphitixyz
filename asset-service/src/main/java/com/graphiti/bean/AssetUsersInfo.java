package com.graphiti.bean;



/**
 * This has AssetUserInfo related details 
 * 
 * @author 
 *
 */

public class AssetUsersInfo {
	
	private String id; // This can be a memberId or teamId
	private String name;
	private UserType usertype;
	
	
	public AssetUsersInfo(String id,String name,UserType t){
		this.id = id;
		this.name = name;
		this.usertype = t;
	}
	
	// Default Contructor
	public AssetUsersInfo(){
		
	}
	
	// Getter and Setters
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public UserType getUsertype() {
		return usertype;
	}

	public void setUsertype(UserType usertype) {
		this.usertype = usertype;
	}
}
