package com.graphiti.utils;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

import javax.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.ui.velocity.VelocityEngineUtils;

import com.graphiti.Constants;
import com.graphiti.bean.Member;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.filter.LoggingFilter;

public class Utils {
	
	Logger logger = LoggerFactory.getLogger(Utils.class);
			
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
}
