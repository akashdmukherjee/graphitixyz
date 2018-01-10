package com.graphiti.controlller;

import java.util.List;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.graphiti.bean.Member;
import com.graphiti.bean.Organization;
import com.graphiti.bean.TeamMember;
import com.graphiti.exceptions.InvalidEmailException;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.OrganizationNotFoundException;
import com.graphiti.repository.MemberRepository;
import com.graphiti.repository.OrganizationRepository;
import com.graphiti.validations.Validations;

@RestController
public class MemberController {

	private Logger logger = LoggerFactory.getLogger(MemberRegistrationController.class);

	@Autowired
	MemberRepository memberRepository;

	@Autowired
	OrganizationRepository organizationRepository;
	
	@RequestMapping(value = "/health", method = RequestMethod.GET)
	public ResponseEntity<String> testConnection(){
		return new ResponseEntity<>("OK",HttpStatus.OK);
	}
	
	/**
	 * Get member details
	 * 
	 * @param email
	 */
	@RequestMapping(value = "/member/{memberId}", method = RequestMethod.GET)
	public ResponseEntity<?> getMemberDetails(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@PathVariable("memberId") String memberId) {
		Query searchMemberQuery = new Query(Criteria.where("id").is(memberId));
		JSONObject memberInformation = new JSONObject();
		Member existingMember;
		existingMember = memberRepository.getMember(searchMemberQuery);
		if (existingMember == null) {
			logger.error("graphiti-tid:{}. No member found with memberId:{}", graphiti_tid, memberId);
			throw new MemberNotFoundException("No registered member found for id:" + memberId);
		}
		if (existingMember != null) {
			return new ResponseEntity<>(existingMember, HttpStatus.OK);
		}
		return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);	
	}

	/**
	 * External API for /member/{memberId}
	 * method: getMemberDetails
	 */
	@RequestMapping(value = "/ext/member", method = RequestMethod.GET)
	public ResponseEntity<?> extGetMemberDetails(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@CookieValue("memberId") String memberId) {
		return getMemberDetails(graphiti_tid, memberId);
	}
	
	/**
	 * This is used when verifying email during login/signup
	 */
	@RequestMapping(value = "/ext/member/exists", method = RequestMethod.GET)
	public ResponseEntity<?> extMemberExists(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestParam("email") String email) {
		boolean isValidEmail = Validations.isEmailValid(email);
		Query searchMemberQuery = new Query(Criteria.where("emailAddress").is(email));
		JSONObject memberInformation = new JSONObject();
		Member existingMember;
		if (isValidEmail) {
			existingMember = memberRepository.getMember(searchMemberQuery);
			if (existingMember == null) {
				logger.error("graphiti-tid:{}. No member found with this email address:{}", graphiti_tid, email);
				throw new MemberNotFoundException("No registered member found for email address:" + email);
			}
		} else {
			throw new InvalidEmailException("Invalid email");
		}
		if (existingMember != null) {
			return new ResponseEntity<>(true, HttpStatus.OK);
		}
		return new ResponseEntity<>(false, HttpStatus.NOT_FOUND);
	}
	
	
	
	/**
	 * Get Organization details for a user
	 * 
	 * @param memberId
	 */
	@RequestMapping(value = "/member/{memberId}/organization", method = RequestMethod.GET)
	public ResponseEntity<?> getOrganizationForUser(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@PathVariable("memberId") String memberId) {
		// Check first if the user exists
		Query searchMemberQuery = new Query(Criteria.where("_id").is(memberId));
		Member member = memberRepository.getMember(searchMemberQuery);
		if (member == null) {
			logger.error("graphiti-tid:{}. No member found with Id:{}", graphiti_tid, memberId);
			throw new MemberNotFoundException("No registered member found for Id:" + memberId);
		}
		// Make another call to get Organization for the registered user
		Query searchOrganizationQuery = new Query(Criteria.where("_id").is(member.getOrganizationId()));
		Organization organization = organizationRepository.getOrganization(searchOrganizationQuery);
		if (organization == null) {
			logger.error("graphiti-tid:{}. No organization found for member with Id:{}", graphiti_tid, memberId);
			throw new OrganizationNotFoundException("No organization found for member with Id:" + memberId);
		}
		return new ResponseEntity<Organization>(organization, HttpStatus.OK);
	}

	@RequestMapping(value = "/member/{memberIdForWhomTeamInfoIsRequired}/teams", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getTeamsForMember(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable String memberIdForWhomTeamInfoIsRequired) {
		try {
			JSONObject responseObject = new JSONObject();
			logger.info("graphiti-tid:{}. Getting Teams for memberId:{}", graphiti_tid, memberIdForWhomTeamInfoIsRequired);
			List<TeamMember> teams = memberRepository.getTeamsForMember(memberIdForWhomTeamInfoIsRequired,orgId);
			logger.info("graphiti-tid:{}. Got Teams:{} for memberId:{}", graphiti_tid, teams, memberIdForWhomTeamInfoIsRequired);
			if(teams!=null){
				responseObject.put("teams", teams);
			}
			else{
				responseObject.put("teams", null);
			}
			return new ResponseEntity<JSONObject>(responseObject, HttpStatus.OK);
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Unable to get teams. Message:{}", graphiti_tid, e.getMessage());
			return new ResponseEntity<String>("Unable to get teams.", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@RequestMapping(value = "/ext/member/{memberIdForWhomTeamInfoIsRequired}/teams", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> extgetTeamsForMember(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable String memberIdForWhomTeamInfoIsRequired) {
		return getTeamsForMember(graphiti_tid, orgId, memberId,memberIdForWhomTeamInfoIsRequired);
	}
	
	/**
	 * This is just a dummy network call that will be added
	 * to the interceptor. This will be called when a user accesses 
	 * any of the webpages in our application. Since this will go 
	 * via the interceptor, it will be validated against the browser stored session.
	 * If the session is correct, then it will be updated by the interceptor, and this webservice will be
	 * called.
	 * If the session is incorrect, then interceptor will show a 401 - Unauthorized and thus will be redirected 
	 * to login screen
	 */
	@RequestMapping(value = "/ext/gytryu", method = RequestMethod.GET)
	public ResponseEntity<?> extCheckSession(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid) {
		logger.info("graphiti-tid:{}.Recieved a network call for session",graphiti_tid);
		return new ResponseEntity<>(null, HttpStatus.OK);
	}
}
