package com.graphiti;

import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.HttpPutFormContentFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@SpringBootApplication
@Configuration
public class Application extends SpringBootServletInitializer{	
	
	private static String ENCRYPTION_KEY;
	private static String INITVECTOR;
	private static final Logger logger = LoggerFactory.getLogger(Application.class);

	
	public static String getENCRYPTION_KEY() {
		// return ENCRYPTION_KEY;
		// As of now
		return "hC!8W(?cm:T=j]]r";
	}

	public static void setENCRYPTION_KEY(String eNCRYPTION_KEY) {
		ENCRYPTION_KEY = eNCRYPTION_KEY;
	}
	

	public static String getINITVECTOR() {
		// return INITVECTOR;
		// As of now 
		return "W*g,aS5n2enG`FKb";
	}

	public static void setINITVECTOR(String iNITVECTOR) {
		INITVECTOR = iNITVECTOR;
	}

	@Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }

    public static void main(String[] args) throws Exception{
    	logger.info("Starting Application.....");
    	SpringApplication.run(Application.class, args);
    	// Not required right now
    	// TODO - Dont know if this is the right place to have this here.
    	/*WebResource webResource = new Utils().getWebResource(Constants.getInstance().properties.getProperty("app-connection-url")+"/data/internal/getAccepatableDateFormats");
		Builder builder = webResource.header("graphiti-tid","1234").header("Accept","application/json");
		ClientResponse clientResonseData = builder.get(ClientResponse.class);
		String responseInString = clientResonseData.getEntity(String.class);
		JSONParser parser = new JSONParser();
		JSONObject returnedJSONObject = (JSONObject) parser.parse(responseInString);
		// Populate the cache with this 
		JSONArray acceptableDateFormats = (JSONArray) returnedJSONObject.get("acceptableDateFormats");
		for(int i=0;i<acceptableDateFormats.size();i++){
			InternalCache.getInstance().acceptableDateFormats.add((String)acceptableDateFormats.get(i));
		}*/
    }
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurerAdapter() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/pivotData").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/data/upload").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/connection/*").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/connection").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/connection/*/data").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/cache/dataAsset/*/*/uniqueValues").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/cache/dataAsset/*/columnNames").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/connection/testConnection").allowedMethods("POST").allowedOrigins("*");
//                registry.addMapping("/cache/dataAsset/*/generateQueryAndGetData").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/cache*").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//                registry.addMapping("/connection/{connectionId}/tables").allowedMethods("GET").allowedOrigins("*");
                  registry.addMapping("/ext/**").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
            }
        };
    }
    
    /*@Bean
    public FilterRegistrationBean someFilterRegistration() {
        FilterRegistrationBean registration = new FilterRegistrationBean();
        registration.setFilter(httpPutFormContentFilter());
        registration.addUrlPatterns("/*");
        registration.setName("httpPutFormContentFilter");
        registration.setOrder(1);
        registration.setDispatcherTypes(DispatcherType.REQUEST,DispatcherType.FORWARD);
    	registration.setMatchAfter(true);
        return registration;
    } 

    @Bean(name = "httpPutFormContentFilter")
    public Filter httpPutFormContentFilter() {
        return new HttpPutFormContentFilter();
    }*/
}
