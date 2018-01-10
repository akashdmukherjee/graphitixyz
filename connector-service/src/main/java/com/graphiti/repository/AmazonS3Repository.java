package com.graphiti.repository;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.List;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.Bucket;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.transfer.Upload;
import com.amazonaws.util.IOUtils;
import com.graphiti.Constants;

public class AmazonS3Repository {
	private AmazonS3 s3client;
	
	public AmazonS3Repository() {
		init();
	}
	
	private void init() {
		Constants constants = Constants.getInstance();
		String awsAccessKeyId = constants.properties.getProperty("aws_access_key_id");
		String awsSecretAccessKey = constants.properties.getProperty("aws_secret_access_key");
		BasicAWSCredentials credentials = new BasicAWSCredentials(awsAccessKeyId, awsSecretAccessKey);
		s3client  = AmazonS3ClientBuilder.standard()
				.withRegion(Regions.US_WEST_2)
				.withCredentials(new AWSStaticCredentialsProvider(credentials)).build();
	}
	
	public void createBucket(String bucketName) {
		s3client.createBucket(bucketName);
	}
	
	public List<Bucket> getAllBuckets() {
		List<Bucket> buckets = s3client.listBuckets();
		return buckets;
	}
	
	public String upload(String bucketName, String keyName, InputStream fileInputStream, ObjectMetadata objectMetadata) {
		s3client.putObject(bucketName, keyName, fileInputStream, objectMetadata);
		return s3client.getUrl(bucketName, keyName).toString();
	}
	
	public String readObject(String bucketName,String key){
		try{
			S3Object s3object = s3client.getObject(new GetObjectRequest(bucketName, key));
			InputStream stream = s3object.getObjectContent();
			String sqlContent = IOUtils.toString(stream);
			return sqlContent;
		}
		catch(IOException e){
			return null;
		}	
	}
}
