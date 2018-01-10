package com.graphiti.bean;

public class FAQ {
	private String id;
	private String question;
	private String answer;
	private long createdTimestamp;
	private AssetUsersInfo creator;

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
	public String getQuestion() {
		return question;
	}
	public void setQuestion(String question) {
		this.question = question;
	}
	public String getAnswer() {
		return answer;
	}
	public void setAnswer(String answer) {
		this.answer = answer;
	}
	public long getCreatedTimestamp() {
		return createdTimestamp;
	}
	public void setCreatedTimestamp(long createdTimestamp) {
		this.createdTimestamp = createdTimestamp;
	}
	
}
