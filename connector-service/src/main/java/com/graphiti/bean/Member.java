package com.graphiti.bean;

import java.util.ArrayList;

import javax.xml.bind.annotation.XmlRootElement;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "Members")
@XmlRootElement
public class Member {
	// This will be set programatically and auto generated
	private String id;
	private String emailAddress;
	private String fullName;
	private String password;
	private String hashedPassword;
	private String salt;
	private String verificationURL;
	private String verificationKey;
	private long unixTSOfUpdOfVeriURL; // This is used so as to check if the verificationURL is valid or invalid
	private String verificationStatus;
	private String organizationId;
	
	
	public String getHashedPassword() {
		return hashedPassword;
	}
	public String getSalt() {
		return salt;
	}
	private ArrayList<TeamMember> teams = new ArrayList<>(1);

	public ArrayList<TeamMember> getTeams() {
		return teams;
	}
	public void setTeams(ArrayList<TeamMember> teams) {
		this.teams = teams;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getEmailAddress() {
		return emailAddress;
	}
	public void setEmailAddress(String emailAddress) {
		this.emailAddress = emailAddress;
	}
	public String getFullName() {
		return fullName;
	}
	public void setFullName(String fullName) {
		this.fullName = fullName;
	}
	
	/**
	 * We have to keep this getter since 
	 * we need to access what user has sent
	 * when he is sending for the first time
	 * @return
	 */
	public String getPassword() {
		return password;
	}
	
	public void setPassword(String password) {
		this.password = password;
	}
	
	public void setHashedPassword(String hashedPassword){
		this.hashedPassword = hashedPassword;
	}
	
	public void setSalt(String salt){
		this.salt = salt;
	}
	
	public String getVerificationURL() {
		return verificationURL;
	}
	public void setVerificationURL(String verificationURL) {
		this.verificationURL = verificationURL;
	}
	public String getVerificationKey() {
		return verificationKey;
	}
	public void setVerificationKey(String verificationKey) {
		this.verificationKey = verificationKey;
	}
	public long getUnixTSOfUpdOfVeriURL() {
		return unixTSOfUpdOfVeriURL;
	}
	public void setUnixTSOfUpdOfVeriURL(long unixTSOfUpdOfVeriURL) {
		this.unixTSOfUpdOfVeriURL = unixTSOfUpdOfVeriURL;
	}
	public String getVerificationStatus() {
		return verificationStatus;
	}
	public void setVerificationStatus(String verificationStatus) {
		this.verificationStatus = verificationStatus;
	}
	public String getOrganizationId() {
		return organizationId;
	}
	public void setOrganizationId(String organizationId) {
		this.organizationId = organizationId;
	}
}
