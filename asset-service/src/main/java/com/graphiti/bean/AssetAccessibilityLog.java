package com.graphiti.bean;


import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This is for storing AssetUser information
 * 
 * @author 
 *
 */
@Document(collection = "AssetAccessibilityLog")
@XmlRootElement
public class AssetAccessibilityLog {
	
	@Id
	private String assetId;
	private String orgId;
	private List<UserAccessibilityCountInfo> viewers;
	private List<UserAccessibilityCountInfo> editors;
	
	public AssetAccessibilityLog(String assetId,String orgId){
		this.assetId = assetId;
		this.orgId = orgId;
		viewers = new ArrayList<UserAccessibilityCountInfo>(1);
		editors = new ArrayList<UserAccessibilityCountInfo>(1);
	}
	
	public String getAssetId() {
		return assetId;
	}
	public void setAssetId(String assetId) {
		this.assetId = assetId;
	}
	public String getOrgId() {
		return orgId;
	}

	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}

	public List<UserAccessibilityCountInfo> getViewers() {
		return viewers;
	}
	public void setViewers(List<UserAccessibilityCountInfo> viewers) {
		this.viewers = viewers;
	}
	public List<UserAccessibilityCountInfo> getEditors() {
		return editors;
	}
	public void setEditors(List<UserAccessibilityCountInfo> editors) {
		this.editors = editors;
	}
	
}