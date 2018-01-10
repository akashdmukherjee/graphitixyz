package com.graphiti.bean;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This has UserAssets with Name of assets 
 * 
 * @author yashvardhanjain
 *
 */

public class UserAssetsWithAssetName {
	
	private String id;
	private List<UserAssetsInfoWithName> creatorOf;
	private List<UserAssetsInfoWithName> authorOf;
	private List<UserAssetsInfoWithName> adminOf;
	private List<UserAssetsInfoWithName> viewerOf;
	
	private String orgId;
	private UserType userType;
	
	// Default Constructor
	public UserAssetsWithAssetName(){
		creatorOf = new ArrayList<>(1);
		authorOf = new ArrayList<>(1); 
		adminOf = new ArrayList<>(1);
		viewerOf = new ArrayList<>(1);
	}
	
	// Constructor
	public UserAssetsWithAssetName(String id,String orgId,UserType type){
		this.id = id;
		this.orgId = orgId;
		this.userType = type;
		creatorOf = new ArrayList<>(1);
		authorOf = new ArrayList<>(1); 
		adminOf = new ArrayList<>(1);
		viewerOf = new ArrayList<>(1);
	}
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public List<UserAssetsInfoWithName> getCreatorOf() {
		return creatorOf;
	}
	public void setCreatorOf(List<UserAssetsInfoWithName> creatorOf) {
		this.creatorOf = creatorOf;
	}
	public List<UserAssetsInfoWithName> getAuthorOf() {
		return authorOf;
	}
	public void setAuthorOf(List<UserAssetsInfoWithName> authorOf) {
		this.authorOf = authorOf;
	}
	public List<UserAssetsInfoWithName> getAdminOf() {
		return adminOf;
	}
	public void setAdminOf(List<UserAssetsInfoWithName> adminOf) {
		this.adminOf = adminOf;
	}
	public List<UserAssetsInfoWithName> getViewerOf() {
		return viewerOf;
	}
	public void setViewerOf(List<UserAssetsInfoWithName> viewerOf) {
		this.viewerOf = viewerOf;
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