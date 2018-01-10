package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value=HttpStatus.GONE)
public class VerificationLinkExpiredException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public VerificationLinkExpiredException(String message){
		super(message);
	}
}

