package com.graphiti.repository;

import java.util.ArrayList;

import javax.print.DocFlavor.STRING;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.CriteriaDefinition;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.graphiti.bean.Member;
import com.graphiti.bean.Team;
import com.graphiti.bean.TeamMember;
import com.mongodb.WriteResult;

@Repository
public class TeamRepository {
	@Autowired
	private MongoTemplate mongoTemplate;
	
	public void save(Team team) {
		mongoTemplate.save(team, "Teams");
	}
	
	public Team getTeam(Query searchQuery) {
		return mongoTemplate.findOne(searchQuery, Team.class, "Teams");
	}
	
	public boolean addMemberToTeam(String teamId, String memberId, String memberName) {
		TeamMember memberToBeAddedToTeam = new TeamMember();
		memberToBeAddedToTeam.setId(memberId);
		memberToBeAddedToTeam.setName(memberName);
		Query query = new Query(Criteria.where("_id").is(teamId));
		Update update = new Update().push("members", memberToBeAddedToTeam);
		WriteResult result = mongoTemplate.updateFirst(query, update, Team.class, "Teams");
		return result.getN() == 1? true: false;
	}
	
	public boolean addMemberToTeam(String teamId, ArrayList<TeamMember> teamMembers) {
		Query query = new Query(Criteria.where("_id").is(teamId));
		Team team = mongoTemplate.findOne(query, Team.class, "Teams");
		Update update = new Update().set("members", teamMembers);
		WriteResult result = mongoTemplate.updateFirst(query, update, Team.class, "Teams");
		return result.getN() == 1? true: false;
	}
}
