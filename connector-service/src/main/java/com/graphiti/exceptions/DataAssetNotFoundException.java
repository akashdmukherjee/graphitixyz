package com.graphiti.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;


@ResponseStatus(value=HttpStatus.NOT_FOUND)
public class DataAssetNotFoundException extends RuntimeException{
	private static final long serialVersionUID = 1L;
	public DataAssetNotFoundException(String message){
		super(message);
	}
}
