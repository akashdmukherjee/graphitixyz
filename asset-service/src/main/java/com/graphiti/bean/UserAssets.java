package com.graphiti.bean;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This has UserAssets 
 * 
 * @author 
 *
 */
@Document(collection = "UserAssets")
public class UserAssets {
	
	private String id;
	private List<UserAssetsInfo> creatorOf;
	private List<UserAssetsInfo> authorOf;
	private List<UserAssetsInfo> adminOf;
	private List<UserAssetsInfo> viewerOf;
	private List<UserAssetsInfo> followerOf;
	private String orgId;
	private UserType userType;
	
	// Default Constructor
	public UserAssets(){
		creatorOf = new ArrayList<>(1);
		authorOf = new ArrayList<>(1); 
		adminOf = new ArrayList<>(1);
		viewerOf = new ArrayList<>(1);
		followerOf = new ArrayList<>(1);
	}
	
	// Constructor
	public UserAssets(String id,String orgId,UserType type){
		this.id = id;
		this.orgId = orgId;
		this.userType = type;
		creatorOf = new ArrayList<>(1);
		authorOf = new ArrayList<>(1); 
		adminOf = new ArrayList<>(1);
		viewerOf = new ArrayList<>(1);
		followerOf = new ArrayList<>(1);
	}
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public List<UserAssetsInfo> getCreatorOf() {
		return creatorOf;
	}
	public void setCreatorOf(List<UserAssetsInfo> creatorOf) {
		this.creatorOf = creatorOf;
	}
	public List<UserAssetsInfo> getAuthorOf() {
		return authorOf;
	}
	public void setAuthorOf(List<UserAssetsInfo> authorOf) {
		this.authorOf = authorOf;
	}
	public List<UserAssetsInfo> getAdminOf() {
		return adminOf;
	}
	public void setAdminOf(List<UserAssetsInfo> adminOf) {
		this.adminOf = adminOf;
	}
	public List<UserAssetsInfo> getViewerOf() {
		return viewerOf;
	}
	public void setViewerOf(List<UserAssetsInfo> viewerOf) {
		this.viewerOf = viewerOf;
	}
	public List<UserAssetsInfo> getFollowerOf() {
		return followerOf;
	}
	public void setFollowerOf(List<UserAssetsInfo> followerOf) {
		this.followerOf = followerOf;
	}
	public String getOrgId() {
		return orgId;
	}
	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}
	public UserType getUserType() {
		return userType;
	}
	public void setUserType(UserType userType) {
		this.userType = userType;
	}
	
}
