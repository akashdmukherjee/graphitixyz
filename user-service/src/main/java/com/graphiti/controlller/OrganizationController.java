package com.graphiti.controlller;

import java.time.Instant;
import java.util.UUID;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.AmazonServiceException;
import com.graphiti.bean.Organization;
import com.graphiti.client.externalServices.CacheService;
import com.graphiti.client.externalServices.SearchService;
import com.graphiti.exceptions.CollectionCreationException;
import com.graphiti.exceptions.DatabaseCreationException;
import com.graphiti.exceptions.InvalidEmailException;
import com.graphiti.exceptions.OrganizationFoundException;
import com.graphiti.exceptions.OrganizationNotFoundException;
import com.graphiti.repository.AmazonS3Repository;
import com.graphiti.repository.OrganizationRepository;
import com.graphiti.utils.Utils;
import com.graphiti.validations.Validations;
import com.mongodb.util.JSON;


@RestController
public class OrganizationController {
	private Logger logger = LoggerFactory.getLogger(OrganizationController.class);

	@Autowired
	OrganizationRepository organizationRepository;
	
	// Make External
	@RequestMapping(value="/org", method=RequestMethod.POST, consumes="application/json")
	public ResponseEntity<?> createOrganization(@RequestHeader(value="graphiti-tid", required=true)String graphiti_tid, @RequestBody Organization organization) {
		try {
			logger.info("graphiti_tid:{} Organization: {} {}", graphiti_tid, organization.getDnsDomain(), organization.getEmailDomain());
			Organization existingOrganization = organizationRepository.getOrganization(organization.getName());
			if(existingOrganization != null) {
				logger.error("graphiti_tid: {}. Organization already registered:{}",graphiti_tid,existingOrganization.getName());
				throw new OrganizationFoundException("Organization already registered.");
			}
			logger.info("graphiti_tid: {}. Creating an entry in Organizations collection:{}",graphiti_tid, organization.getName());
			String orgId = UUID.randomUUID().toString();
			organization.setId(orgId);
			organization.setUnixTSOfOrgCreation(Instant.now().getEpochSecond());
			String randomName = Utils.generateRandomString(7);
			organization.setCacheDatabaseName(randomName);
			organization.setSearchCollectionName(randomName);
			organization.setS3BucketName(randomName);
			logger.info("graphiti_tid: {}. Created an entry in Organizations collection:{}",graphiti_tid, organization.getName());
			// We have to make REST calls here to create a database in Cache and create a entry in SOLR collections
			CacheService cacheService = new CacheService();
			SearchService searchService = new SearchService();
			AmazonS3Repository s3Repository = new AmazonS3Repository();
			boolean isOrgDeleted;
			try{
				cacheService.createDatabaseInCache(graphiti_tid, randomName);
				searchService.createCollection(graphiti_tid, randomName);
				s3Repository.createBucket(randomName);
				organizationRepository.save(organization);
				logger.info("graphiti_tid:{}. Successfully created a bucket on S3 with name:{} for orgId:{}", graphiti_tid, randomName, orgId);
			} catch(DatabaseCreationException e) {
				// revert created org
				isOrgDeleted = organizationRepository.deleteOrganization(organization.getName());
				logger.info("graphiti_tid:{} Deleting organization: {} Status: {}", graphiti_tid, organization.getName(), isOrgDeleted);
				return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
			} catch(CollectionCreationException e) {
				// revert created org and cache database
				isOrgDeleted = organizationRepository.deleteOrganization(organization.getName());
				logger.info("graphiti_tid:{} Deleting organization: {} Status: {}", graphiti_tid, organization.getName(), isOrgDeleted);
				cacheService.deleteDatabaseInCache(graphiti_tid, randomName);
				return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
			} catch(AmazonServiceException e) {
				logger.error("graphiti-tid:{}. Error occurred while creating a bucket on S3. Message:{}", graphiti_tid,e.getMessage());
				// revert all created collections/dbs
				isOrgDeleted = organizationRepository.deleteOrganization(organization.getName());
				logger.info("graphiti_tid:{} Deleting organization: {} Status: {}", graphiti_tid, organization.getName(), isOrgDeleted);
				cacheService.deleteDatabaseInCache(graphiti_tid, randomName);
				searchService.deleteCollection(graphiti_tid, randomName);
				return new ResponseEntity<String>("Error occurred while creating a bucket on S3", HttpStatus.INTERNAL_SERVER_ERROR);
			}
			
			JSONObject orgInformation = new JSONObject();
			orgInformation.put("orgId", orgId);
			orgInformation.put("orgName", organization.getName());
			orgInformation.put("dnsDomain", organization.getDnsDomain());
			
			return new ResponseEntity<JSONObject>(orgInformation, HttpStatus.CREATED);
		}
		catch (OrganizationFoundException e) {
			logger.error("graphiti_tid: {}.Exception Message:{}",graphiti_tid, e.getMessage());
			throw e;
		}
	}
	
	/**
	 * External API for /org
	 * method: createOrganization
	 */
	@RequestMapping(value="/ext/org", method=RequestMethod.POST, consumes="application/json")
	public ResponseEntity<?> extCreateOrganization(@RequestHeader(value="graphiti-tid", required=true)String graphiti_tid, @RequestBody Organization organization) {
		return createOrganization(graphiti_tid, organization);
	}
	
	///////// TODO - Need to Pass MemberId in the header
	@RequestMapping(value="/org/{orgId}", method=RequestMethod.GET, produces="application/json")
	public ResponseEntity<Organization> getOrganization(@RequestHeader(value="graphiti-tid", required=true)String graphiti_tid, @PathVariable("orgId") String orgId) {
		try {
			Query searchOrgQuery = new Query(Criteria.where("_id").is(orgId));
			Organization organization = organizationRepository.getOrganization(searchOrgQuery);
			return new ResponseEntity<Organization>(organization, HttpStatus.OK);
		} catch (OrganizationNotFoundException e) {
			logger.error("graphiti_tid:{}.Exception message:{}", graphiti_tid, e.getMessage());
			throw e;
		}
	}
	
	// Make External
	@RequestMapping(value="/org/verifyOrganization", method=RequestMethod.GET, produces="application/json")
	public ResponseEntity<JSONObject> verifyOrganization(@RequestHeader(value="graphiti-tid", required=true)String graphiti_tid, @RequestParam("email") String email) {
		try {
			boolean isValidEmail = Validations.isEmailValid(email);
			Organization existingOrganization;
			JSONObject response = new JSONObject();
			logger.info("graphiti_tid: {}.Checking if email is valid with email address:{}", graphiti_tid, email);
			if(isValidEmail) {
				existingOrganization = organizationRepository.organizationExists(email);
				logger.info("graphiti_tid: {}. Valid email address:{}", graphiti_tid, email);
			} else {
				logger.error("graphiti_tid: {}. Invalid email address:{}",graphiti_tid, email);
				throw new InvalidEmailException("Invalid Email.");
			}
			
			if(existingOrganization != null) {
				logger.info("graphiti_tid: {}. Organization exists associating with email address:{}",graphiti_tid, email);
				response.put("orgId", existingOrganization.getId());
				response.put("orgName", existingOrganization.getName());
				response.put("dnsDomain", existingOrganization.getDnsDomain());
			} else {
				logger.error("graphiti_tid: {}. Organization not exists associating with email address:{}",graphiti_tid, email);
				throw new OrganizationNotFoundException("No organization record found.");
			}
			return new ResponseEntity<JSONObject>(response, HttpStatus.OK);
		}
		catch(InvalidEmailException | OrganizationNotFoundException e) {
			logger.error("graphiti_tid:{}.Exception message:{}", graphiti_tid, e.getMessage());
			throw e;
		}
	}
	
	/**
	 * External API for /org/verifyOrganization
	 * method: verifyOrganization
	 */
	@RequestMapping(value="/ext/org/verifyOrganization", method=RequestMethod.GET, produces="application/json")
	public ResponseEntity<JSONObject> extVerifyOrganization(@RequestHeader(value="graphiti-tid", required=true)String graphiti_tid, @RequestParam("email") String email) {
		return verifyOrganization(graphiti_tid, email);
	}
}