package com.grapthiti.utils;

import java.security.SecureRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.graphiti.Constants;
import com.graphiti.bean.Connection;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.filter.HTTPBasicAuthFilter;
import com.sun.jersey.api.client.filter.LoggingFilter;

public class Utils {

	private Logger logger = LoggerFactory.getLogger(Utils.class);
	
	/**
	 * The purpose of this function is to return
	 * a WebResource object 
	 * @param url 
	 * @return the webResource object
	 */
	public WebResource getWebResource(String url,String username, String password){
		Client client = Client.create();
		client.addFilter(new HTTPBasicAuthFilter(username, password));
		return client.resource(url);
	}
	
	/**
	 * The purpose of this function is to return
	 * a WebResource object 
	 * @param url 
	 * @return the webResource object
	 */
	public WebResource getWebResource(String url){
		Client client = Client.create();
		if (Constants.getInstance().properties.getProperty("enable-http-logging") != null
				&& Constants.getInstance().properties.getProperty(
						"enable-http-logging").equalsIgnoreCase("true")){
			client.addFilter(new LoggingFilter(System.out));
		}
		return client.resource(url);
	}
	
	/**
	 * The purpose of this function is to generate a random string of specific length
	 * 
	 * @param length
	 * @return
	 */
	public static String generateRandomAlphaNumericString(int length){
		final String alphaNums = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		SecureRandom rnd = new SecureRandom();
	
		StringBuilder sb = new StringBuilder(length);
		for( int i = 0; i < length; i++ ) 
			sb.append( alphaNums.charAt( rnd.nextInt(alphaNums.length()) ) );
		return sb.toString();
	}
	
	/**
	 * The purpose of this function is to generate a random string of specific length
	 * 
	 * @param length
	 * @return
	 */
	public static String generateRandomString(int length){
		final String alphaNums = "abcdefghijklmnopqrstuvwxyz";
		SecureRandom rnd = new SecureRandom();
	
		StringBuilder sb = new StringBuilder(length);
		for( int i = 0; i < length; i++ ) 
			sb.append( alphaNums.charAt( rnd.nextInt(alphaNums.length()) ) );
		return sb.toString();
	}
}
