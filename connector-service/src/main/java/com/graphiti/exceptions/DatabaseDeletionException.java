package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(value=HttpStatus.BAD_REQUEST)
public class DatabaseDeletionException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public DatabaseDeletionException(String message){
		super(message);
	}
}
