package com.graphiti.repository;

import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.BoundValueOperations;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
	import org.springframework.stereotype.Repository;

import com.graphiti.Constants;
import com.graphiti.bean.Session;
import com.graphiti.config.RedisConfig;

@Repository
public class SessionRepository {
	private ValueOperations<String, Session> valueOperations;
	private RedisTemplate<String, Session> template;
	private int EXPIRATION_TIME = Integer.parseInt(Constants.getInstance().properties.getProperty("session_expiration_time_secs"));
	
	@Autowired
	public SessionRepository(RedisTemplate template) {
		this.template = template;
	}
	
	@PostConstruct
	private void init() {
		this.valueOperations = template.opsForValue();
	}
	
	public void setSession(Session session) {
		valueOperations.set(session.getUserId(), session, EXPIRATION_TIME, TimeUnit.SECONDS);
	}
	
	public void updateSession(Session session) {
		valueOperations.set(session.getUserId(), session, EXPIRATION_TIME, TimeUnit.SECONDS);
	}
	
	public Session getSession(String userId) {
		return (Session) valueOperations.get(userId);
	}
	
	public void deleteSession(String userId) {
		template.delete(userId);
	}
	
	public Session validateSession(String userId) {
		Session existingSession = this.getSession(userId);
		if(existingSession == null) {
			return null;
		}
		this.updateSession(existingSession);
		return existingSession;
	}
}
