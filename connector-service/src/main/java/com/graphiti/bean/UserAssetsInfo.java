package com.graphiti.bean;

/**
 * This has UserAssetsInfo
 * 
 * @author 
 *
 */
public class UserAssetsInfo {
	
	private String id;
	private AssetType assetType; // Type of asset
	
	// Constructor
	public UserAssetsInfo(String id,AssetType t){
		this.id = id;
		this.assetType = t;
	}
	
	// Default Contructors
	public UserAssetsInfo(){
		
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
