package com.graphiti.repository;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.graphiti.Constants;

public class AmazonS3Repository {
	
	public void createBucket(String bucketName) {
		Constants constants = Constants.getInstance();
		String awsAccessKeyId = constants.properties.getProperty("aws_access_key_id");
		String awsSecretAccessKey = constants.properties.getProperty("aws_secret_access_key");
		BasicAWSCredentials credentials = new BasicAWSCredentials(awsAccessKeyId, awsSecretAccessKey);
		AmazonS3 s3client = AmazonS3ClientBuilder.standard()
							.withRegion(Regions.US_WEST_2)
							.withCredentials(new AWSStaticCredentialsProvider(credentials)).build();
		s3client.createBucket(bucketName);
	}
}
