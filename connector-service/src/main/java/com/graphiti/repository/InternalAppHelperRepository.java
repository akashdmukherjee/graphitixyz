package com.graphiti.repository;

import java.util.List;

import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;


@Repository
public class InternalAppHelperRepository {
	
	/*@Autowired
    protected JdbcTemplate jdbcTemplate;
	
	/**
	 * Get acceptable dateFormats 
	 * 
	 */
	public JSONObject getAccepatbleDateFormats() throws EmptyResultDataAccessException{
		try{
			// sql query
			/*String query = "SELECT * FROM DateFormats";
			List<String> dateFormatsList = (List<String>) jdbcTemplate.queryForList(query,String.class);
			JSONObject returningObject = new JSONObject();
			returningObject.put("acceptableDateFormats",dateFormatsList);
			return returningObject;*/
			return null;
		}
		catch(EmptyResultDataAccessException e){
			throw e;
		}
	}
}
