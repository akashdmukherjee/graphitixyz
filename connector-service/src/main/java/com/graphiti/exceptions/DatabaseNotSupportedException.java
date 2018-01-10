package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(value=HttpStatus.NOT_IMPLEMENTED)
public class DatabaseNotSupportedException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public DatabaseNotSupportedException(String message){
		super(message);
	}
}
