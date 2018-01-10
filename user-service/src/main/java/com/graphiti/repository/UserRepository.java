package com.graphiti.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import com.graphiti.bean.Member;
import com.graphiti.bean.User;



@Repository
public class UserRepository {

	@Autowired 
	MongoTemplate mongoTemplate;
	
	/**
	 * To save a user
	 * @param user
	 */
	public void save(User user){
		mongoTemplate.save(user, "Users");
	}
	
	/**
	 * To get user details
	 */
	public User getUser(Query queryForSearch){
		User user = mongoTemplate.findOne(queryForSearch,User.class,"Users");
		return user;
	}
	
	/**
	 * To get all users
	 */
	public List<User> getAllUsers(Query queryForSearch, String[] fieldsArray){
		if(fieldsArray!=null) {
			for(String field: fieldsArray) {
				queryForSearch.fields().include(field);
			}
		}
		List<User> listUsers = mongoTemplate.find(queryForSearch,User.class,"Users");
		return listUsers;
	}
	
	/**
	 * Search users by name
	 */
	public List<User> searchUsersByName(Query queryForSearch) {
		return mongoTemplate.find(queryForSearch, User.class, "Users");
	}
	
}
