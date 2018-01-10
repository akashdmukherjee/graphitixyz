package com.graphiti.bean;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonProperty;

@XmlRootElement
public class AssetDetailedInformation {

	private String memberId; // this is the member id
	private String memberName; // name of the team or the user
	private UserType usertype;
	private String assetId; // this is the assetId
	private String assetName; // name of the asset
	// Set this only when there is a custom name for dataAsset and both
	// SQLAsset and DataAsset are being saved together
	private String dataAssetName; 
	private AssetUsersInfo creator;
	private List<AssetUsersInfo> authors;
	private List<AssetUsersInfo> viewers;
	private List<AssetUsersInfo> followers;
	private List<AssetUsersInfo> admins;
	private List<AssetUsersInfo> favorites;
	private List<Note> notes;
	private List<FAQ> faqs;
	private AssetType assetType;
	private String cacheTableName;
	private DataSourceType dataSourceType;
	private String uploadFileName;
	@JsonProperty
	private List<String> columnNamesInCache;
	private String connectionId;
	private String orgId;
	private String assetContent;
	private List<String> tags;
	private List<String> dataColumns;
	private String associated_business_questions;
	private String asset_description;
	private int number_of_historical_versions;
	private String linkOfS3;
	private List<String> sourceAssetIds; 
	private ChartConfigs chartConfigs;


	// Default Constructor
	public AssetDetailedInformation() {

	}

	// Const
	public AssetDetailedInformation(String memberId, String memberName, UserType usertype, String assetName,
			AssetType assetType, String cacheTableName, DataSourceType dataSourceType, String uploadFileName,
			List<String> columnNamesInCache, String connectionId, String orgId, String linkOfS3) {
		super();
		this.memberId = memberId;
		this.memberName = memberName;
		this.usertype = usertype;
		if(assetName !=null){
			this.assetName = assetName;
		}
		this.assetType = assetType;
		if(cacheTableName!=null){
			this.cacheTableName = cacheTableName;
		}
		this.dataSourceType = dataSourceType;
		if(uploadFileName != null){
			this.uploadFileName = uploadFileName;
		}
		if(columnNamesInCache!=null){
			this.columnNamesInCache = columnNamesInCache;
		}
		if (connectionId != null) {
			this.connectionId = connectionId;
		}
		this.orgId = orgId;
		if(linkOfS3!=null) {
			this.linkOfS3 = linkOfS3;
		}
	}

	// Used in AssetPermissions
	public AssetDetailedInformation(List<AssetUsersInfo> admins, List<AssetUsersInfo> authors,
			List<AssetUsersInfo> viewers, List<AssetUsersInfo> followers,
			String orgId, String assetId, String memberId, String memberName) {
		this.admins = admins;
		this.followers = followers;
		this.viewers = viewers;
		this.authors = authors;
		this.orgId = orgId;
		this.assetId = assetId;
		this.memberId = memberId;
		this.memberName = memberName;
	}

	public String getMemberId() {
		return memberId;
	}

	public void setMemberId(String memberId) {
		this.memberId = memberId;
	}

	public String getMemberName() {
		return memberName;
	}

	public void setMemberName(String memberName) {
		this.memberName = memberName;
	}

	public UserType getUsertype() {
		return usertype;
	}

	public void setUsertype(UserType usertype) {
		this.usertype = usertype;
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

	public String getDataAssetName() {
		return dataAssetName;
	}

	public void setDataAssetName(String dataAssetName) {
		this.dataAssetName = dataAssetName;
	}

	public AssetUsersInfo getCreator() {
		return creator;
	}

	public void setCreator(AssetUsersInfo creator) {
		this.creator = creator;
	}

	public List<AssetUsersInfo> getAuthors() {
		return authors;
	}

	public void setAuthors(List<AssetUsersInfo> authors) {
		this.authors = authors;
	}

	public List<AssetUsersInfo> getViewers() {
		return viewers;
	}

	public void setViewers(List<AssetUsersInfo> viewers) {
		this.viewers = viewers;
	}

	public List<AssetUsersInfo> getFollowers() {
		return followers;
	}

	public void setFollowers(List<AssetUsersInfo> followers) {
		this.followers = followers;
	}

	public List<AssetUsersInfo> getAdmins() {
		return admins;
	}

	public void setAdmins(List<AssetUsersInfo> admins) {
		this.admins = admins;
	}

	public AssetType getAssetType() {
		return assetType;
	}

	public void setAssetType(AssetType assetType) {
		this.assetType = assetType;
	}

	public String getCacheTableName() {
		return cacheTableName;
	}

	public void setCacheTableName(String cacheTableName) {
		this.cacheTableName = cacheTableName;
	}

	public DataSourceType getDataSourceType() {
		return dataSourceType;
	}

	public void setDataSourceType(DataSourceType dataSourceType) {
		this.dataSourceType = dataSourceType;
	}

	public String getUploadFileName() {
		return uploadFileName;
	}

	public void setUploadFileName(String uploadFileName) {
		this.uploadFileName = uploadFileName;
	}

	public List<String> getColumnNamesInCache() {
		return columnNamesInCache;
	}

	public void setColumnNamesInCache(List<String> columnNamesInCache) {
		this.columnNamesInCache = columnNamesInCache;
	}

	public List<String> getSourceAssetIds() {
		return sourceAssetIds;
	}

	public void setSourceAssetIds(List<String> sourceAssetIds) {
		this.sourceAssetIds = sourceAssetIds;
	}

	public String getConnectionId() {
		return connectionId;
	}

	public void setConnectionId(String connectionId) {
		this.connectionId = connectionId;
	}

	public String getOrgId() {
		return orgId;
	}

	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}

	public String getAssetContent() {
		return assetContent;
	}

	public void setAssetContent(String assetContent) {
		this.assetContent = assetContent;
	}

	public List<String> getTags() {
		return tags;
	}

	public void setTags(List<String> tags) {
		this.tags = tags;
	}

	public List<String> getDataColumns() {
		return dataColumns;
	}

	public void setDataColumns(List<String> dataColumns) {
		this.dataColumns = dataColumns;
	}

	public String getAssociated_business_questions() {
		return associated_business_questions;
	}

	public void setAssociated_business_questions(String associated_business_questions) {
		this.associated_business_questions = associated_business_questions;
	}

	public String getAsset_description() {
		return asset_description;
	}

	public void setAsset_description(String asset_description) {
		this.asset_description = asset_description;
	}
	
	public int getNumber_of_historical_versions() {
		return number_of_historical_versions;
	}

	public void setNumber_of_historical_versions(int number_of_historical_versions) {
		this.number_of_historical_versions = number_of_historical_versions;
	}

	public String getLinkOfS3() {
		return linkOfS3;
	}

	public void setLinkOfS3(String linkOfS3) {
		this.linkOfS3 = linkOfS3;
	}

	public List<AssetUsersInfo> getFavorites() {
		return favorites;
	}

	public void setFavorites(List<AssetUsersInfo> favorites) {
		this.favorites = favorites;
	}

	public List<Note> getNotes() {
		return notes;
	}

	public void setNotes(List<Note> notes) {
		this.notes = notes;
	}

	public List<FAQ> getFaqs() {
		return faqs;
	}

	public void setFaqs(List<FAQ> faqs) {
		this.faqs = faqs;
	}

	public ChartConfigs getChartConfigs() {
		return chartConfigs;
	}

	public void setChartConfigs(ChartConfigs chartConfigs) {
		this.chartConfigs = chartConfigs;
	}
}
