package com.graphiti.bean;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This is for storing AssetUser information
 *  
 * 
 * @author 
 *
 */

@Document(collection = "AssetUsers")
@XmlRootElement
public class AssetUsers {
	
	private String id;
	private String name;
	private AssetUsersInfo creator;
	private List<AssetUsersInfo> authors;
	private List<AssetUsersInfo> viewers;
	private List<AssetUsersInfo> followers;
	private List<AssetUsersInfo> admins;
	private List<AssetUsersInfo> favorites;
	private AssetType assetType;
	private String orgId;
	private String assetContent;
	private List<String> tags;
	private String associated_business_questions;
	private String asset_description;
	private List<Note> notes;
	private List<FAQ> faqs;
	private long createdEpochTime;
	private long lastModifiedEpochTime;
	private AssetUsersInfo lastModifiedBy;
	
	// Constructor - This constructor will basically be called when
	// are trying to create the asset for the first time
	public AssetUsers(String name,AssetType t,AssetUsersInfo creator,String orgId){
		this.name = name;
		this.assetType = t;
		this.creator = creator;
		this.lastModifiedBy = creator; // Since the creator is the last person who has modified it
		this.createdEpochTime = Instant.EPOCH.getEpochSecond();
		this.lastModifiedEpochTime = this.createdEpochTime; // Both creation time and last modified time are same
		authors = new ArrayList<>(1);
		viewers = new ArrayList<>(1);
		followers = new ArrayList<>(1);
		admins = new ArrayList<>(1);
		this.orgId = orgId;
	}
	
	// Dummy default Contructor
	public AssetUsers(){
		authors = new ArrayList<>(1);
		viewers = new ArrayList<>(1);
		followers = new ArrayList<>(1);
		admins = new ArrayList<>(1);
	}

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

	public List<AssetUsersInfo> getFavorites() {
		return favorites;
	}

	public void setFavorites(List<AssetUsersInfo> favorites) {
		this.favorites = favorites;
	}

	public AssetType getAssetType() {
		return assetType;
	}

	public void setAssetType(AssetType assetType) {
		this.assetType = assetType;
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

	public String getOrgId() {
		return orgId;
	}

	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}

	public long getCreatedEpochTime() {
		return createdEpochTime;
	}

	public void setCreatedEpochTime(long createdEpochTime) {
		this.createdEpochTime = createdEpochTime;
	}

	public long getLastModifiedEpochTime() {
		return lastModifiedEpochTime;
	}

	public void setLastModifiedEpochTime(long lastModifiedEpochTime) {
		this.lastModifiedEpochTime = lastModifiedEpochTime;
	}

	public AssetUsersInfo getLastModifiedBy() {
		return lastModifiedBy;
	}

	public void setLastModifiedBy(AssetUsersInfo lastModifiedBy) {
		this.lastModifiedBy = lastModifiedBy;
	}
	
}