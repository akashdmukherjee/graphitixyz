package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class InvalidPasswordException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public InvalidPasswordException(String message){
		super(message);
	}
}