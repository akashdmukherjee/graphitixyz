package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value=HttpStatus.CONFLICT)
public class OrganizationFoundException extends RuntimeException {
	private static final long serialVersionUID = 1L;
	public OrganizationFoundException(String message) {
		super(message);
	}
}
