package com.graphiti;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@Configuration
public class Config extends WebMvcConfigurerAdapter {
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(new AuthInterceptor()).addPathPatterns("/ext/**")
				.excludePathPatterns(
						"/ext/org",
						"/ext/org/verifyOrganization",
						"/ext/member/resetPassword",
						"/ext/member/exists",
						"/ext/member/signIn",
						"/ext/member/signInThirdPartyAuth",
						"/ext/member/signUp"
				);

	}
}