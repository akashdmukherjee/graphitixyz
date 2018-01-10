package com.graphiti.controller;

import java.util.UUID;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.graphiti.bean.Session;
import com.graphiti.exceptions.RedisKeyNotFoundException;
import com.graphiti.exceptions.SessionCreationException;
import com.graphiti.exceptions.SessionDeletionException;
import com.graphiti.exceptions.SessionNotFoundException;
import com.graphiti.exceptions.SessionRetreivalException;
import com.graphiti.exceptions.SessionUpdationException;
import com.graphiti.exceptions.SessionValidationException;
import com.graphiti.repository.SessionRepository;

@RestController
public class SessionController {
	private Logger logger = LoggerFactory.getLogger(SessionController.class);
	@Autowired
	private SessionRepository sessionRepository;
	
	@RequestMapping(value="/session", method=RequestMethod.POST)
	public ResponseEntity<?> createSession(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String userInformation) {
		try {
			JSONParser parser = new JSONParser();
			JSONObject jsonObject = (JSONObject) parser.parse(userInformation);
			Session session = new Session();
			String sessionId = UUID.randomUUID().toString();
			String userId = (String) jsonObject.get("userId");
			logger.info("graphiti-tid:{}. Creating session for userId:{} with sessionId:{}", graphiti_tid, userId, sessionId);
			session.setId(sessionId);
			session.setUserId(userId);
			sessionRepository.setSession(session);
			jsonObject.put("sessionId", sessionId);
			logger.info("graphiti-tid:{}.  SessionId:{} created for userId: {}", graphiti_tid, sessionId, userId);
			return new ResponseEntity<JSONObject>(jsonObject, HttpStatus.CREATED);
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Error occurred while creating sesion in redis: {}", graphiti_tid, e.getMessage());
			throw new SessionCreationException("Unable to create session in redis.");
		}
	}
	
	@RequestMapping(value="/session/{userId}", method=RequestMethod.GET)
	public ResponseEntity<?> getSession(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@PathVariable("userId") String userId) {
		try {
			Session session = sessionRepository.getSession(userId);
			if(session == null) {
				logger.warn("graphiti-tid:{}. Session not found for userId:{}", graphiti_tid, userId);
				throw new RedisKeyNotFoundException("Session not found.");
			}
			JSONObject responseInformation = new JSONObject();
			logger.info("graphiti-tid:{}. Getting session for userId:{}", graphiti_tid, userId);
			responseInformation.put("sessionId", session.getId());
			responseInformation.put("userId", session.getUserId());
			logger.info("graphiti-tid:{}. Got session:{}", graphiti_tid, session.toString());
			return new ResponseEntity<JSONObject>(responseInformation, HttpStatus.OK);
		} catch(RedisKeyNotFoundException e) {
			throw e;
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Error occurred while Getting session in redis: {}", graphiti_tid, e.getMessage());
			throw new SessionRetreivalException("Unable to retreive session from redis.");
		}
	}
	
	@RequestMapping(value="/session", method=RequestMethod.PUT)
	public ResponseEntity<?> updateSession(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String sessionInformation) {
		try {
			JSONParser parser = new JSONParser();
			JSONObject jsonObject = (JSONObject) parser.parse(sessionInformation);
			String sessionId = (String) jsonObject.get("sessionId");
			String userId = (String) jsonObject.get("userId");
			logger.info("graphiti-tid:{}. Updating session for userId:{} with sessionId:{}", graphiti_tid, userId, sessionId);
			Session session = sessionRepository.getSession(userId);
			if(session == null) {
				throw new SessionNotFoundException("Session not found");
			}
			sessionRepository.updateSession(session);
			logger.info("graphiti-tid:{}. Session updated for userId:{} with sessionId:{}", graphiti_tid, userId, sessionId);
			return new ResponseEntity<>(null, HttpStatus.NO_CONTENT);
		} catch (SessionNotFoundException e) {
			throw e;
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Error occurred while updating sesion in redis: {}", graphiti_tid, e.getMessage());
			throw new SessionUpdationException("Unable to update session in redis.");
		}
	}
	
	@RequestMapping(value="/session/{userId}", method=RequestMethod.DELETE)
	public ResponseEntity<?> deleteSession(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@PathVariable("userId") String userId) {
		try {
			sessionRepository.deleteSession(userId);
			logger.info("graphiti-tid:{}. Session deleted for userId:{}", graphiti_tid, userId);
			return new ResponseEntity<String>("Session Deleted.", HttpStatus.OK);
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Error occurred while Deleting sesion in redis: {}", graphiti_tid, e.getMessage());
			throw new SessionDeletionException("Unable to delete session from redis.");
		}
	}
	
	@RequestMapping(value="/session/validate", method=RequestMethod.PUT)
	public ResponseEntity<?> validateSession(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,
			@RequestBody String sessionInformation) {
		try {
			JSONParser parser = new JSONParser();
			JSONObject jsonObject = (JSONObject) parser.parse(sessionInformation);
			String sessionId = (String) jsonObject.get("sessionId");
			String userId = (String) jsonObject.get("userId");
			logger.info("graphiti-tid:{}. Updating session for userId:{} with sessionId:{}", graphiti_tid, userId, sessionId);
			Session session = sessionRepository.getSession(userId);
			if(session == null) {
				throw new SessionNotFoundException("Session not found");
			}
			if(!session.getId().equals(sessionId)) {
				logger.error("graphiti-tid:{}. Client sessionId:{} doesn't match with redis sessionId:{}", graphiti_tid, sessionId, session.getId());
				return new ResponseEntity<String>("Unauthorized", HttpStatus.UNAUTHORIZED);
			}
			logger.info("graphiti-tid:{}. Validating session for userId:{}.", graphiti_tid, userId);
			sessionRepository.validateSession(userId);
			logger.info("graphiti-tid:{}. Session validated with sessionId:{} for userId:{}", graphiti_tid, session.getId(), userId);
			return new ResponseEntity<>(null, HttpStatus.NO_CONTENT);
		} catch (SessionNotFoundException e) {
			throw e;
		} catch (Exception e) {
			logger.error("graphiti-tid:{}. Error occurred while validating sesion in redis: {}", graphiti_tid, e.getMessage());
			throw new SessionValidationException("Unable to validate session from redis.");
		}
	}
}
