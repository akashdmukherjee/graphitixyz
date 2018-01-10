package com.graphiti;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.graphiti.repository.Repo;


@SpringBootApplication
public class Application 
{
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}
}
