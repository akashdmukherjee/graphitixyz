package com.graphiti.bean;

import java.util.ArrayList;

import javax.xml.bind.annotation.XmlRootElement;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection="Teams")
@XmlRootElement
public class Team {
	private String id;
	private String name;
	private ArrayList<TeamMember> members = new ArrayList<>(1);
	private String organizationId;
	
	public Team() {
	}
	
	public ArrayList<TeamMember> getMembers() {
		return members;
	}
	public void setMembers(ArrayList<TeamMember> members) {
		this.members = members;
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
	public String getOrganizationId() {
		return organizationId;
	}
	public void setOrganizationId(String organizationId) {
		this.organizationId = organizationId;
	}
}
