package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(value=HttpStatus.BAD_REQUEST)
public class JSONParseException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public JSONParseException(String message){
		super(message);
	}
}
