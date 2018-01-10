package com.graphiti;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

import com.graphiti.exceptions.JSONParseException;
import com.grapthiti.utils.Utils;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

@Component
public class OperationsAfterStartup implements ApplicationListener<ContextRefreshedEvent> {

  @Override
  public void onApplicationEvent(final ContextRefreshedEvent event) {
	  
  }
}
