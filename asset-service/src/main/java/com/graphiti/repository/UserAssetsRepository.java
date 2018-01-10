package com.graphiti.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.graphiti.bean.AssetType;
import com.graphiti.bean.Member;
import com.graphiti.bean.PrivilegesType;
import com.graphiti.bean.TeamMember;
import com.graphiti.bean.User;
import com.graphiti.bean.UserAssets;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.bean.UserAssetsInfoWithName;
import com.graphiti.bean.UserAssetsWithAssetName;
import com.graphiti.bean.UserType;
import com.graphiti.exceptions.AssetNotFoundException;
import com.graphiti.exceptions.GenericInternalServerErrorException;
import com.graphiti.exceptions.UserNotFoundException;
import com.graphiti.externalServices.IdentityService;
import com.mongodb.WriteResult;


@Repository
public class UserAssetsRepository {

	@Autowired
	MongoTemplate mongoTemplate;
	
	@Autowired
	AssetUsersRepository assetUsersRepository;
	
	
	Logger logger = LoggerFactory.getLogger(UserAssetsRepository.class);
	
	public void save(String graphiti_tid,String memberId,UserAssets asset){
		logger.info("graphiti_tid:{}. Creating a UserAsset entry",graphiti_tid);
		mongoTemplate.save(asset);
		logger.info("graphiti_tid:{}. Created an entry in UserAsset Collection for user with id:{} ",graphiti_tid,memberId);
		return ;
	}
	
	/**
	 * 
	 * @param graphiti_tid
	 * @param memberId
	 * @param orgId
	 * @param userType
	 * @param creatorOfAsset
	 */
	public void addUserAsCreatorOfAsset(String graphiti_tid, String memberId,String orgId,UserType userType,
			UserAssetsInfo creatorOfAsset) {
		// Adding the assetInformation into creator list
		logger.info("graphiti_tid:{}. Adding information with respect to creatorOfAsset for member with Id:{}",graphiti_tid,memberId);
		// First find in the UserAssets collection if there is an entry for the user with id memberId
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId),Criteria.where("orgId").is(orgId)));
		searchQuery.fields().include("creatorOf");
		UserAssets userAssets = mongoTemplate.findOne(searchQuery, UserAssets.class, "UserAssets");
		if(userAssets==null){ // if no entry
			// first time creation
			userAssets = new UserAssets(memberId,orgId,userType);
			userAssets.getCreatorOf().add(creatorOfAsset);
			mongoTemplate.save(userAssets);
		}
		else{ // Just add 
			List<UserAssetsInfo> listOfCreatedAssets = userAssets.getCreatorOf();
			if(listOfCreatedAssets==null){
				// If list is emp
				listOfCreatedAssets = new ArrayList<UserAssetsInfo>();
			}
			listOfCreatedAssets.add(creatorOfAsset);
			mongoTemplate.updateFirst(searchQuery,Update.update("creatorOf",listOfCreatedAssets),UserAssets.class,"UserAssets");
		}
		logger.info("graphiti_tid:{}. Added information with respect to creatorOfAsset for member with Id:{}",graphiti_tid,memberId);
		
	}
	
	/**
	 * This is used to remove assetInformation from a user
	 * @param graphiti_tid
	 * @param userId - This can be a TEAM or a normal user also
	 * @param assetId
	 * @param orgId
	 * @param concernedField
	 */
	public void removeAssetInformationForUser(String graphiti_tid,String userId,String assetId,String orgId,String concernedField){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(userId),Criteria.where("orgId").is(orgId)));
		UserAssets userAssets = mongoTemplate.findOne(searchQuery, UserAssets.class, "UserAssets");
		List<UserAssetsInfo> userAssetInfoList = null;
		// TODO - Use Reflections if possible here
		if(concernedField.equalsIgnoreCase(PrivilegesType.ADMIN.getValue())){
			userAssetInfoList = userAssets.getAdminOf();
		}
		else if(concernedField.equalsIgnoreCase(PrivilegesType.VIEWER.getValue())){
			userAssetInfoList = userAssets.getViewerOf();
		}
		else if(concernedField.equalsIgnoreCase(PrivilegesType.AUTHOR.getValue())){
			userAssetInfoList = userAssets.getAuthorOf();
		}
		else if(concernedField.equalsIgnoreCase(PrivilegesType.CREATOR.getValue())){
			userAssetInfoList = userAssets.getCreatorOf();
		}
		int iterator = 0;
		for(iterator=0;iterator<userAssetInfoList.size();iterator++){
			if(userAssetInfoList.get(iterator).getId().equalsIgnoreCase(assetId)){ // if assetId matches
				break;
			}
		}
		if(iterator<userAssetInfoList.size()){
			userAssetInfoList.remove(iterator);
		}
		Update update = new Update();
		update.set(concernedField+"Of",userAssetInfoList); // The Of is added
		WriteResult result = mongoTemplate.updateFirst(searchQuery,update,UserAssets.class,"UserAssets");
		if(result.getN() != 1){
			logger.error("graphiti-tid:{}.No document was updated for asset with Id:{}",graphiti_tid,assetId);
		}
	}
	
	/**
	 * 
	 * @param graphiti_tid
	 * @param userId - This can be a TEAM or a normal user also
	 * @param assetId
	 * @param orgId
	 * @param concernedField
	 */
	public void addAssetInformationForUser(String graphiti_tid,String userId,String assetId,String orgId,String concernedField,AssetType assetType){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(userId),Criteria.where("orgId").is(orgId)));
		UserAssets userAssets = mongoTemplate.findOne(searchQuery, UserAssets.class, "UserAssets");
		// There has not been any entry for the user(member/team) in UserAssets. 
		// This case might arise when there is a team who is being 
		// given permission for the first time for any asset
		if(userAssets==null){ 
			// Create a new UserAssets
			IdentityService identityService = new IdentityService();
			User user = identityService.getUser(userId, graphiti_tid);
			if(user.getType().equalsIgnoreCase(UserType.MEMBER.toString())){
				userAssets = new UserAssets(userId, orgId, UserType.MEMBER);
			}
			else if(user.getType().equalsIgnoreCase(UserType.TEAM.toString())){
				userAssets = new UserAssets(userId, orgId, UserType.TEAM);
			}
		} 
		List<UserAssetsInfo> userAssetInfoList = null;
		// TODO - Use Reflections if possible here
		if(concernedField.equalsIgnoreCase(PrivilegesType.ADMIN.getValue())){
			userAssetInfoList = userAssets.getAdminOf();
		}
		else if(concernedField.equalsIgnoreCase(PrivilegesType.VIEWER.getValue())){
			userAssetInfoList = userAssets.getViewerOf();
		}
		else if(concernedField.equalsIgnoreCase(PrivilegesType.AUTHOR.getValue())){
			userAssetInfoList = userAssets.getAuthorOf();
		}
		else if(concernedField.equalsIgnoreCase(PrivilegesType.CREATOR.getValue())){
			userAssetInfoList = userAssets.getCreatorOf();
		}
		if(userAssetInfoList==null){
			userAssetInfoList = new ArrayList<UserAssetsInfo>();
		}
		userAssetInfoList.add(new UserAssetsInfo(assetId,assetType)); // Add the new asset information
		Update update = new Update();
		update.set(concernedField+"Of",userAssetInfoList); // The Of is added
		WriteResult result = mongoTemplate.updateFirst(searchQuery,update,UserAssets.class,"UserAssets");
		if(result.getN() != 1){
			logger.error("graphiti-tid:{}.No document was updated for asset with Id:{}",graphiti_tid,assetId);
		}
	}
	
	public UserAssetsWithAssetName getAllUserAssets(String graphiti_tid, String userId, String orgId)
	{
		try {
			IdentityService identityService = new IdentityService();
			User user = identityService.getUser(userId, graphiti_tid);
			if(user==null){
				logger.error("graphiti-tid:{}.User not found with Id:{}",graphiti_tid,userId);
				throw new UserNotFoundException("User not found with Id:"+userId);
			}
			UserAssets userAssets = null;
			ArrayList<UserAssets> listOfAssets = new ArrayList<>();
			Query query = new Query(Criteria.where("_id").is(userId)); 
			if(user.getType().equalsIgnoreCase("TEAM")) {
				 userAssets = mongoTemplate.findOne(query, UserAssets.class, "UserAssets");
				 if(userAssets!=null){
					 listOfAssets.add(userAssets);
				 }
			}
			else if(user.getType().equalsIgnoreCase("USER")) {
				userAssets = mongoTemplate.findOne(query, UserAssets.class, "UserAssets");
				if(userAssets!=null){
					listOfAssets.add(userAssets);
				}
				Member member = identityService.getMember(graphiti_tid, userId);
				if(member == null) {
					logger.error("graphiti_tid: {}. Error getting member details from user Service. Member ID: {}", graphiti_tid, userId);
				}
				for ( TeamMember team : member.getTeams() ) {
					Query queryTeam = new Query(Criteria.where("_id").is(team.getId()));
					 userAssets = mongoTemplate.findOne(queryTeam, UserAssets.class, "UserAssets");
					 if(userAssets!=null)
					 listOfAssets.add(userAssets);
				}
			}
			ArrayList<String> assetIds = new ArrayList<>();
			for (UserAssets asset : listOfAssets) {
				for ( UserAssetsInfo assetInfo : asset.getCreatorOf()) {
					assetIds.add(assetInfo.getId());
				}
				for (UserAssetsInfo assetInfo : asset.getAuthorOf()) {
					assetIds.add(assetInfo.getId());
				}
				for (UserAssetsInfo assetInfo : asset.getAdminOf()) {
					assetIds.add(assetInfo.getId());
				}
				for (UserAssetsInfo assetInfo : asset.getViewerOf()) {
					assetIds.add(assetInfo.getId());
				}
				
			}	
			Map<String, String> idNameMap = assetUsersRepository.getListOfAssetInfoBasedOnId(orgId, assetIds);
			UserAssetsWithAssetName userAssetsWithAssetName = new UserAssetsWithAssetName();
			userAssetsWithAssetName.setId(userId);
			userAssetsWithAssetName.setOrgId(orgId);
			// TEAM or MEMBER
			// TODO - Need to remove this hard coding
			UserType userType = user.getType()=="TEAM" ? UserType.TEAM : UserType.MEMBER;
			userAssetsWithAssetName.setUserType(userType);
			// TODO - Use Reflections here.
			for (UserAssets asset : listOfAssets) {
				ArrayList<UserAssetsInfoWithName> creatorList = new ArrayList<>();
				for (UserAssetsInfo assetInfo : asset.getCreatorOf()) {
					UserAssetsInfoWithName userAssetsInfoWithName = new UserAssetsInfoWithName();
					userAssetsInfoWithName.setId(assetInfo.getId());
					userAssetsInfoWithName.setAssetType(assetInfo.getAssetType());
					userAssetsInfoWithName.setAssetName(idNameMap.get(assetInfo.getId()));
					creatorList.add(userAssetsInfoWithName);
				}
				userAssetsWithAssetName.setCreatorOf(creatorList);
				ArrayList<UserAssetsInfoWithName> authorList = new ArrayList<>();
				for (UserAssetsInfo assetInfo : asset.getAuthorOf()) {
					UserAssetsInfoWithName userAssetsInfoWithName = new UserAssetsInfoWithName();
					userAssetsInfoWithName.setId(assetInfo.getId());
					userAssetsInfoWithName.setAssetType(assetInfo.getAssetType());
					userAssetsInfoWithName.setAssetName(idNameMap.get(assetInfo.getId()));
					authorList.add(userAssetsInfoWithName);
				}
				userAssetsWithAssetName.setAuthorOf(authorList);
				ArrayList<UserAssetsInfoWithName> adminList = new ArrayList<>();
				for (UserAssetsInfo assetInfo : asset.getAdminOf()) {
					UserAssetsInfoWithName userAssetsInfoWithName = new UserAssetsInfoWithName();
					userAssetsInfoWithName.setId(assetInfo.getId());
					userAssetsInfoWithName.setAssetType(assetInfo.getAssetType());
					userAssetsInfoWithName.setAssetName(idNameMap.get(assetInfo.getId()));
					adminList.add(userAssetsInfoWithName);
				}
				userAssetsWithAssetName.setAdminOf(adminList);
				ArrayList<UserAssetsInfoWithName> viewerList = new ArrayList<>();
				for (UserAssetsInfo assetInfo : asset.getViewerOf()) {
					UserAssetsInfoWithName userAssetsInfoWithName = new UserAssetsInfoWithName();
					userAssetsInfoWithName.setId(assetInfo.getId());
					userAssetsInfoWithName.setAssetType(assetInfo.getAssetType());
					userAssetsInfoWithName.setAssetName(idNameMap.get(assetInfo.getId()));
					viewerList.add(userAssetsInfoWithName);
				}
				userAssetsWithAssetName.setViewerOf(viewerList);
			}
			return userAssetsWithAssetName;
		}
		catch (Exception e) {
			logger.error("graphiti-tid:{}. Error Retreiving Assets for the user {}",userId);
			throw new GenericInternalServerErrorException("Error Retreiving assets for the user");
		}
	}
}
