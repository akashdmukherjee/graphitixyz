package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(value=HttpStatus.NOT_FOUND)
public class NoColumnNamesRetrievedFromConnector extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public NoColumnNamesRetrievedFromConnector(String message){
		super(message);
	}
}
