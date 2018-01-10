package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(value=HttpStatus.NOT_FOUND)
public class OrganizationNotFoundException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public OrganizationNotFoundException(String message){
		super(message);
	}
}
