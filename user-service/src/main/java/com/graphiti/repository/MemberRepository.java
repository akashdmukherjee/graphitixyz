package com.graphiti.repository;

import java.util.List;
import java.time.Instant;
import java.util.ArrayList;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.graphiti.Constants;
import com.graphiti.bean.Member;
import com.graphiti.bean.Team;
import com.graphiti.bean.TeamMember;
import com.graphiti.exceptions.InvalidPasswordException;
import com.graphiti.exceptions.MemberAlreadyActivatedException;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.VerificationLinkExpiredException;
import com.graphiti.security.Hash;
import com.mongodb.WriteResult;

@Repository
public class MemberRepository {

	@Autowired 
	MongoTemplate mongoTemplate;
	
	@Autowired
	TeamRepository teamRepository;
	
	/**
	 * To save a member.
	 * When Member is being saved make sure that the password that is being sent is not stored.
	 * Should be only used when registering user for the first time
	 * @param member
	 */
	public void save(Member member,boolean isThirdPartySignIn){
		// Very Important to do this
		// DO NOT ERASE THESE LINES
		// Here generate the hash for the password
		if(!isThirdPartySignIn){
			JSONObject jsonObject = Hash.generateHash(member.getPassword());
			member.setHashedPassword((String) jsonObject.get("hashedPassword"));
			member.setSalt((String) jsonObject.get("salt"));
			member.setPassword(null);
		}
		mongoTemplate.save(member, "Members");
	}
	
	
	/**
	 * This should not be used at all anywhere. Exceptions can be made
	 * with permission
	 * @param memberId
	 * @param orgId
	 * @return
	 */
	public Member getHashedPasswordAndSalt(String memberId,String orgId){
		Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria
				.where("_id").is(memberId), Criteria.where("organizationId")
				.is(orgId)));
		searchMemberQuery.fields().include("hashedPassword").include("salt").include("_id");
		Member member = mongoTemplate.findOne(searchMemberQuery, Member.class,"Members");
		return member;
		
	}
	
	
	/**
	 * To get a member
	 * @param queryForSearch
	 * @return
	 */
	public Member getMember(Query queryForSearch){
		Member member = mongoTemplate.findOne(queryForSearch,Member.class,"Members");
		if(member!=null){
			member.setPassword(null);
			member.setHashedPassword(null);
			member.setSalt(null);
		}
		return member;
	}
	
	/**
	 * The purpose of this function is to update a Members password
	 * 
	 * @param memberId
	 * @param oldPassword
	 * @param newPassword
	 * @param checkOldPassword set this to true if you require old password to be checked
	 *        when updating the password
	 * @return
	 */
	public boolean changePassword(String memberId,String oldPassword,String newPassword,Boolean checkOldPassword){
		Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId)));
		Member member = mongoTemplate.findOne(searchMemberQuery,Member.class,"Members");
		if(member==null){
			throw new MemberNotFoundException("No user found for the user with Id"+memberId);
		}
		if(checkOldPassword==true){
			// Check Hash of Old Password that is sent here with the 
			// hash which is stored in the datatbase
			String hashOfPasswordStoredInDatabase = member.getHashedPassword();
			String hashOfPasswordSentByUser = Hash.getSHA512SecurePassword(oldPassword, member.getSalt().getBytes());
			if(!hashOfPasswordStoredInDatabase.equals(hashOfPasswordSentByUser)){
				throw new InvalidPasswordException("User old password does not match with the records");
			}
		}
		// Once the hash matches
		// then go ahead updating the passwordHash
		JSONObject jsonObjectForHashAndSalt = Hash.generateHash(newPassword);
		Update update = new Update();
		update.set("hashedPassword",(String) jsonObjectForHashAndSalt.get("hashedPassword"));
		update.set("salt",(String) jsonObjectForHashAndSalt.get("salt"));
		WriteResult result = mongoTemplate
				.updateFirst(
						searchMemberQuery,
						update,
						Member.class, "Members");
		if(result.getN()==1){
			return true;
		}
		else if(result.getN()==0){
			return false;
		}
		return false;
	}
	
	/**
	 * The purpose of this function is to activate a member based on the memberId and the
	 * key that was sent in the activation URL
	 * @param memberId
	 * @param key
	 * @return
	 * @throws VerificationLinkExpiredException
	 */
	public boolean activateMember(String memberId, String key) throws VerificationLinkExpiredException{
		Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId),Criteria.where("verificationKey").is(key)));
		Member member = mongoTemplate.findOne(searchMemberQuery,Member.class,"Members");
		if(member==null){
			throw new MemberNotFoundException("No User was found for this activation link.Kindly contact the administrator with the activation link");
		}
		if(member.getVerificationStatus().equalsIgnoreCase("ACTIVATE")){
			throw new MemberAlreadyActivatedException("User already activated");
		}
		// Checking if last updation time of verificationLink is less than the expired time
		long expiredTime = member.getUnixTSOfUpdOfVeriURL()+(Integer.parseInt(Constants.getInstance().properties.getProperty("verificationLinkExpirationTime"))*60);
		long currentTime = Instant.now().getEpochSecond();
		if(expiredTime<currentTime){
			throw new VerificationLinkExpiredException("Verification Link is expired. You need to request a new one.");
		}
		WriteResult result = mongoTemplate.updateFirst(searchMemberQuery,Update.update("verificationStatus", "ACTIVATE"), Member.class,"Members");
		if(result.getN()==1){
			return true;
		}
		else if(result.getN()==0){
			return false;
		}
		return false;
	}
	
	/**
	 * 
	 * @param memberId
	 * @param verificationLink
	 * @param randomKey
	 * @param timestamp
	 * @return
	 */
	public boolean updateVerificationLink(String memberId,String verificationLink,String randomKey,long timestamp){
		Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId)));
		Update update = new Update();
		update.set("verificationURL", verificationLink);
		update.set("verificationKey",randomKey);
		update.set("unixTSOfUpdOfVeriURL", timestamp);
		WriteResult result = mongoTemplate.updateFirst(searchMemberQuery,update,Member.class,"Members");
		if(result.getN()==1){
			return true;
		}
		else if(result.getN()==0){
			return false;	
		}
		return false;
	}
	
	public boolean addTeamToMember(String memberId, TeamMember team) {
		Query query = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId)));
		Update update = new Update().push("teams", team);
		WriteResult result = mongoTemplate.updateFirst(query, update, Member.class, "Members");
		return result.getN() == 1? true: false;
	}
	
	public boolean addTeamToMember(String memberId, String teamId, String teamName) {
		TeamMember teamToBeAddedToMember = new TeamMember();
		teamToBeAddedToMember.setId(teamId);
		//teamToBeAddedToMember.setName(teamName);
		Query query = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId)));
		Update update = new Update().push("teams", teamToBeAddedToMember);
		WriteResult result = mongoTemplate.updateFirst(query, update, Member.class, "Members");
		return result.getN() == 1? true: false;
	}
	
	public List<TeamMember> getTeamsForMember(String memberId,String orgId) {
		Query query = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId),Criteria.where("organizationId").is(orgId)));
		Member member = mongoTemplate.findOne(query, Member.class, "Members");
		ArrayList<TeamMember> result = null;
		if(member != null) {
			Query searchQueryForTeam = null;
			result = member.getTeams();
			for(TeamMember teamMember:  result){
				// We have to set names of each of the team
				searchQueryForTeam = new Query(new Criteria().andOperator(Criteria.where("_id").is(teamMember.getId()),Criteria.where("organizationId").is(orgId))); 
				Team teamInfo = teamRepository.getTeam(searchQueryForTeam);
				if(teamInfo != null){
					teamMember.setName(teamInfo.getName());
				}
				else{
					teamMember.setName("NO NAME");
				}
			}
		}
		return result;
	}
	
	/**
	 * get member details using _id got from users searchByName
	 */
	public List<Member> searchMembersByIds(Query queryForSearch) {
		return mongoTemplate.find(queryForSearch, Member.class, "Members");
	}
	
	/**
	 * Remove team information from member first
	 */
	public void removeTeamIdFromMember(String memberId,String teamId){
		Query searchQuery = new Query(Criteria.where("_id").is(memberId));
		Member member = mongoTemplate.findOne(searchQuery, Member.class, "Members");
		if(member.getTeams()!=null && member.getTeams().size()>0){
			int i=0;
			boolean isTeamIdFound = false;
			for(;i<member.getTeams().size();i++){
				if(member.getTeams().get(i).getId().equalsIgnoreCase(teamId)){
					isTeamIdFound = true;
					break;
				}
			}
			if(isTeamIdFound){
				member.getTeams().remove(i);
				mongoTemplate.save(member);
			}
		}
	}
}
