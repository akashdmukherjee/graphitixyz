package com.graphiti.controller;

import org.apache.http.protocol.HTTP;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.graphiti.repository.ConnectionRepository;
import com.graphiti.repository.InternalAppHelperRepository;


@RestController
public class InternalAppHelperController {
	
	@Autowired
	private InternalAppHelperRepository internalHelperRepository;
	
	@RequestMapping(value="/data/internal/getAccepatableDateFormats",method=RequestMethod.GET,produces="application/json")
	public ResponseEntity<Object> getAccepatableDateFormats(@RequestHeader(value="graphiti-tid")String graphiti_tid){
		try{
			JSONObject jsonObject = internalHelperRepository.getAccepatbleDateFormats();
			return new ResponseEntity<Object>(jsonObject,HttpStatus.OK);
		}
		catch(EmptyResultDataAccessException e){
			return new ResponseEntity<Object>("No data found for supported date formats",HttpStatus.NOT_FOUND);
		}
		
	}
}
