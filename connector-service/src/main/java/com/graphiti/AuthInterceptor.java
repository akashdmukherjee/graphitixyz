package com.graphiti;

import java.io.PrintWriter;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.fasterxml.jackson.annotation.JsonTypeInfo.Id;
import com.graphiti.client.externalServices.RedisService;

public class AuthInterceptor implements HandlerInterceptor{
	private Logger logger = LoggerFactory.getLogger(AuthInterceptor.class);
	
	@Override
	public void afterCompletion(HttpServletRequest request,
			HttpServletResponse response, Object arg2, Exception arg3)
			throws Exception {
		// TODO Auto-generated method stub
	}

	@Override
	public void postHandle(HttpServletRequest request, HttpServletResponse response,
			Object arg2, ModelAndView arg3) throws Exception {
		// TODO Auto-generated method stub
		
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
			Object arg2) throws Exception {
		if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
			return true;
		}
		RedisService redisService = new RedisService();
		Cookie[] cookies = request.getCookies();
		String memberId = request.getHeader("memberId");
		String graphitiTid = request.getHeader("graphiti-tid");
		String cookieName;
		String cookieValue;

		logger.info("graphiti-tid:{}. Path:{}. Cookies:{}. memberId:{}", graphitiTid, request.getServletPath(), cookies, memberId);
		if(memberId == null || graphitiTid == null) {
			PrintWriter responseWriter = response.getWriter();
			response.setStatus(HttpStatus.BAD_REQUEST.value());
			responseWriter.write("Bad Request. Either memberId or graphiti-tid is missing.");
			responseWriter.flush();
			return false;
		}
		
		boolean isSessionValidated = false;
		if (cookies != null){
			for(Cookie cookie: cookies) {
				cookieName = cookie.getName();
				cookieValue = cookie.getValue();
				if(cookieName.equalsIgnoreCase("graphiti-session-id")) {
					isSessionValidated = redisService.validateSession(graphitiTid, memberId, cookieValue);
					break;
				}
			}
		}
		if(!isSessionValidated) {
			PrintWriter responseWriter = response.getWriter();
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			responseWriter.write("Unauthorized");
			responseWriter.flush();
		}
		return isSessionValidated;
	}
}
