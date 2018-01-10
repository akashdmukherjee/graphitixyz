package com.graphiti.controlller;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import javax.mail.internet.MimeMessage;
import javax.security.auth.message.callback.PrivateKeyCallback.Request;
import javax.ws.rs.core.Response;
import org.apache.http.Header;
import org.apache.velocity.app.VelocityEngine;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.SecurityProperties.Headers;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.ui.velocity.VelocityEngineUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.graphiti.Constants;
import com.graphiti.bean.Member;
import com.graphiti.bean.Organization;
import com.graphiti.bean.TeamMember;
import com.graphiti.bean.User;
import com.graphiti.client.externalServices.RedisService;
import com.graphiti.exceptions.EmailAddressOrPasswordIncorrect;
import com.graphiti.exceptions.InvalidEmailException;
import com.graphiti.exceptions.MemberAlreadyActivatedException;
import com.graphiti.exceptions.MemberAlreadyRegisteredWithEmailAddress;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.OrganizationNotFoundException;
import com.graphiti.exceptions.VerificationLinkExpiredException;
import com.graphiti.repository.MemberRepository;
import com.graphiti.repository.OrganizationRepository;
import com.graphiti.repository.UserRepository;
import com.graphiti.security.Hash;
import com.graphiti.utils.Utils;
import com.graphiti.validations.Validations;
import com.mongodb.util.JSON;

@SuppressWarnings("deprecation")
@RestController
public class MemberRegistrationController {
    
	private Logger logger = LoggerFactory.getLogger(MemberRegistrationController.class);
	
	@Autowired
	MemberRepository memberRepository;
	
	@Autowired
	UserRepository userRepository;
	
	@Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private VelocityEngine velocityEngine;
    
    @Autowired
    private OrganizationRepository organizationRepository;
	
	@RequestMapping(value="/ext/member/signUp",method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<JSONObject> signUpMember(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody Member member){
		try{
			long startTime = System.currentTimeMillis();
			logger.info("graphiti_tid: {}.Checking if there is a email address registered with email address:{}",graphiti_tid,member.getEmailAddress());
			Query searchQueryForMember = new Query(Criteria.where("emailAddress").is(member.getEmailAddress()));
			Member existingMember = memberRepository.getMember(searchQueryForMember);
			if(existingMember!=null){
				logger.error("graphiti_tid: {}.Member already registered with email address:{}",graphiti_tid,member.getEmailAddress());
				throw new MemberAlreadyRegisteredWithEmailAddress("Member is already registered with exisiting email addresses");
			}
			logger.info("graphiti_tid: {}.No user present with the email address:{}",graphiti_tid,member.getEmailAddress());
			logger.info("graphiti_tid: {}.Creating an entry in Member collection",graphiti_tid);
			String emailDomain = organizationRepository.extractSubdomain(member.getEmailAddress());
			logger.info("graphiti-tid:{}. Checking if Org with emailDomain:{} exists in Organizations collection.", graphiti_tid, emailDomain);
			Query searchQueryForOrg = new Query(Criteria.where("name").is(emailDomain));
			Organization organization = organizationRepository.getOrganization(searchQueryForOrg);
			if(organization == null) {
				throw new OrganizationNotFoundException("Organization not found.");
			}
			member.setOrganizationId(organization.getId());
			String memberId = UUID.randomUUID().toString(); // TODO - This needs to be changed. Need to make a short random string
			member.setId(memberId);
			member.setVerificationStatus("NEW");// This is set since the member is signing up for the first time
			String generateRandomKey = Utils.generateRandomAlphaNumericString(40);
			String activationLink = Constants.getInstance().properties.getProperty("activationLinkURL")+memberId+"?key="+generateRandomKey;
			member.setVerificationURL(activationLink);
			member.setVerificationKey(generateRandomKey);
			member.setUnixTSOfUpdOfVeriURL(Instant.now().getEpochSecond());// This will basically be the server time
			memberRepository.save(member,false);
			logger.info("graphiti_tid: {}. Created an entry in Member collection with id:{}",graphiti_tid,memberId);
			
			logger.info("graphiti_tid: {}. Creating an entry in User collection",graphiti_tid);
			User user = new User();
			user.setName(member.getFullName());
			String organizationId = member.getOrganizationId()!=null ? member.getOrganizationId() : (String) Constants.getInstance().properties.get("default-organization");
			user.setOrganization(organizationId);
			user.setType("USER");
			user.setId(memberId);
			userRepository.save(user);
			logger.info("graphiti_tid: {}. Created an entry in User collection",graphiti_tid);
			
			logger.info("graphiti_tid: {}. Sending confirmation email to user with email address:{}",graphiti_tid,member.getEmailAddress());
			this.sendConfirmationEmail(member);
			JSONObject memberInformation = new JSONObject();
			memberInformation.put("memberId",memberId);
			long endTime = System.currentTimeMillis();
			logger.info("execution time:"+((endTime-startTime)/1000));
			return new ResponseEntity<JSONObject>(memberInformation,HttpStatus.CREATED);
		}
		catch(MemberAlreadyRegisteredWithEmailAddress e){
			logger.error("graphiti_tid:{}. Member already registered with email:",graphiti_tid,member.getEmailAddress());
			throw e;
		}
	}
	
	@RequestMapping(value="/ext/member/activate",method = RequestMethod.PUT,consumes = "application/json",produces = "application/text")
	public ResponseEntity<String> activateMember(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String memberInformation){
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObjectOfMemberInformation = (JSONObject) jsonParser.parse(memberInformation);
			logger.info("graphiti_tid: {}.Activating Member with id {}:",graphiti_tid,jsonObjectOfMemberInformation.get("memberId"));
			boolean status = memberRepository.activateMember((String) jsonObjectOfMemberInformation.get("memberId"),(String) jsonObjectOfMemberInformation.get("key"));
			if(status==true){
				logger.info("graphiti_tid: {}.Member already activated:{}",graphiti_tid,jsonObjectOfMemberInformation.get("memberId"));
				return new ResponseEntity<String>("Member has been activated!!",HttpStatus.OK);
			}
			else{
				logger.error("graphiti_tid: {}.Member could not be activated:{}",graphiti_tid,jsonObjectOfMemberInformation.get("memberId"));
				return new ResponseEntity<String>("Member has not been activated!!",HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
		catch(VerificationLinkExpiredException | MemberNotFoundException | MemberAlreadyActivatedException  e){
			// Log the error here
			logger.error("graphiti_tid:{}.Exception Message:{}",graphiti_tid,e.getMessage());
			throw e;
		}
	}
	
	@RequestMapping(value="/ext/member/resetPassword",method = RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> resetPassword(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String memberInformation){
		try{
			JSONParser jsonParser = new JSONParser ();
			JSONObject jsonObjectOfMemberInformation = (JSONObject) jsonParser.parse(memberInformation);
			// First check if the member is present with the specified email address
			logger.info("graphiti_tid:{}.Checking if the email address is registered:{}",graphiti_tid,jsonObjectOfMemberInformation.get("emailAddress"));
			Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("emailAddress").is(jsonObjectOfMemberInformation.get("emailAddress"))));
			Member member = memberRepository.getMember(searchMemberQuery);
			if(member == null){ // member not present
				logger.error("graphiti_tid:{}.No member found with email address:{}",graphiti_tid,jsonObjectOfMemberInformation.get("emailAddress"));
				throw new MemberNotFoundException("Email address "+jsonObjectOfMemberInformation.get("emailAddress")+" is not found");
			}
			// Generate a random key
			String generateRandomKey = Utils.generateRandomAlphaNumericString(40);
			String resetPasswordLink = Constants.getInstance().properties.getProperty("passwordReset")+member.getId()+"?key="+generateRandomKey;
			long currentTimeStamp = Instant.EPOCH.getEpochSecond();
			boolean status = memberRepository.updateVerificationLink(member.getId(),resetPasswordLink,generateRandomKey,currentTimeStamp);
			if(status==true){
				//Once the updation is successful, lets send the verification link via mail
				logger.info("graphiti_tid:{}.Found the member. Now sending verification mail to the registered email address:{}",graphiti_tid,jsonObjectOfMemberInformation.get("emailAddress"));
				this.sendPasswordResetEmail(member.getEmailAddress(),member.getFullName(),resetPasswordLink);
			}
			else{
				return new ResponseEntity<String>("Member password could not be reset",HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
		catch(MemberNotFoundException e){
			logger.error("graphiti_tid:{}.No member found for the specified email address",graphiti_tid);
			throw e;
		}
		return null;
	}
	
	@RequestMapping(value="/ext/member/resendVerificationLink",method = RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> resendVerificationLink(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String memberInformation){
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObjectOfMemberInformation = (JSONObject) jsonParser.parse(memberInformation);
			logger.info("graphiti_tid:{}.Checking if memberId is registered:{}",graphiti_tid,jsonObjectOfMemberInformation.get("id"));
			// First check if the member is present with the specified email address
			Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("id").is(jsonObjectOfMemberInformation.get("id"))));
			Member member = memberRepository.getMember(searchMemberQuery);
			if(member == null){ // member not present
				logger.error("graphiti_tid:{}.No member found with id:{}",graphiti_tid,jsonObjectOfMemberInformation.get("id"));
				throw new MemberNotFoundException("Member Id "+jsonObjectOfMemberInformation.get("id")+" is not found");
			}
			// Generate a random key
			String generateRandomKey = Utils.generateRandomAlphaNumericString(40);
			String resendVerificationLink = Constants.getInstance().properties.getProperty("activationLinkURL")+member.getId()+"?key="+generateRandomKey;
			long currentTimeStamp = Instant.EPOCH.getEpochSecond();
			member.setVerificationURL(resendVerificationLink);
			member.setVerificationKey(generateRandomKey);
			member.setUnixTSOfUpdOfVeriURL(currentTimeStamp);
			boolean status = memberRepository.updateVerificationLink(member.getId(),resendVerificationLink,generateRandomKey,currentTimeStamp);
			if(status==true){
				//Once the updation is successful, lets send the verification link via mail
				logger.info("graphiti_tid:{}.Found the member. Now sending verification mail to the registered email address:{}",graphiti_tid,jsonObjectOfMemberInformation.get("emailAddress"));
				this.sendConfirmationEmail(member);
			}
			else{
				return new ResponseEntity<String>("Verification link could not be sent",HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
		catch(MemberNotFoundException e){
			logger.error("graphiti_tid:{}.No member found for the specified email address",graphiti_tid);
			throw e;
		}
		return null;
	}
	
 	
	@RequestMapping(value="/ext/member/updatePassword",method = RequestMethod.PUT,consumes = "application/json")
	public ResponseEntity<?> updatePassword(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String memberInformation){
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObjectOfMemberInformation = (JSONObject) jsonParser.parse(memberInformation);
			boolean status = memberRepository.changePassword((String) jsonObjectOfMemberInformation.get("memberId"),null,(String) jsonObjectOfMemberInformation.get("newPassword"),false);
			if(status==true){
				return new ResponseEntity<String>("Member password has been updated!!",HttpStatus.OK);
			}
			else{
				return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
		catch(MemberNotFoundException e){
			throw e;
		}
	}
	
	
	@RequestMapping(value="/ext/member/changePassword",method = RequestMethod.PUT,consumes = "application/json")
	public ResponseEntity<?> changePassword(@RequestHeader(value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String memberInformation){
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObjectOfMemberInformation = (JSONObject) jsonParser.parse(memberInformation);
			// In this case we have to check the old password so making it true
			boolean status = memberRepository.changePassword((String) jsonObjectOfMemberInformation.get("memberId"),(String) jsonObjectOfMemberInformation.get("oldPassword"),(String) jsonObjectOfMemberInformation.get("newPassword"),true);
			if(status==true){
				return new ResponseEntity<>(null,HttpStatus.OK);
			}
			else{
				return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
	}
	
	@RequestMapping(value="/member/signInThirdPartyAuth",method = RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> signInThirdPartyAuth(@RequestHeader (value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String information){
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObjectOfInformation = (JSONObject) jsonParser.parse(information);
			// Validate if the the token is a valid token provided by Google 
			JacksonFactory jacksonFactory = new JacksonFactory();
			GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), jacksonFactory).setAudience(Collections.singletonList("156015404188-7rd2v2qqf40k0vp9g811i33qdqte1bet.apps.googleusercontent.com")).build();
			GoogleIdToken idToken = verifier.verify((String)jsonObjectOfInformation.get("idTokenString"));
			// Lets check the token
			String audience = (String) idToken.getPayload().get("aud");
			// We have to first check if audience is equal to our client ID
			if(audience.equalsIgnoreCase("156015404188-7rd2v2qqf40k0vp9g811i33qdqte1bet.apps.googleusercontent.com")){
				// Now the user is authenticated
				// Lets find out if the user is there in the db
				// Get the member first
				Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("emailAddress").is(jsonObjectOfInformation.get("emailAddress")),Criteria.where("emailAddress").exists(true)));
				Member member = memberRepository.getMember(searchMemberQuery);
				if(member == null) { // Member does not exist in DB
					// Make an entry in DB
					member = new Member();
					Query searchQueryForOrg = new Query(Criteria.where("name").is("graphiti-default-org"));
					Organization organization = organizationRepository.getOrganization(searchQueryForOrg);
					if(organization == null) {
						throw new OrganizationNotFoundException("Organization not found.");
					}
					member.setOrganizationId(organization.getId());
					member.setFullName((String)jsonObjectOfInformation.get("name"));
					String memberId = UUID.randomUUID().toString(); // TODO - This needs to be changed. Need to make a short random string
					member.setId(memberId);
					member.setVerificationStatus("ACTIVATE");// This is set since the member is signing up for the first time
					memberRepository.save(member,true);
				}
				// Set Session Cookies. This is set irrespective of the user is present or not
				RedisService redisService = new RedisService();
				HttpHeaders httpHeaders = new HttpHeaders();
				SimpleDateFormat COOKIE_EXPIRES_HEADER_FORMAT = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz");
				Date date = new Date();
			    //d.setTime(2147483647 * 1000);
			    date.setYear(date.getYear()+20); // 20 years
			    String cookieLifeTime = COOKIE_EXPIRES_HEADER_FORMAT.format(date);
			    String sessionId = redisService.setSession(graphiti_tid, member.getId());
			    httpHeaders.add("Set-Cookie", "memberId="+member.getId()+";Expires="+cookieLifeTime+";Path=/; HttpOnly");
			    httpHeaders.add("Set-Cookie", "graphiti-session-id="+sessionId+";Expires="+cookieLifeTime+";Path=/; HttpOnly");
				return new ResponseEntity<>(member, httpHeaders, HttpStatus.OK);
			}
			else{
				// throw authentication exception
				return new ResponseEntity<>(null,HttpStatus.UNAUTHORIZED);
			}
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
		catch(MemberNotFoundException e){
			throw e;
		}
		catch(EmailAddressOrPasswordIncorrect e){
			throw e;
		} catch (GeneralSecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}
	
	@RequestMapping(value="/ext/member/signInThirdPartyAuth",method = RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> extsignInThirdPartyAuth(@RequestHeader (value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String information){
		return signInThirdPartyAuth(graphiti_tid, information);
	}
	
	@RequestMapping(value="/ext/member/signIn",method = RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<?> signIn(@RequestHeader (value="graphiti-tid",required=true)String graphiti_tid,@RequestBody String memberInformation){
		try{
			JSONParser jsonParser = new JSONParser();
			JSONObject jsonObjectOfMemberInformation = (JSONObject) jsonParser.parse(memberInformation);
			// Get the member first
			Query searchMemberQuery = new Query(new Criteria().andOperator(Criteria.where("emailAddress").is(jsonObjectOfMemberInformation.get("emailAddress"))));
			Member member = memberRepository.getMember(searchMemberQuery);
			if(member==null){
				logger.error("graphiti_tid:{}.Member not found with email:{}",graphiti_tid,jsonObjectOfMemberInformation.get("emailAddress"));
				throw new MemberNotFoundException("No user found with the emailAddress:"+jsonObjectOfMemberInformation.get("emailAddress"));
			}
			// TODO -  Right now validating locally about password. Need to move this outside
			boolean status = validatePassword(member.getId(),member.getOrganizationId(),(String) jsonObjectOfMemberInformation.get("password"));
			if(status == false){ // invalid userEmail address or password
				logger.error("graphiti_tid:{}. Either the email address or the password is incorrect");
				throw new EmailAddressOrPasswordIncorrect("Either the email address or the password is incorrect");
			}
			// Set Session Cookies
			RedisService redisService = new RedisService();
			HttpHeaders httpHeaders = new HttpHeaders();
			SimpleDateFormat COOKIE_EXPIRES_HEADER_FORMAT = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz");
			Date date = new Date();
		    //d.setTime(2147483647 * 1000);
		    date.setYear(date.getYear()+20); // 20 years
		    String cookieLifeTime = COOKIE_EXPIRES_HEADER_FORMAT.format(date);
		    String sessionId = redisService.setSession(graphiti_tid, member.getId());
		    httpHeaders.add("Set-Cookie", "memberId="+member.getId()+";Expires="+cookieLifeTime+";Path=/; HttpOnly");
		    httpHeaders.add("Set-Cookie", "graphiti-session-id="+sessionId+";Expires="+cookieLifeTime+";Path=/; HttpOnly");
			return new ResponseEntity<>(member, httpHeaders, HttpStatus.OK);
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}.JSON Parse Exception for incoming request",graphiti_tid);
			return new ResponseEntity<String>("JSON Parsing Exception.Could not parse the incoming request",HttpStatus.BAD_REQUEST);
		}
		catch(MemberNotFoundException e){
			throw e;
		}
		catch(EmailAddressOrPasswordIncorrect e){
			throw e;
		}
	}
	
	/***
	 * 
	 * @param passwordPassedByUser
	 * @param actualPassword
	 * @return
	 */
	private boolean validatePassword(String memberId,String orgId,String passwordPassedByUser){
		Member member = memberRepository.getHashedPasswordAndSalt(memberId, orgId);
		String hashedPassword = Hash.getSHA512SecurePassword(passwordPassedByUser,member.getSalt().getBytes());
		// TODO - convert actual Password to Hash
		if(hashedPassword.equals(member.getHashedPassword())){
			return true;
		}
		else{
			return false;
		}
	}
	
	/**
	 * TODO - Need to move it outside
	 * MAIL FOR VERIFICATION
	 * @param member
	 */
	private void sendConfirmationEmail(final Member member) {
		logger.info("Seding confirmation Email...");
        MimeMessagePreparator preparator = new MimeMessagePreparator() {
            @SuppressWarnings("deprecation")
			@Override
            public void prepare(MimeMessage mimeMessage) throws Exception {
                MimeMessageHelper message = new MimeMessageHelper(mimeMessage);
                message.setTo(member.getEmailAddress());
                message.setSubject(Constants.SUBJECT_MAIL_REGISTRATION_CONFIRMATION);

                Map<String,Object> model = new HashMap<String,Object>();
                model.put("member", member);

                message.setText(VelocityEngineUtils.mergeTemplateIntoString(velocityEngine
                        , "registration-confirmation.vm", Constants.CHARSET_UTF8, model), true);
            }
        };
        this.javaMailSender.send(preparator);
        logger.info("Confirmation Email Sent!!!");
    }
	
	/**
	 * 
	 * TODO - Need to move it outside
	 * MAIL FOR PASSWORD RESET
	 * @param emailAddress
	 * @param memberName
	 * @param verificationLink
	 */
	private void sendPasswordResetEmail(final String emailAddress,final String memberName,final String verificationLink) {
        MimeMessagePreparator preparator = new MimeMessagePreparator() {
            @SuppressWarnings("deprecation")
			@Override
            public void prepare(MimeMessage mimeMessage) throws Exception {
                MimeMessageHelper message = new MimeMessageHelper(mimeMessage);
                message.setTo(emailAddress);
                message.setSubject(Constants.SUBJECT_MAIL_PASSWORD_RESET);

                Map<String,Object> model = new HashMap<String,Object>();
                model.put("memberName", memberName);
                model.put("verificationLink",verificationLink);

                message.setText(VelocityEngineUtils.mergeTemplateIntoString(velocityEngine
                        , "password-reset.vm", Constants.CHARSET_UTF8, model), true);
            }
        };
        this.javaMailSender.send(preparator);
    }
}