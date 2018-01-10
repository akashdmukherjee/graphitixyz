package com.graphiti.repository;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;

import com.graphiti.bean.Organization;


/**
 * Organization Repository
 * 
 * @author 
 *
 */
@Repository
public class OrganizationRepository {
	
	@Autowired
	MongoTemplate mongoTemplate;
	
	/**
	 * To save an organization
	 * @param Organization
	 */
	public void save(Organization organization) {
		mongoTemplate.save(organization, "Organizations");
	}
	
	/**
	 * To extract subdomain from email(work)
	 * @param email
	 * @return
	 */
	public String extractSubdomain(String email) {
		Pattern pattern = Pattern.compile("@(.*)", Pattern.CASE_INSENSITIVE);
		Matcher matcher = pattern.matcher(email);
		String subdomain = "";
		if(matcher.find()) {
			subdomain = matcher.group(1);
		}
		return subdomain;
	}
	
	/**
	 * To verify subdomain and check if it exists
	 * @param email
	 */
	public Organization organizationExists(String email) {
		return this.getOrganization(this.extractSubdomain(email));
	}
	
	/**
	 * To check if organization exists
	 * @param name
	 */
	public Organization getOrganization(String emailDomain) {
		Query searchOrgQuery = new Query(Criteria.where("name").is(emailDomain));
		Organization organization = mongoTemplate.findOne(searchOrgQuery, Organization.class, "Organizations");
		return organization;
	}
	
	/**
	 * Get details for the organization
	 * based on the query
	 * @param searchQuery
	 */
	public Organization getOrganization(Query searchQuery) {
		Organization organization = mongoTemplate.findOne(searchQuery, Organization.class, "Organizations");
		return organization;
	}
	
	/**
	 * Deletes organization
	 * @param orgName
	 */
	public boolean deleteOrganization(String orgName) {
		Query deleteOrgQuery = new Query(Criteria.where("name").is(orgName));
		return mongoTemplate.remove(deleteOrgQuery, Organization.class, "Organizations").getN() == 1;
	}
}
