package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class MemberAlreadyRegisteredWithEmailAddress extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public MemberAlreadyRegisteredWithEmailAddress(String message){
		super(message);
	}
}

