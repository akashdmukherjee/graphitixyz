package com.grapthiti.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.graphiti.Constants;
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
}
