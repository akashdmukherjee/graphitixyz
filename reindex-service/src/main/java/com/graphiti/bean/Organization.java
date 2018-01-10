package com.graphiti.bean;

import java.util.ArrayList;

import javax.xml.bind.annotation.XmlRootElement;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "organizations")
@XmlRootElement
public class Organization {
	private String id;
	private String name;
	private String emailDomain;
	private String dnsDomain;
	private int orgSize;
	private String[] interestedFeatures;
	private long unixTSOfOrgCreation;
	private String cacheDatabaseName;
	private String searchCollectionName;
	private String s3BucketName;
	
	public String getId() {
		return this.id;
	}
	
	public void setId(String id) {
		this.id = id;
	}
	
	public String getName() {
		return this.name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public String getEmailDomain() {
		return this.emailDomain;
	}
	
	public void setEmailDomain(String emailDomain) {
		this.emailDomain = emailDomain;
	}

	public String getDnsDomain() {
		return dnsDomain;
	}

	public void setDnsDomain(String dnsDomain) {
		this.dnsDomain = dnsDomain;
	}

	public long getUnixTSOfOrgCreation() {
		return this.unixTSOfOrgCreation;
	}
	
	public void setUnixTSOfOrgCreation(long unixTSOfOrgCreation) {
		this.unixTSOfOrgCreation = unixTSOfOrgCreation;
	}

	public String[] getInterestedFeatures() {
		return interestedFeatures;
	}

	public void setInterestedFeatures(String[] interestedFeatures) {
		this.interestedFeatures = interestedFeatures;
	}

	public int getOrgSize() {
		return orgSize;
	}

	public void setOrgSize(int orgSize) {
		this.orgSize = orgSize;
	}

	public String getCacheDatabaseName() {
		return cacheDatabaseName;
	}

	public void setCacheDatabaseName(String cacheDatabaseName) {
		this.cacheDatabaseName = cacheDatabaseName;
	}

	public String getSearchCollectionName() {
		return searchCollectionName;
	}

	public void setSearchCollectionName(String searchCollectionName) {
		this.searchCollectionName = searchCollectionName;
	}

	public String getS3BucketName() {
		return s3BucketName;
	}

	public void setS3BucketName(String s3BucketName) {
		this.s3BucketName = s3BucketName;
	}
}
