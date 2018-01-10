package com.graphiti.controlller;

import java.util.ArrayList;
import java.util.UUID;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import com.graphiti.bean.Member;
import com.graphiti.bean.Team;
import com.graphiti.bean.TeamMember;
import com.graphiti.bean.User;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.TeamAlreadyRegisteredException;
import com.graphiti.exceptions.TeamCreationException;
import com.graphiti.exceptions.TeamNotFoundException;
import com.graphiti.repository.MemberRepository;
import com.graphiti.repository.TeamRepository;
import com.graphiti.repository.UserRepository;
import com.graphiti.utils.Utils;

@RestController
public class TeamController {
	private Logger logger = LoggerFactory.getLogger(TeamController.class);

	@Autowired
	TeamRepository teamRepository;

	@Autowired
	MemberRepository memberRepository;
	
	@Autowired
	UserRepository userRepository;

	// TODO: allow posting members at creation time
	@RequestMapping(value = "/team", method = RequestMethod.POST, consumes = "application/json")
	public ResponseEntity<?> createTeam(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestBody Team team) {
		try {
			Query queryForSearch = new Query(new Criteria().andOperator(Criteria.where("_id").is(memberId),Criteria.where("organizationId").is(orgId)));
			Member member = memberRepository.getMember(queryForSearch);
			if(member == null) {
				throw new MemberNotFoundException("Member not found");
			}
			// Check if team is already created in Teams collection
			String teamName = team.getName();
			Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("name").is(teamName),Criteria.where("organizationId").is(orgId)));
			Team existingTeam = teamRepository.getTeam(searchQuery);
			if(existingTeam != null) {
				logger.error("graphiti-tid:{}. Team already registered.");
				throw new TeamAlreadyRegisteredException("Team already registered.");
			}
			String teamId = UUID.randomUUID().toString();
			// Create Team
			logger.info("graphiti-tid:{}. Creating a new team with teamId:{}", graphiti_tid, teamId);
			team.setId(teamId);
			team.setOrganizationId(orgId);
			teamRepository.save(team);
			logger.info("graphiti-tid:{}. Team created with teamId:{} initiated by memberId:{} of org:{}", graphiti_tid,
					teamId, memberId, orgId);
			// Create User of Type `TEAM`
			User user = new User();
			user.setId(teamId);
			user.setName(teamName);
			user.setOrganization(orgId);
			user.setType("TEAM");
			userRepository.save(user);
			logger.info("graphiti-tid:{}.User created with type `TEAM`, userId/teamId: {}", graphiti_tid, teamId);
			// Here we have to create an entry of the team for each of the member
			if(team.getMembers()!=null){
				for(int i=0;i<team.getMembers().size();i++){
					boolean teamInserted = memberRepository.addTeamToMember(team.getMembers().get(i).getId(), teamId, teamName);
					if (teamInserted) {
						logger.info("graphiti-tid:{}. Team with teamId:{} added to member with memberId:{} of org:{}",
								graphiti_tid, teamId, memberId, orgId);
					} else {
						logger.info("graphiti-tid:{}. Unable to insert team to member with memberId:{} of org:{}", graphiti_tid,
								memberId, orgId);
					}
				}
			}
			JSONObject jsonObject = new JSONObject();
			jsonObject.put("teamId", teamId);
			jsonObject.put("teamName", teamName);
			return new ResponseEntity<JSONObject>(jsonObject, HttpStatus.CREATED);
		} catch (TeamAlreadyRegisteredException e) {
			throw e;
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Unable to create team. Message:{}", graphiti_tid, e.getMessage());
			throw new TeamCreationException("Unable to create team.");
		}
	}
	
	@RequestMapping(value = "/ext/team", method = RequestMethod.POST, consumes = "application/json")
	public ResponseEntity<?> extcreateTeam(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestBody Team team) {
		return createTeam(graphiti_tid, memberId, orgId, team);
	}

	@RequestMapping(value = "/team/{teamId}/member", method = RequestMethod.PUT, consumes = "application/json")
	public ResponseEntity<?> addMemberToTeam(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@PathVariable String teamId,
			@RequestBody String memberInformation) {
		try {
			Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(teamId),Criteria.where("organizationId").is(orgId)));
			Team team = teamRepository.getTeam(searchQuery);
			if(team == null) {
				logger.error("graphiti-tid:{}. Team not found");
				throw new TeamNotFoundException("Team not found.");
			}
			// First we have to remove the existing 
			// entry of team from each of the members previosuly reference
			if(team.getMembers()!=null && team.getMembers().size()>0){
				for(int i=0;i<team.getMembers().size();i++){
					memberRepository.removeTeamIdFromMember(team.getMembers().get(i).getId(), teamId);
				}
			}
			JSONParser parser = new JSONParser();
			JSONObject jsonObject = (JSONObject) parser.parse(memberInformation);
			String teamName = (String) jsonObject.get("name");
			JSONArray members = (JSONArray) jsonObject.get("members");
			ArrayList<TeamMember> teamMembers = new ArrayList<>();
			TeamMember teamToBeAddedToMembers = new TeamMember();
			teamToBeAddedToMembers.setId(team.getId());
			TeamMember member;
			String memberIdInTeams;
			String memberName;
			for (int i = 0; i < members.size(); ++i) {
				member = new TeamMember();
				jsonObject = (JSONObject) members.get(i);
				memberIdInTeams = (String) jsonObject.get("id");
				memberName = (String) jsonObject.get("name");
				memberRepository.addTeamToMember(memberIdInTeams, teamToBeAddedToMembers);
				member.setId(memberIdInTeams);
				member.setName(memberName);
				teamMembers.add(member);
			}
			boolean membersInserted = teamRepository.addMemberToTeam(teamId, teamMembers);
			if (membersInserted) {
				logger.info("graphiti-tid:{}. Multiple members added to Team with teamId:{} ", graphiti_tid, teamId);
			} else {
				logger.info("graphiti-tid:{}. Unable to add multiple members to Team with teamId:{} ", graphiti_tid,
						teamId);
			}
			return new ResponseEntity<Object>(null, HttpStatus.NO_CONTENT);
		} catch(TeamNotFoundException e) {
			throw e;
		} catch (ParseException e) {
			logger.error("graphiti-tid:{}. Unable to parse JSON.");
			return new ResponseEntity<String>("Unable to parse JSON", HttpStatus.INTERNAL_SERVER_ERROR);
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Unable to create team. Message:{}", graphiti_tid, e.getMessage());
			return new ResponseEntity<String>("Unable to add member to team.", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@RequestMapping(value = "/ext/team/{teamId}/member", method = RequestMethod.PUT, consumes = "application/json")
	public ResponseEntity<?> extaddMemberToTeam(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@PathVariable String teamId,
			@RequestBody String memberInformation) {
		return addMemberToTeam(graphiti_tid, memberId, orgId, teamId, memberInformation);
	}
	
	@RequestMapping(value = "/ext/team/{teamId}/members", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getMembersForTeam(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable(value = "teamId", required = true) String teamId) {
		Query searchQuery = new Query(Criteria.where("id").is(teamId));
		logger.error("graphiti-tid:{}. Getting teams for teamId:{} with memberId:{}", teamId, memberId);
		Team team = teamRepository.getTeam(searchQuery);
		if(team == null) {
			logger.error("graphiti-tid:{}. Team not found");
			throw new TeamNotFoundException("Team not found.");
		}
		return new ResponseEntity<>(team.getMembers(), HttpStatus.OK);
	}
}
