package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.ALREADY_REPORTED)
public class MemberAlreadyActivatedException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public MemberAlreadyActivatedException(String message){
		super(message);
	}
}
