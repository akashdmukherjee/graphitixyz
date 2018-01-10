package com.graphiti.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLAsset;


@Repository
public class Repo {
	
	@Autowired
	MongoTemplate mongoTemplate;
	
	
	/**
	 * Get Orgs related details
	 * @param arrayOfOrgIds
	 * @return
	 */
	public Map<String,Organization> getMapOfOrganizationAndCorrespondingOrgObject(String[] arrayOfOrgIds){
		Query searchQuery = new Query();
		if(arrayOfOrgIds==null){
			// Get all the records of Organization
		}
		else{
			searchQuery.addCriteria(Criteria.where("_id").in(arrayOfOrgIds));
		}
		// Only need _id and searchCollectionName 
		searchQuery.fields().include("_id").include("searchCollectionName").include("s3BucketName"); 
		List<Organization> organizationList = mongoTemplate.find(searchQuery, Organization.class, "Organizations");
		Map<String,Organization> mapOfOrganizationListAndCorrespondingOrgObject = new HashMap<String,Organization>();
		for(Organization organization:organizationList){
			mapOfOrganizationListAndCorrespondingOrgObject.put(organization.getId(), organization);
		}
		return mapOfOrganizationListAndCorrespondingOrgObject;
	}
	
	/**
	 * Get AssetUsers details
	 * 
	 */
	public List<AssetUsers> getAssetUsersForASpecificOrg(String organizationId){
		Query searchQuery = new Query();
		searchQuery.addCriteria(Criteria.where("orgId").is(organizationId));
		List<AssetUsers> assetUsersList = mongoTemplate.find(searchQuery, AssetUsers.class, "AssetUsers");
		return assetUsersList;
		
	}
	
	/**
	 * Get DataAsset details based on id
	 */
	public DataSet getDataAsset(String id,String orgId){
		Query query = new Query(new Criteria().andOperator(Criteria.where("_id").is(id),Criteria.where("orgId").is(orgId)));
		query.fields().include("columnNamesInCache").include("orgId").include("_id");
		DataSet datasetAsset = mongoTemplate.findOne(query, DataSet.class,"DataSetAsset");
		return datasetAsset;
	}
	
	/**
	 * Get SQLAsset details based on id
	 */
	public SQLAsset getSQLAsset(String id,String orgId){
		// TODO - Need to add orgId to SQLAsset
		Query query = new Query(new Criteria().andOperator(Criteria.where("_id").is(id)));
		query.fields().include("linkOfS3").include("_id").include("versionNumber");
		SQLAsset sqlAsset = mongoTemplate.findOne(query, SQLAsset.class,"SQLAsset");
		return sqlAsset;
	}
	
	
	/**
	 * Get Map of tableName and corresponding assetName
	 * 
	 */
	public Map<String,String> getMapOfTableNameAndAssetName(String organizationId,List<String> listOfTableName){
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for(String nameOfAsset:listOfTableName){
			Criteria criteria = Criteria.where("cacheTableName").is(nameOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		searchQuery.addCriteria(new Criteria().andOperator(
												Criteria.where("orgId").is(organizationId), new Criteria()
												.orOperator(arrayListOfCriteria
														.toArray(new Criteria[arrayListOfCriteria.size()]))));
		List<DataSet> listOfDataSet = mongoTemplate.find(searchQuery, DataSet.class, "DataSetAsset");
		Map<String,String> mapOfTableNamesAndCorrespondingAssetName = new HashMap<String,String>();
		for(DataSet dataSet : listOfDataSet){
			mapOfTableNamesAndCorrespondingAssetName.put(dataSet.getCacheTableName(), dataSet.getName());
		}
		return mapOfTableNamesAndCorrespondingAssetName;
	}
}
