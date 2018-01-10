package com.graphiti.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.graphiti.Application;
import com.graphiti.Constants;
import com.graphiti.bean.ChartConfigurations;
import com.graphiti.exceptions.JDBCConnectionCloseException;
import com.graphiti.exceptions.TableCreationInCacheException;
import com.graphiti.repository.CacheRepository;
import com.grapthiti.utils.DateUtil;

@RestController
public class DataUtilController {
	
	Logger logger = LoggerFactory.getLogger(DataUtilController.class);
	
	@RequestMapping(value="/data/getDataTypes",method=RequestMethod.POST,consumes = "application/json", produces = "application/json")
    public ResponseEntity<Object> getDataTypes(@RequestHeader(value="memberId",required=true) String memberId,@RequestHeader(value="graphiti-tid")String graphiti_tid,@RequestBody String jsonString){
		try{
			JSONParser parser = new JSONParser();
			Object obj = parser.parse(jsonString);
			jsonString = null; 
			JSONObject returningJSONObject = (JSONObject) getDataTypes(obj);
			return new ResponseEntity<Object>(returningJSONObject,HttpStatus.OK);
		}
		catch(ParseException e){
			return new ResponseEntity<Object>("There was error parsing the JSON",HttpStatus.INTERNAL_SERVER_ERROR);
		}
    }
	
	public Object getDataTypes(Object obj) throws ParseException{
		try{
			Map<String,String> mapKeysAndDataTypes = new HashMap<String,String>();
			if(obj instanceof JSONArray){
				JSONArray jsonArray = (JSONArray) obj;// Typecasting 
				for (int i = 0; i < jsonArray.size(); i++) {
					JSONObject localJSONObject = (JSONObject) jsonArray.get(i);
					mapKeysAndDataTypes = getDataTypesForObjects(localJSONObject,mapKeysAndDataTypes);
				}
			}
			else if(obj instanceof JSONObject){
				JSONObject localJSONObject = (JSONObject) obj;
				mapKeysAndDataTypes = getDataTypesForObjects(localJSONObject,mapKeysAndDataTypes);
			}
			else{
				// Throw error
			}
			JSONObject returningJSONObject = new JSONObject(mapKeysAndDataTypes);
			return returningJSONObject;
		}
		catch(ParseException e){
			throw e;
		}
	}
	
	/**
	 * Create table on basis of datatypes passed
	 * @param databaseName the name of the database in cache
	 * @param datasetName
	 * @param keysAndDataTypes JSONObject consisting of columns and their 
	 * 		  corresponding datatypes
	 * @return true/false based on successfull creation                                                                                        
	 * @throws Exception 
	 */
	 public boolean createTableInCacheBasedOnDatatypes(String graphiti_tid,String databaseName,String datasetName,JSONObject jsonObjectOfDataTypes,String organizationId) throws TableCreationInCacheException,JDBCConnectionCloseException{
		 CacheRepository cacheRepository = new CacheRepository();
		 try{
			 StringBuffer createTableStringBuffer = new StringBuffer();
			 createTableStringBuffer.append("CREATE table "+datasetName+"(");
			 //createTableStringBuffer.append("GRAPHITI_ID SERIAL,"); // This will be default there for every table
			 Iterator<String> columnsIterator = jsonObjectOfDataTypes.keySet().iterator();
			 while(columnsIterator.hasNext()){
				 String columnKey = columnsIterator.next();
				 if(((String)(jsonObjectOfDataTypes.get(columnKey))).equalsIgnoreCase("String")){
					 // TODO - env.getProperty("lengthOfStringDataTypeInCache")
					 createTableStringBuffer.append(columnKey+" "+"VARCHAR("+Constants.getInstance().properties.getProperty("lengthOfStringDataTypeInCache")+"),");// TODO- Take this out of loop
				 }
				 else if(((String)(jsonObjectOfDataTypes.get(columnKey))).equalsIgnoreCase("Integer")){
					 createTableStringBuffer.append(columnKey+" "+"BIGINT"+",");
				 }
				 else if(((String)(jsonObjectOfDataTypes.get(columnKey))).equalsIgnoreCase("Decimal")){
					 createTableStringBuffer.append(columnKey+" "+"DOUBLE PRECISION"+",");
				 }
				 else if(((String)(jsonObjectOfDataTypes.get(columnKey))).equalsIgnoreCase("Date")){
					 createTableStringBuffer.append(columnKey+" "+"DATE"+",");
				 }
				 else if(((String)(jsonObjectOfDataTypes.get(columnKey))).equalsIgnoreCase("Timestamp")){
					 createTableStringBuffer.append(columnKey+" "+"TIMESTAMP"+",");
				 }
			 }
			 String createTableString = createTableStringBuffer.toString();
			 createTableString = createTableString.substring(0,createTableString.length()-1); // remove the last comma
			 createTableString = createTableString + ")";
			 logger.info("Creating a table in database: {}. Create Table Statement: {}",databaseName,createTableString);
			 // Create a table in Cache
			 boolean createTableStatus = cacheRepository.createTable(graphiti_tid,databaseName, createTableString,organizationId);
			 return createTableStatus;
		 }
		 catch(TableCreationInCacheException e){
			 throw e; // This cannot be avoided 
		 }
		 catch(JDBCConnectionCloseException e){
			 throw e; // This can be avoided 
		 }
	 }
	
	// Very simple query generation - Need to improve on it
	/**
	 * 
	 * @param chartConfigs
	 * @param dataStore
	 * @return
	 */
	public String generateQuery(ChartConfigurations chartConfigs,String dataStore){
		StringBuffer queryBuffer = new StringBuffer();
		queryBuffer.append("SELECT ");
		Set<String> dimentionEncodingToBeConsidered = null;
		Set<String> metricsEncodingToBeConsidered = null;
		if(chartConfigs.getTypeOfChart().equalsIgnoreCase("BAR")){
			// If there is metrics in YEncoding then its assumed that dimentions are in XEncoding
			if(chartConfigs.getYaxisVencoding().getMetrics().size()>0){
				metricsEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigs.getYaxisVencoding().getMetrics());
				dimentionEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigs.getXaxisVencoding().getDimensions());
			}
			else{
				metricsEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigs.getXaxisVencoding().getMetrics());
				dimentionEncodingToBeConsidered = new LinkedHashSet<String>(chartConfigs.getYaxisVencoding().getDimensions());
			}
		}
		else if(chartConfigs.getTypeOfChart().equalsIgnoreCase("SCATTER")){
			metricsEncodingToBeConsidered = new LinkedHashSet<String>();
			dimentionEncodingToBeConsidered = new LinkedHashSet<String>();
			if(chartConfigs.getYaxisVencoding().getMetrics().size()>0){
				metricsEncodingToBeConsidered.addAll(chartConfigs.getYaxisVencoding().getMetrics());
			}
			if(chartConfigs.getXaxisVencoding().getMetrics().size()>0){
				metricsEncodingToBeConsidered.addAll(chartConfigs.getXaxisVencoding().getMetrics());
			}
			if(chartConfigs.getYaxisVencoding().getDimensions().size()>0){
				dimentionEncodingToBeConsidered.addAll(chartConfigs.getYaxisVencoding().getDimensions());
			}
			if(chartConfigs.getXaxisVencoding().getDimensions().size()>0){
				dimentionEncodingToBeConsidered.addAll(chartConfigs.getXaxisVencoding().getDimensions());
			}
		}
		// We have to do a check here
		// Make sure that all the metrics are aggregations if there is atleast one aggregation
		// Similar thing is there is tableau
		boolean areMetricsAggregations = checkIfMetricsAreAggregations(metricsEncodingToBeConsidered);
		// Converting to arrayList so that it can be accessed via index
		ArrayList<String> dimentionEncodingToBeConsideredInAL = new ArrayList<String>(dimentionEncodingToBeConsidered);
		ArrayList<String> metricsEncodingToBeConsideredInAL = new ArrayList<String>(metricsEncodingToBeConsidered);
		
		if(metricsEncodingToBeConsideredInAL!=null && metricsEncodingToBeConsideredInAL.size()>0){
			for(int i=0;i<metricsEncodingToBeConsideredInAL.size();i++){
				String alias = metricsEncodingToBeConsideredInAL.get(i).replace("(", "____").replace(")","____");
				if ((i == metricsEncodingToBeConsideredInAL.size() - 1)
						&& dimentionEncodingToBeConsideredInAL.size() == 0
						&& chartConfigs.getColorEncoding().getDimensions().size() == 0
						&& chartConfigs.getDetailEncoding().getDimensions().size() == 0) {
					queryBuffer.append(metricsEncodingToBeConsideredInAL.get(i)+" AS "+alias+" ");
				}
				else{
					queryBuffer.append(metricsEncodingToBeConsideredInAL.get(i)+" AS "+alias+",");
				}
			}
			for(int i=0;i<dimentionEncodingToBeConsideredInAL.size();i++){
				if((i==dimentionEncodingToBeConsideredInAL.size()-1) && chartConfigs.getColorEncoding().getDimensions().size()==0 && chartConfigs.getDetailEncoding().getDimensions().size()==0){
					queryBuffer.append(dimentionEncodingToBeConsideredInAL.get(i)+" ");	
				}
				else{
					queryBuffer.append(dimentionEncodingToBeConsideredInAL.get(i)+",");	
				}
			}
			for(int i=0;i<chartConfigs.getColorEncoding().getDimensions().size();i++){
				if((i==chartConfigs.getColorEncoding().getDimensions().size()-1) && chartConfigs.getDetailEncoding().getDimensions().size()==0){
					queryBuffer.append(chartConfigs.getColorEncoding().getDimensions().get(i)+" ");	
				}
				else{
					queryBuffer.append(chartConfigs.getColorEncoding().getDimensions().get(i)+",");	
				}
			}
			for(int i=0;i<chartConfigs.getDetailEncoding().getDimensions().size();i++){
				if(i==chartConfigs.getDetailEncoding().getDimensions().size()-1){
					queryBuffer.append(chartConfigs.getDetailEncoding().getDimensions().get(i)+" ");	
				}
				else{
					queryBuffer.append(chartConfigs.getDetailEncoding().getDimensions().get(i)+",");	
				}
			}
			queryBuffer.append("FROM "+dataStore);
			//queryBuffer.append(" WHERE GRAPHITI_ID>="+chartConfigs.getFrom()+" AND "+"GRAPHITI_ID<="+chartConfigs.getTo()+" ");
			queryBuffer.append(" GROUP BY ");
			if(areMetricsAggregations==false){
				for(int i=0;i<metricsEncodingToBeConsideredInAL.size();i++){
					if(i==metricsEncodingToBeConsideredInAL.size()-1 && dimentionEncodingToBeConsideredInAL.size()==0 && chartConfigs.getColorEncoding().getDimensions().size()==0 && chartConfigs.getDetailEncoding().getDimensions().size()==0){
						queryBuffer.append(metricsEncodingToBeConsideredInAL.get(i)+" ");
					}
					else{
						queryBuffer.append(metricsEncodingToBeConsideredInAL.get(i)+",");
					}
				}
			}
			for(int i=0;i<dimentionEncodingToBeConsideredInAL.size();i++){
				if(i==dimentionEncodingToBeConsideredInAL.size()-1 && chartConfigs.getColorEncoding().getDimensions().size()==0 && chartConfigs.getDetailEncoding().getDimensions().size()==0){
					queryBuffer.append(dimentionEncodingToBeConsideredInAL.get(i)+" ");
				}
				else{
					queryBuffer.append(dimentionEncodingToBeConsideredInAL.get(i)+",");
				}
			}
			for(int i=0;i<chartConfigs.getColorEncoding().getDimensions().size();i++){
				if((i==chartConfigs.getColorEncoding().getDimensions().size()-1) && chartConfigs.getDetailEncoding().getDimensions().size()==0){
					queryBuffer.append(chartConfigs.getColorEncoding().getDimensions().get(i)+" ");	
				}
				else{
					queryBuffer.append(chartConfigs.getColorEncoding().getDimensions().get(i)+",");	
				}
			}
			for(int i=0;i<chartConfigs.getDetailEncoding().getDimensions().size();i++){
				if(i==chartConfigs.getDetailEncoding().getDimensions().size()-1){
					queryBuffer.append(chartConfigs.getDetailEncoding().getDimensions().get(i)+" ");	
				}
				else{
					queryBuffer.append(chartConfigs.getDetailEncoding().getDimensions().get(i)+",");	
				}
			}
			if(dimentionEncodingToBeConsideredInAL.size()>0 || (chartConfigs.getColorEncoding().getDimensions()!=null && chartConfigs.getColorEncoding().getDimensions().size()>0) || (chartConfigs.getDetailEncoding().getDimensions()!=null && chartConfigs.getDetailEncoding().getDimensions().size()>0)){
				queryBuffer.append("ORDER BY ");
				for(int i=0;i<dimentionEncodingToBeConsideredInAL.size();i++){
					if(i==dimentionEncodingToBeConsideredInAL.size()-1 && chartConfigs.getColorEncoding().getDimensions().size()==0 && chartConfigs.getDetailEncoding().getDimensions().size()==0){
						queryBuffer.append(dimentionEncodingToBeConsideredInAL.get(i)+" ");
					}
					else{
						queryBuffer.append(dimentionEncodingToBeConsideredInAL.get(i)+",");
					}
				}
				for(int i=0;i<chartConfigs.getColorEncoding().getDimensions().size();i++){
					if(i==chartConfigs.getColorEncoding().getDimensions().size()-1 && chartConfigs.getDetailEncoding().getDimensions().size()==0){
						queryBuffer.append(chartConfigs.getColorEncoding().getDimensions().get(i)+" ");	
					}
					else{
						queryBuffer.append(chartConfigs.getColorEncoding().getDimensions().get(i)+",");	
					}
				}
				for(int i=0;i<chartConfigs.getDetailEncoding().getDimensions().size();i++){
					if(i==chartConfigs.getDetailEncoding().getDimensions().size()-1){
						queryBuffer.append(chartConfigs.getDetailEncoding().getDimensions().get(i)+" ");	
					}
					else{
						queryBuffer.append(chartConfigs.getDetailEncoding().getDimensions().get(i)+",");	
					}
				}
			}
		}
		return queryBuffer.toString();
	}
	
	// TODO - Implement this method
	private boolean checkIfMetricsAreAggregations(Set<String> metrics){
		// Check if metrics are consistent
		// Implemnting a very basic logic
		Iterator<String> itr = metrics.iterator();
		while(itr.hasNext()){
			String metric = itr.next();
			if(metric.contains("sum(") || metric.contains("min(") || metric.contains("max(") || metric.contains("count(") || metric.contains("avg(")){
				return true;
			}
		}
		return false;
	}
	
	private static Map<String,String> getDataTypesForObjects(JSONObject localJSONObject,Map<String,String> mapKeysAndDataTypes) throws ParseException{
		Iterator keys = localJSONObject.keySet().iterator();
		while(keys.hasNext()){
			String key = (String) keys.next();
			String dataType = getAppropriateDataType(localJSONObject,key);
			// Decimal gets more precendence
			if(dataType=="Decimal"){
				if(mapKeysAndDataTypes.get(key)!=null && mapKeysAndDataTypes.get(key)=="Integer"){
					mapKeysAndDataTypes.put(key,"Decimal");// Replace Integer by Decimal
				}
				else{
					mapKeysAndDataTypes.put(key,"Decimal");
				}
			}
			else if(dataType=="Integer"){
				if(mapKeysAndDataTypes.get(key)!=null && mapKeysAndDataTypes.get(key)=="Decimal"){
					// Dont replace Decimal by Integer
				}
				else{
					mapKeysAndDataTypes.put(key,"Integer");
				}
			}
			else{
				mapKeysAndDataTypes.put(key,dataType);
			}
		}
		return mapKeysAndDataTypes;
	}
	
	/**
	 * The purpose of this function is to find the data 
	 * type of a specific value
	 * @throws ParseException 
	 */
	private static String getAppropriateDataType(JSONObject jsonObject,String key){
		// First if the key has some substring called Id,id then we 
		// assume it to be an id and classify it as a String and not a number
		String lowercaseKey = key.toLowerCase();
		Object value = jsonObject.get(lowercaseKey);

		if(lowercaseKey.contains("id")){ // TODO - Improve this
			return "String";
		}
		if(lowercaseKey.contains("date")){ // TODO - Improve this => _at, _date, (updated, created)[contains ted]
			return "Date";
		}
		// Check for Strings
		if(value instanceof String){
			
			String stringValue = (String) value;
			// Even though its a String we have to check if its a Date/Integer/Decimal
			// Check for date first
			
			// Initial Version
			/*Pattern pattern = Pattern.compile("^((\\d{4}(-|/| |\\.)(\\d{1,2}|[a-zA-Z]{3,})(-|/| |\\.)(\\d{1,2}|[a-zA-Z]{3,}))|((\\d{1,2}|[a-zA-Z]{3,})(-|/| |\\.)(\\d{1,2}|[a-zA-Z]{3,})(-|/| |\\.)\\d{4}))$");
			Matcher matcher = pattern.matcher(stringValue);
			if(matcher.find()) {
				return "Date";
			}*/
			String dateFormat = DateUtil.determineDateFormat(stringValue); // dateFormat will be null if there is no matching
			if(dateFormat!=null && dateFormat.contains("##Date")){
				return "Date";
			}
			if(dateFormat!=null && dateFormat.contains("##Timestamp")){
				return "Timestamp";
			}
			Pattern pattern = Pattern.compile("[-+]?[0-9]*\\.[0-9]+");// This is only for decimal numbers
			Matcher matcher = pattern.matcher(stringValue);
			if(matcher.find()){
				return "Decimal";
			}
			pattern = Pattern.compile("^(0|[1-9][0-9]*)$");// This is only for integer numbers
			matcher = pattern.matcher(stringValue);
			if(matcher.find()){
				return "Integer";
			}
			// For alphanumeric check
			pattern = Pattern.compile("\\W+"); 
			matcher = pattern.matcher(stringValue);
			if(matcher.find()){
				return "String";
			}
		}
		else if(value instanceof Integer || value instanceof Long){
			return "Integer";
		}
		else if(value instanceof Float || value instanceof Double){
			return "Decimal";
		}
		return "String"; // If nothing matches then its a String
	}
}
