package com.graphiti;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

import com.graphiti.config.RedisConfig;

@SpringBootApplication
public class RedisServiceApplication {
	
	public static void main(String[] args) {
		SpringApplication.run(RedisServiceApplication.class, args);
	}
}
