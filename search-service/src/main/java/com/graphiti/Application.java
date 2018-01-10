package com.graphiti;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application extends SpringBootServletInitializer{	
	
	
	@Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }
	
	// Not required now
	@Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurerAdapter() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
//            	registry.addMapping("/search/asset/tags").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//            	registry.addMapping("/search/asset").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
//            	registry.addMapping("/search/asset/autocomplete").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
            	registry.addMapping("/ext/**").allowedMethods("GET","POST","DELETE","PUT").allowedOrigins("*");
            	
            }
        };
    }
	
	public static void main(String[] args) throws Exception{
		SpringApplication.run(Application.class, args);
	}
}
