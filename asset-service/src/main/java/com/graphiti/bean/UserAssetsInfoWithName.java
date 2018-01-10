package com.graphiti.bean;

/**
 * This has UserAssetsInfo
 * 
 * @author 
 *
 */
public class UserAssetsInfoWithName {
	
	private String id;
	private String name;
	private AssetType assetType; // Type of asset
	
	public String getAssetName() {
		return name;
	}

	public void setAssetName(String name) {
		this.name = name;
	}
	
	// Constructor
	public UserAssetsInfoWithName(String id,String name,AssetType t){
		this.id = id;
		this.name = name;
		this.assetType = t;
	}
	
	// Default Contructors
	public UserAssetsInfoWithName(){
		
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public AssetType getAssetType() {
		return assetType;
	}

	public void setAssetType(AssetType assetType) {
		this.assetType = assetType;
	}
}