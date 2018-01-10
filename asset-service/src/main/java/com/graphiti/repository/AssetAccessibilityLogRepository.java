package com.graphiti.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;
import com.graphiti.bean.AccessibilityLogType;
import com.graphiti.bean.AssetAccessibilityLog;
import com.graphiti.bean.UserAccessibilityCountInfo;
import com.mongodb.WriteResult;


@Repository
public class AssetAccessibilityLogRepository {

	@Autowired 
	MongoTemplate mongoTemplate;
	
	Logger logger = LoggerFactory.getLogger(AssetAccessibilityLogRepository.class);
	
	public void save(String graphiti_tid,String memberId,String memberName,String orgId,String assetId,AccessibilityLogType assetAccessibilityLogType){
		// First lets find if there is an entry for this asset in 
		// AssetAccessibilityLog collection
		Criteria searchCriteria = new Criteria().andOperator(
									  Criteria.where("orgId").is(orgId), 
									  Criteria.where("_id").is(assetId));
		Query query = new Query();
		query = query.addCriteria(searchCriteria);
		AssetAccessibilityLog assetAccessibilityLog = mongoTemplate.findOne(query,AssetAccessibilityLog.class,"AssetAccessibilityLog");
		if(assetAccessibilityLog==null){ // No entry in database
			assetAccessibilityLog = new AssetAccessibilityLog(assetId,orgId);
		}
		if(assetAccessibilityLogType.getValue().equalsIgnoreCase(AccessibilityLogType.VIEWERS.getValue())){
			// First we have to search if there is an entry
			// for this specific memberId already. If that is the case then
			// we just increment the count, otherwise we have to create a new 
			// entry altogether for this user and initialize the count by 1
			boolean isUserPresent = false;
			for(UserAccessibilityCountInfo obj : assetAccessibilityLog.getViewers()){
				if(obj.getUserId().equalsIgnoreCase(memberId)){ // If present
					obj.setCount(obj.getCount()+1); // then increase the count by 1
					isUserPresent = true;
					break;
				}
			}
			if(isUserPresent == false){ // If not present then create a new one with count value initialized to 1
				UserAccessibilityCountInfo newUserInfoObj = new UserAccessibilityCountInfo(memberId,memberName,1);
				assetAccessibilityLog.getViewers().add(newUserInfoObj);
			}
		}
		else if (assetAccessibilityLogType.getValue().equalsIgnoreCase(AccessibilityLogType.EDITORS.getValue())){
			// First we have to search if there is an entry
			// for this specific memberId already. If that is the case then
			// we just increment the count, otherwise we have to create a new 
			// entry altogether for this user and initialize the count by 1
			boolean isUserPresent = false;
			for(UserAccessibilityCountInfo obj : assetAccessibilityLog.getEditors()){
				if(obj.getUserId().equalsIgnoreCase(memberId)){ // If present
					obj.setCount(obj.getCount()+1); // then increase the count by 1
					isUserPresent = true;
					break;
				}
			}
			if(isUserPresent == false){ // If not present then create a new one with count value initialized to 1
				UserAccessibilityCountInfo newUserInfoObj = new UserAccessibilityCountInfo(memberId,memberName,1);
				assetAccessibilityLog.getEditors().add(newUserInfoObj);
			}
		}
		mongoTemplate.save(assetAccessibilityLog);
	}
	
	public void deleteAssetInformation(String graphiti_tid,String assetId,String orgId){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		WriteResult result = mongoTemplate.remove(searchQuery, AssetAccessibilityLog.class, "AssetAccessibilityLog");
		if(result.getN() != 1){
			logger.error("graphiti-tid:{}.No document was deleted for asset with Id:{}",graphiti_tid,assetId);
		}
	}
	
	public AssetAccessibilityLog get(String graphiti_tid,String assetId,String orgId){
		Criteria searchCriteria = new Criteria().andOperator(
				  Criteria.where("orgId").is(orgId), 
				  Criteria.where("_id").is(assetId));
		Query query = new Query();
		query = query.addCriteria(searchCriteria);
		AssetAccessibilityLog assetAccessibilityLog = mongoTemplate.findOne(query,AssetAccessibilityLog.class,"AssetAccessibilityLog");
		return assetAccessibilityLog;
	}
}
