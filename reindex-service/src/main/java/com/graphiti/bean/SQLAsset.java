package com.graphiti.bean;

import java.util.ArrayList;

import javax.xml.bind.annotation.XmlRootElement;

import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Data Set Details
 * 
 * @author 
 *
 */
@Document(collection = "SQLAsset")
@XmlRootElement
public class SQLAsset {

	private String id;
	private String name;
	private String linkOfS3; // This is the link to the latest S3 file
	private DataSourceType sourceType;
	private String connectionId; // only required when we are getting data from database
	private String uploadFileName; // This is only the name of the upload file. Needs to be set incase of manual upload
	private RelatedAssets relatedAssets = new RelatedAssets();
	private ArrayList<String> olderVersionLinks; 
	private int versionNumber;
	
	// Default Contructor
	public SQLAsset(){
		olderVersionLinks = new ArrayList<String>(10);
	}
	
	public SQLAsset(String id, String name, String linkOfS3,
			DataSourceType sourceType, String connectionId,
			String uploadFileName) {
		super();
		this.id = id;
		this.name = name;
		this.linkOfS3 = linkOfS3;
		this.sourceType = sourceType;
		if(connectionId!=null){
			this.connectionId = connectionId;
		}
		if(uploadFileName==null){
			this.uploadFileName = uploadFileName;
		}
		olderVersionLinks = new ArrayList<String>(10);
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

	public String getLinkOfS3() {
		return linkOfS3;
	}

	public void setLinkOfS3(String linkOfS3) {
		this.linkOfS3 = linkOfS3;
	}

	public DataSourceType getSourceType() {
		return sourceType;
	}

	public void setSourceType(DataSourceType sourceType) {
		this.sourceType = sourceType;
	}

	public String getConnectionId() {
		return connectionId;
	}

	public void setConnectionId(String connectionId) {
		this.connectionId = connectionId;
	}

	public String getUploadFileName() {
		return uploadFileName;
	}

	public void setUploadFileName(String uploadFileName) {
		this.uploadFileName = uploadFileName;
	}

	public RelatedAssets getRelatedAssets() {
		return relatedAssets;
	}

	public void setRelatedAssets(RelatedAssets relatedAssets) {
		this.relatedAssets = relatedAssets;
	}

	public ArrayList<String> getOlderVersionLinks() {
		return olderVersionLinks;
	}

	public void setOlderVersionLinks(ArrayList<String> olderVersionLinks) {
		this.olderVersionLinks = olderVersionLinks;
	}

	public int getVersionNumber() {
		return versionNumber;
	}

	public void setVersionNumber(int versionNumber) {
		this.versionNumber = versionNumber;
	}	
}
