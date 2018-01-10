package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value=HttpStatus.INTERNAL_SERVER_ERROR)
public class SessionDeletionException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	
	public SessionDeletionException(String message){
		super(message);
	}
}
