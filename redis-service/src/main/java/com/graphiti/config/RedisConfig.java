package com.graphiti.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.graphiti.Constants;

@Configuration
public class RedisConfig {
	private final Properties properties = Constants.getInstance().properties;
	private final String redisHostname = properties.getProperty("redis-hostname");
	private final int redisPort = Integer.parseInt(properties.getProperty("redis-port"));
	
	@Bean
	JedisConnectionFactory jConnectionFactory() {
		JedisConnectionFactory factory = new JedisConnectionFactory();
		factory.setHostName(redisHostname);
	    factory.setPort(redisPort);
	    factory.setUsePool(true);
	    return factory;
	}
	
	@Bean
	public RedisTemplate<String, Object> template() {
	    RedisTemplate<String, Object> template = new RedisTemplate<String, Object>();
	    template.setConnectionFactory(jConnectionFactory());
	    template.setKeySerializer(new StringRedisSerializer());
	    template.setHashKeySerializer(new StringRedisSerializer());
	    return template;
	}
}
