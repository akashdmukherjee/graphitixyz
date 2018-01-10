package com.graphiti.controlller;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.graphiti.bean.Member;
import com.graphiti.bean.User;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.repository.MemberRepository;
import com.graphiti.repository.UserRepository;

@RestController
public class UserController {
	private Logger logger = LoggerFactory.getLogger(UserController.class);

	@Autowired
	UserRepository userRepository;
	
	@Autowired
	MemberRepository memberRepository;

	// TODO - Need to add MemberId in header
	@RequestMapping(value = "/user/{userId}", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<User> getUserDetails(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid, @PathVariable String userId) {
		Query searchUserQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(userId)));
		User user = userRepository.getUser(searchUserQuery);
		if (user == null) {
			throw new MemberNotFoundException("Member not found");
		}
		return new ResponseEntity<User>(user, HttpStatus.OK);
	}
	
	@RequestMapping(value = "/users", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<?> getAllUsers(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestParam("fields") String fields) {
		ArrayList<User> usersArrayList = new ArrayList<>();
		Query searchUserQuery = new Query(new Criteria().andOperator(Criteria.where("organization").is(orgId)));
		List<User> user;
		if(fields!=null) {
			String[] fieldsArray = fields.split(",");
			user = userRepository.getAllUsers(searchUserQuery, fieldsArray);
		} else {
			user = userRepository.getAllUsers(searchUserQuery, null);
		}
		if (user == null) {
			throw new MemberNotFoundException("Member not found");
		}
		return new ResponseEntity<List<User>>(user, HttpStatus.OK);
	}

	// Make External
	@RequestMapping(value = "/user", method = RequestMethod.GET)
	public ResponseEntity<?> searchUsersByName(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestHeader(value = "onlyMembers", required = false, defaultValue = "false") boolean onlyMembers,
			@RequestParam("q") String query) {
		ArrayList<User> usersArrayList = new ArrayList<>();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		Query searchUserQuery = new Query(new Criteria().andOperator(Criteria.where("organization").is(orgId), Criteria.where("name").regex(Pattern.compile("^"+query+".*", Pattern.CASE_INSENSITIVE))));
		logger.info("graphiti-tid:{}.Search user by name:{} and {}",graphiti_tid, query, searchUserQuery);
		List<User> users = null;
		List<Member> members = null;
		JSONArray responseJSONArray = new JSONArray();
		JSONObject jsonObject;
		if(query!=null && query.length() > 0) {
			users = userRepository.searchUsersByName(searchUserQuery);
			logger.info("graphiti-tid:{}.Got users {}",graphiti_tid, users);
		} else {
			return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
		}
		
		if (users!=null) {
			for(User user: users) {
				if (user.getType().equalsIgnoreCase("USER")) {
					arrayListOfCriteria.add(Criteria.where("_id").is(user.getId()));
				} else if (user.getType().equalsIgnoreCase("TEAM") && onlyMembers == false) {
					jsonObject = new JSONObject();
					jsonObject.put("id", user.getId());
					jsonObject.put("name", user.getName());
					jsonObject.put("type", user.getType());
					responseJSONArray.add(jsonObject);
				}
			}
			if (arrayListOfCriteria.size()>0) {
				Query queryForSearch = new Query();
				queryForSearch.addCriteria(new Criteria().andOperator(Criteria.where("organizationId").is(orgId),
						new Criteria().orOperator(arrayListOfCriteria.toArray(new Criteria[arrayListOfCriteria.size()]))));
				logger.info("graphiti-tid:{}.Searching for members associating with user ids, {}", graphiti_tid, queryForSearch);
				members = memberRepository.searchMembersByIds(queryForSearch);
				logger.info("graphiti-tid:{}.Got members:{}", graphiti_tid, members);
			}
		}
		if (members!=null) {
			for(Member member: members) {
				jsonObject = new JSONObject();
				jsonObject.put("id", member.getId());
				jsonObject.put("name", member.getFullName());
				jsonObject.put("email", member.getEmailAddress());
				jsonObject.put("type", "USER");
				responseJSONArray.add(jsonObject);
			}
		}
		return new ResponseEntity<JSONArray>(responseJSONArray, HttpStatus.OK);
	}

	/**
	 * External API for /user
	 * method: searchUsersByName
	 */
	@RequestMapping(value = "/ext/user", method = RequestMethod.GET)
	public ResponseEntity<?> extSearchUsersByName(@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@RequestHeader(value = "onlyMembers", required = false, defaultValue = "false") boolean onlyMembers,
			@RequestParam("q") String query) {
		return searchUsersByName(graphiti_tid, orgId, onlyMembers, query);
	}
}
