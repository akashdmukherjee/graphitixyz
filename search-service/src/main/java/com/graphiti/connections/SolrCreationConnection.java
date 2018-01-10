package com.graphiti.connections;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.apache.catalina.CredentialHandler;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultHttpRequestRetryHandler;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.solr.client.solrj.impl.CloudSolrClient;
import org.apache.solr.client.solrj.impl.HttpSolrClient;

import com.graphiti.Constants;
import com.graphiti.pool.ObjectPool;

public class SolrCreationConnection extends ObjectPool<CloudSolrClient>{
	private String collectionName;
	private static String zookeperServerURL;
	private static Map<String, SolrCreationConnection> solrCreationConnectionMap;
	
	static {
		zookeperServerURL = Constants.getInstance().properties.getProperty("zookeeper-hostnames");
		solrCreationConnectionMap = new HashMap<>();
	}
	
	private SolrCreationConnection(String collectionName){
		super();
		this.collectionName = collectionName;
	}

	public static SolrCreationConnection getInstance(String collectionName) {
	    SolrCreationConnection solrCreationConnectionInstance = solrCreationConnectionMap.get(collectionName);
	    if (solrCreationConnectionInstance == null) {
	        solrCreationConnectionInstance = new SolrCreationConnection(collectionName);
	        solrCreationConnectionMap.put(collectionName, solrCreationConnectionInstance);
        }
        return solrCreationConnectionInstance;
    }
	
	@Override
	protected CloudSolrClient create() {
		String zkHostsString = zookeperServerURL;
		CloudSolrClient server = new CloudSolrClient.Builder().withZkHost(zkHostsString).build();
		server.setDefaultCollection(this.collectionName);
		return server;
	}
	
	@Override
	public boolean validate(CloudSolrClient o) {
		// TODO Auto-generated method stub
		return true;
	}
	
	@Override
	public void expire(CloudSolrClient o) {
		try {
			o.close();
		} catch (IOException e) {
			// TODO
			e.printStackTrace();
		}
	}
}