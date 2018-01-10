package com.graphiti.bean;

import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class Asset {
	
    private String assetId;
	private String assetName;
	private String assetType;
	private String assetContent;
	private String[] tags;
	private String createdBy_id;
	private String createdBy_name;
	private long createdTimestamp;
	private String lastModifiedBy_id;
	private String lastModifiedBy_name;
	private long lastModifiedTimestamp;
	private String[] author_ids;
	private String[] author_names;
	private String[] viewer_ids;
	private String[] viewer_names;
	private String[] admin_ids;
	private String[] admin_names;
	private String[] follower_ids;
	private String[] follower_names;
	private String orgId;
	private String[] dataColumns;
	private String[] associated_business_questions;
	private String asset_description;
	private String[] is_favorited_ids;
	private String[] is_favorited_names;
	private String[] trusted_ids;
	private String[] trusted_names;
	private String[] deprecated_ids;
	private String[] deprecated_names;
	private String[] erroneous_ids;
	private String[] erroneous_names;
	private int number_of_historical_versions;
	private int discoverabilityScore;


	// Const
	public Asset(){
		
	}
	
	// Const
	public Asset(String assetId, String assetName, String assetType,
			String assetContent, String createdBy_id, String createdBy_name,
			String lastModifiedBy_id, String lastModifiedBy_name, String orgId,
			String[] dataColumns, String asset_description,
			int number_of_historical_versions) {
		super();
		this.assetId = assetId;
		this.assetName = assetName;
		this.assetType = assetType;
		if(assetContent!=null){
			this.assetContent = assetContent;
		}
		this.createdBy_id = createdBy_id;
		this.createdBy_name = createdBy_name;
		this.lastModifiedBy_id = lastModifiedBy_id;
		this.lastModifiedBy_name = lastModifiedBy_name;
		this.orgId = orgId;
		if(dataColumns!=null){
			this.dataColumns = dataColumns;
		}
		if(this.asset_description!=null){
			this.asset_description = asset_description;
		}
		this.number_of_historical_versions = number_of_historical_versions;
	}

	public String getAssetId() {
		return assetId;
	}

	public void setAssetId(String assetId) {
		this.assetId = assetId;
	}

	public String getAssetName() {
		return assetName;
	}

	public void setAssetName(String assetName) {
		this.assetName = assetName;
	}

	public String getAssetType() {
		return assetType;
	}

	public void setAssetType(String assetType) {
		this.assetType = assetType;
	}

	public String getAssetContent() {
		return assetContent;
	}

	public void setAssetContent(String assetContent) {
		this.assetContent = assetContent;
	}

	public String[] getTags() {
		return tags;
	}

	public void setTags(String[] tags) {
		this.tags = tags;
	}

	public String getCreatedBy_id() {
		return createdBy_id;
	}

	public void setCreatedBy_id(String createdBy_id) {
		this.createdBy_id = createdBy_id;
	}

	public String getCreatedBy_name() {
		return createdBy_name;
	}

	public void setCreatedBy_name(String createdBy_name) {
		this.createdBy_name = createdBy_name;
	}

	public long getCreatedTimestamp() {
		return createdTimestamp;
	}

	public void setCreatedTimestamp(long createdTimestamp) {
		this.createdTimestamp = createdTimestamp;
	}

	public long getLastModifiedTimestamp() {
		return lastModifiedTimestamp;
	}

	public void setLastModifiedTimestamp(long lastModifiedTimestamp) {
		this.lastModifiedTimestamp = lastModifiedTimestamp;
	}

	public String getLastModifiedBy_id() {
		return lastModifiedBy_id;
	}

	public void setLastModifiedBy_id(String lastModifiedBy_id) {
		this.lastModifiedBy_id = lastModifiedBy_id;
	}

	public String getLastModifiedBy_name() {
		return lastModifiedBy_name;
	}

	public void setLastModifiedBy_name(String lastModifiedBy_name) {
		this.lastModifiedBy_name = lastModifiedBy_name;
	}


	public String[] getAuthor_ids() {
		return author_ids;
	}

	public void setAuthor_ids(String[] author_ids) {
		this.author_ids = author_ids;
	}

	public String[] getAuthor_names() {
		return author_names;
	}

	public void setAuthor_names(String[] author_names) {
		this.author_names = author_names;
	}


	public String[] getViewer_ids() {
		return viewer_ids;
	}

	public void setViewer_ids(String[] viewer_ids) {
		this.viewer_ids = viewer_ids;
	}

	public String[] getViewer_names() {
		return viewer_names;
	}

	public void setViewer_names(String[] viewer_names) {
		this.viewer_names = viewer_names;
	}

	public String[] getAdmin_ids() {
		return admin_ids;
	}

	public void setAdmin_ids(String[] admin_ids) {
		this.admin_ids = admin_ids;
	}

	public String[] getAdmin_names() {
		return admin_names;
	}

	public void setAdmin_names(String[] admin_names) {
		this.admin_names = admin_names;
	}

	public String[] getFollower_ids() {
		return follower_ids;
	}

	public void setFollower_ids(String[] follower_ids) {
		this.follower_ids = follower_ids;
	}

	public String[] getFollower_names() {
		return follower_names;
	}

	public void setFollower_names(String[] follower_names) {
		this.follower_names = follower_names;
	}

	public String getOrgId() {
		return orgId;
	}

	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}

	public String[] getDataColumns() {
		return dataColumns;
	}

	public void setDataColumns(String[] dataColumns) {
		this.dataColumns = dataColumns;
	}

	public String[] getAssociated_business_questions() {
		return associated_business_questions;
	}

	public void setAssociated_business_questions(String[] associated_business_questions) {
		this.associated_business_questions = associated_business_questions;
	}


	public String getAsset_description() {
		return asset_description;
	}

	public void setAsset_description(String asset_description) {
		this.asset_description = asset_description;
	}

	public String[] getIs_favorited_ids() {
		return is_favorited_ids;
	}

	public void setIs_favorited_ids(String[] is_favorited_ids) {
		this.is_favorited_ids = is_favorited_ids;
	}

	public String[] getTrusted_ids() {
		return trusted_ids;
	}

	public void setTrusted_ids(String[] trusted_ids) {
		this.trusted_ids = trusted_ids;
	}

	public String[] getTrusted_names() {
		return trusted_names;
	}

	public void setTrusted_names(String[] trusted_names) {
		this.trusted_names = trusted_names;
	}

	public String[] getDeprecated_ids() {
		return deprecated_ids;
	}

	public void setDeprecated_ids(String[] deprecated_ids) {
		this.deprecated_ids = deprecated_ids;
	}

	public String[] getDeprecated_names() {
		return deprecated_names;
	}

	public void setDeprecated_names(String[] deprecated_names) {
		this.deprecated_names = deprecated_names;
	}

	public String[] getErroneous_ids() {
		return erroneous_ids;
	}

	public void setErroneous_ids(String[] erroneous_ids) {
		this.erroneous_ids = erroneous_ids;
	}

	public String[] getErroneous_names() {
		return erroneous_names;
	}

	public void setErroneous_names(String[] erroneous_names) {
		this.erroneous_names = erroneous_names;
	}

	public String[] getIs_favorited_names() {
		return is_favorited_names;
	}

	public void setIs_favorited_names(String[] is_favorited_names) {
		this.is_favorited_names = is_favorited_names;
	}

	public int getNumber_of_historical_versions() {
		return number_of_historical_versions;
	}

	public void setNumber_of_historical_versions(int number_of_historical_versions) {
		this.number_of_historical_versions = number_of_historical_versions;
	}
	
	public int getDiscoverabilityScore() {
		return discoverabilityScore;
	}

	public void setDiscoverabilityScore(int discoverabilityScore) {
		this.discoverabilityScore = discoverabilityScore;
	}
}
