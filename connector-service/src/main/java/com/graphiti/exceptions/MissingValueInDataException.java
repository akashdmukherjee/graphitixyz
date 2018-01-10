package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value=HttpStatus.INTERNAL_SERVER_ERROR)
public class MissingValueInDataException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public MissingValueInDataException(String message){
		super(message);
	}
}
