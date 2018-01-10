package com.graphiti.exceptions;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

@ResponseStatus(value=HttpStatus.INTERNAL_SERVER_ERROR)
public class AssetUpdateInSearchException extends RuntimeException {
	private static final long serialVersionUID = 1L;
	public AssetUpdateInSearchException(String message){
		super(message);
	}
}
