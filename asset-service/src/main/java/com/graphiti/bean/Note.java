package com.graphiti.bean;

public class Note {
	private String id;
	private String content;
	private long createdTimestamp;
	private AssetUsersInfo creator;

	public String getContent() {
		return content;
	}
	public void setContent(String content) {
		this.content = content;
	}
	public long getCreatedTimestamp() {
		return createdTimestamp;
	}
	public void setCreatedTimestamp(long createdTimestamp) {
		this.createdTimestamp = createdTimestamp;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public AssetUsersInfo getCreator() {
		return creator;
	}
	public void setCreator(AssetUsersInfo creator) {
		this.creator = creator;
	}
}
