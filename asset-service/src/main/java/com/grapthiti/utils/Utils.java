package com.grapthiti.utils;

import java.security.SecureRandom;
import java.util.Properties;

import org.apache.commons.lang3.ArrayUtils;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.graphiti.Constants;
import com.graphiti.repository.AmazonS3Repository;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.filter.HTTPBasicAuthFilter;
import com.sun.jersey.api.client.filter.LoggingFilter;

public class Utils {

	private Logger logger = LoggerFactory.getLogger(Utils.class);
	private final Properties properties  = Constants.getInstance().properties;
	
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
	
	/**
	 * Checks if the request body contains only updatable fields
	 * 
	 */
	public boolean isAssetFieldsUpdatable(JSONObject requestBody, String propertyName) {
		String allowedKeysString = (String) properties.get(propertyName);
		String[] allowedKeys = allowedKeysString.split(",");
		for(Object key: requestBody.keySet()) {
			String requestBodyKey = (String) key;
			if(ArrayUtils.indexOf(allowedKeys, requestBodyKey) != ArrayUtils.INDEX_NOT_FOUND) {
				return true;
			}
		}
		return false;
	} 
	
	/**
	 * Deleting an existing link
	 */
	public boolean deleteExistingObjectFromS3(String graphiti_tid,String bucketName,String key){
		try{
			AmazonS3Repository s3Repository = new AmazonS3Repository();
			s3Repository.deleteObject(bucketName, key);
			return true;
		}
		catch(Exception e){
			logger.error("graphiti-tid:{}.Error deleting the object from S3.",graphiti_tid);
			return false;
		}
	}
	
	/**
	 * Function for calculating range
	 * @param valueIn
	 * @param baseMin
	 * @param baseMax
	 * @param limitMin
	 * @param limitMax
	 * @return
	 */
	public static synchronized double calculateRange(final double valueIn, final double baseMin, final double baseMax, final double limitMin, final double limitMax) {
        return ((limitMax - limitMin) * (valueIn - baseMin) / (baseMax - baseMin)) + limitMin;
    }
}
