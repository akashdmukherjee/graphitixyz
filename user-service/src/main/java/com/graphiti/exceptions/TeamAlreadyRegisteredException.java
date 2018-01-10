package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value=HttpStatus.CONFLICT)
public class TeamAlreadyRegisteredException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	
	public TeamAlreadyRegisteredException(String message){
		super(message);
	}
}
