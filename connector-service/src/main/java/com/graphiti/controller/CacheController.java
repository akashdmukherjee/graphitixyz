package com.graphiti.controller;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import com.graphiti.Constants;
import com.graphiti.bean.ChartConfigs;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.FieldDataType;
import com.graphiti.bean.Filter;
import com.graphiti.bean.Filters;
import com.graphiti.bean.IntegerCriteria;
import com.graphiti.bean.Organization;
import com.graphiti.bean.SQLCapability;
import com.graphiti.bean.SQLFilter;
import com.graphiti.bean.SQLFunction;
import com.graphiti.bean.SelectFunction;
import com.graphiti.bean.ColumnOrder;
import com.graphiti.bean.Criteria;
import com.graphiti.client.externalServices.AssetService;
import com.graphiti.client.externalServices.IdentityService;
import com.graphiti.exceptions.DataAssetNotFoundException;
import com.graphiti.exceptions.DataAssetRetrievalException;
import com.graphiti.exceptions.DatabaseCreationException;
import com.graphiti.exceptions.DatabaseDeletionException;
import com.graphiti.exceptions.JSONParseException;
import com.graphiti.exceptions.OrganizationNotFoundException;
import com.graphiti.repository.AmazonS3Repository;
import com.graphiti.repository.CacheAdministratorRepository;
import com.graphiti.repository.CacheRepository;
import com.mongodb.util.JSON;

/**
 * This contains all the API's with respect to 
 * Cache functionality(DATA related)
 * 
 * @author 
 *
 */

@RestController
public class CacheController {
	
	Logger logger = LoggerFactory.getLogger(CacheController.class);
	
	@Autowired
	CacheRepository cacheRepository; 
	
	/**
	 * This API is used for deletion of a table in cache.
	 * It will return a status which indicates if the table was deleted 
	 * successfully from cache or not
	 * 
	 */
	@RequestMapping(value="/cache/dataAsset/{assetId}/table",method= RequestMethod.DELETE,produces="application/json")
	public ResponseEntity<?> deleteTableFromCache(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "orgId", required = true) String orgId,
			@PathVariable String assetId){
		try{
			logger.info("graphiti-tid:{}. Request recieved to delete table corresponding the asset with Id:{} from member with Id:{}",graphiti_tid,assetId,memberId);
			// Get dataAsset details
			AssetService assetService = new AssetService();
			DataSet dataSetDetails= assetService.getDataSetAssetDetails(graphiti_tid, memberId, assetId,orgId);
			logger.info("graphiti-tid:{}. DataAsset details received for asset with Id:{}",graphiti_tid,assetId);
    		// Once we get details of dataAsset we can get the table name
			String tableName = dataSetDetails.getCacheTableName();
			// Get Organizational Details
			IdentityService identityService = new IdentityService();
			Organization organization = identityService.getOrganization(graphiti_tid, orgId);
			logger.info("graphiti-tid:{}. Deleting table with name:{} from cache",graphiti_tid,tableName);
			boolean statusOfDeletion = cacheRepository.deleteDataSetFromCache(graphiti_tid, organization.getCacheDatabaseName(), tableName, orgId);
			logger.info("graphiti-tid:{}. Status of deletion:{}",graphiti_tid,statusOfDeletion);
			JSONObject returnResponse = new JSONObject();
			returnResponse.put("statusOfDeletion", statusOfDeletion);
			return new ResponseEntity<>(returnResponse,HttpStatus.OK);
		}
		catch(DataAssetNotFoundException e){
			throw e;
		}
		catch(DataAssetRetrievalException e){
			throw e;
		}
	}
	
	// There are 2 ways this API can be used.
	// 1. If there is a manual query that needs to be performed on the data set then it can be passed in the body with a 
	//    "query" key
	// 2. If no body passed then it gets the data based on the FilterSet that is applied. If there is no default Filter
	// 	  then it shall return data based on the filter set which is at 0th index
	//    If there is a default filterSet then that will be applied.
	// 3. If nothing is specified then it will return all the data
	@RequestMapping(value="/cache/dataAsset/{assetId}",method= RequestMethod.POST,consumes = "application/json")
	public ResponseEntity<Object> getDataFromCache(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable String assetId,
			@RequestBody(required = false) String body) {
		// body will contain the query
		// Steps
		// 1. Get the database name from the member's org
		// 2. Get the table name from the assetId
		// 3. Get the query from the user or else if query is not specified return the data in the table
		try{
			IdentityService identityService = new IdentityService();
			AssetService assetService = new AssetService();
			// Step 1: Getting orgnization Details
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			if(organization==null){ // That means organization was not found
				logger.error("graphiti_tid:{}. Could Not receive org details for member with id:{}",graphiti_tid,memberId);
				throw new OrganizationNotFoundException("Organization not found for member");
			}
			
			// Step 2: Get table name from assetId
			DataSet dataSetDetails = assetService.getDataSetAssetDetails(graphiti_tid, memberId, assetId,organization.getId());
			
			// Step 3: Make the query
			String query = "";//"SELECT * from "+dataSetDetails.getCacheTableName();
			
			if(body!=null && body.length()>0){ // If there is no body then
				JSONParser jsonParser = new JSONParser();
				JSONObject jsonObject = (JSONObject) jsonParser.parse(body);
				query = (String) jsonObject.get("query");
			}
			else{
				List<SQLCapability> sqlCapabilityList = dataSetDetails.getSqlCapabilities();
				List<SQLFilter> sqlFilterOnlyList = dataSetDetails.getSqlFilters();
				boolean isDefaultFilterInSQLCapability = false;
				// First check if there are filter sets attached to this dataset
				if(sqlCapabilityList!=null && sqlCapabilityList.size()>0){
					SQLCapability appropriateSqlCapability = null;
					// Now check if there is a default filterSet
					if (dataSetDetails.getIdOfDefaultFilter() != null
							&& dataSetDetails.getIdOfDefaultFilter().length() > 0) { // There is something in the defaultFilterSet Id
						// Iterate over the list of SQLCapability to get the appropriate 
						// one based on the Id
						int iterator = 0;
						for(iterator=0;iterator<sqlCapabilityList.size();iterator++){
							if(sqlCapabilityList.get(iterator).getFilterSetId().equalsIgnoreCase(dataSetDetails.getIdOfDefaultFilter())){
								isDefaultFilterInSQLCapability = true;
								break;
							}
						}
						if(iterator < sqlCapabilityList.size()){ // 
							appropriateSqlCapability = (SQLCapability) sqlCapabilityList.get(iterator);	
							query = generateQuery(appropriateSqlCapability, dataSetDetails.getCacheTableName(), appropriateSqlCapability.getIsDistinctApplied());
						}
					}
					else{
						appropriateSqlCapability = (SQLCapability) sqlCapabilityList.get(0);// 0th index is hardcoded
						query = generateQuery(appropriateSqlCapability, dataSetDetails.getCacheTableName(), appropriateSqlCapability.getIsDistinctApplied());
					}
				}
				if(sqlFilterOnlyList!=null && sqlFilterOnlyList.size()>0 && isDefaultFilterInSQLCapability==false){
					SQLFilter appropriateSQLOnlyFilter = null;
					// Now check if there is a default filterSet
					if (dataSetDetails.getIdOfDefaultFilter() != null
							&& dataSetDetails.getIdOfDefaultFilter().length() > 0) { // There is something in the defaultFilterSet Id
						// Iterate over the list of SQLFilterOnlyList to get the appropriate 
						// one based on the Id
						int iterator = 0;
						for(iterator=0;iterator<sqlFilterOnlyList.size();iterator++){
							if(sqlFilterOnlyList.get(iterator).getFilterSetId().equalsIgnoreCase(dataSetDetails.getIdOfDefaultFilter())){
								break;
							}
						}
						appropriateSQLOnlyFilter = (SQLFilter) sqlFilterOnlyList.get(iterator);		
					}
					else{
						appropriateSQLOnlyFilter = (SQLFilter) sqlFilterOnlyList.get(0);// 0th index is hardcoded
					}
					AmazonS3Repository s3Repository = new AmazonS3Repository();
					String linkOfS3 = appropriateSQLOnlyFilter.getSqlFilterURLInS3();
					String key = linkOfS3.substring(linkOfS3.lastIndexOf("/"+Constants.getInstance().properties.getProperty("path-sql-s3")+"/")+1);
					//String key = appropriateSQLOnlyFilter.getSqlFilterURLInS3().substring(appropriateSQLOnlyFilter.getSqlFilterURLInS3().lastIndexOf("/")+1);
					query = s3Repository.readObject(organization.getS3BucketName(),key);
				}
				if(sqlCapabilityList==null && sqlFilterOnlyList==null){
					query = "SELECT * from "+dataSetDetails.getCacheTableName();
				}
			}
			// Get the data from cache
			Object returnedData = cacheRepository.getDataFromCache(organization.getCacheDatabaseName(), query,organization.getId());
			return new ResponseEntity<Object>(returnedData,HttpStatus.OK);
		}
		catch(ParseException e){
			logger.error("graphiti_tid:{}. Error while parsing incoming JSON data:{}",graphiti_tid,body);
			throw new JSONParseException("Error while parsing JSON Data passed in the body");
		}
		catch(DataAssetNotFoundException e){
			throw e;
		}
		catch(DataAssetRetrievalException e){
			throw e;
		}
	}
	
	@RequestMapping(value="/cache/dataAsset/{assetId}/columnNames",method= RequestMethod.GET)
	public ResponseEntity<?> getColumnNames(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable(value = "assetId") String assetId) {
		try {
			IdentityService identityService = new IdentityService();
			AssetService assetService = new AssetService();
			// Step 1: Getting orgnization Details
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			if(organization==null){ // That means organization was not found
				logger.error("graphiti_tid:{}. Could Not receive org details for member with id:{}",graphiti_tid,memberId);
				throw new OrganizationNotFoundException("Organization not found for member");
			}
			
			DataSet dataSetDetails = assetService.getDataSetAssetDetails(graphiti_tid, memberId, assetId,organization.getId());
			String query = "SELECT * from "+dataSetDetails.getCacheTableName()+" LIMIT 1";
			if(dataSetDetails == null) {
				logger.error("graphiti_tid:{}. Dataset Asset not found for assetId:{}",graphiti_tid,assetId);
				throw new DataAssetNotFoundException("Dataset Asset not found");
			}
			JSONObject jsonColumns = cacheRepository.getColumnNameAndDataTypeFromCache(organization.getCacheDatabaseName(), query,organization.getId());
			return new ResponseEntity<JSONObject>(jsonColumns, HttpStatus.OK);
		} catch (Exception e) {
			logger.error("graphiti_tid:{}. Unknown exception occurred:{}",graphiti_tid,e.getMessage());
			return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	// This will be used when there is no chartAsset created
	@RequestMapping(value="/chartAsset/getData",method=RequestMethod.POST,produces="application/json")
    public Object getDataFromCacheForPoweringChart(
        @RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
		@RequestHeader(value = "memberId", required = true) String memberId,
		@RequestHeader(value = "orgId", required = true) String orgId,
		@RequestHeader(value = "sourceDataAssetId", required = true) String sourceDataAssetId,
		@RequestBody ChartConfigs chartConfigurations) throws ParseException {
		return getDataFromCacheForChartAsset(graphiti_tid,memberId,orgId,true,sourceDataAssetId,null,chartConfigurations);
	}
	
	// This will be used when there is no chartAsset created
	@RequestMapping(value="/ext/chartAsset/getData",method=RequestMethod.POST,produces="application/json")
    public Object extgetDataFromCacheForPoweringChart(
        @RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
		@RequestHeader(value = "memberId", required = true) String memberId,
		@RequestHeader(value = "orgId", required = true) String orgId,
		@RequestHeader(value = "sourceDataAssetId", required = true) String sourceDataAssetId,
		@RequestBody ChartConfigs chartConfigurations) throws ParseException {
		return getDataFromCacheForChartAsset(graphiti_tid,memberId,orgId,true,sourceDataAssetId,null,chartConfigurations);
	}
	
	@RequestMapping(value="/chartAsset/{assetId}/getData",method=RequestMethod.POST,produces="application/json")
    public Object getDataFromCacheForChartAsset(
        @RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
		@RequestHeader(value = "memberId", required = true) String memberId,
		@RequestHeader(value = "orgId", required = true) String orgId,
		@RequestHeader(value = "realtime", required = false, defaultValue="false") boolean isRealtime,
		@RequestHeader(value = "sourceDataAssetId", required = false) String sourceDataAssetId,
		@PathVariable(value = "assetId") String assetId,
		@RequestBody ChartConfigs chartConfigurations) throws ParseException {
			// Get table based on inflow data assetId
			AssetService assetService = new AssetService();
			IdentityService identityService = new IdentityService();
			Organization organization = identityService.getOrganization(graphiti_tid, orgId);
			String databaseName = organization.getCacheDatabaseName();
			String table_name = null;
			if(assetId!=null){
				table_name = assetService.getTableNamePoweringTheChart(graphiti_tid, memberId, orgId, assetId);
			}
			else{
				ArrayList<String> listOfDataAssetIds = new ArrayList<String>(1);
				listOfDataAssetIds.add(sourceDataAssetId);
				String responseOfAssetIdAndTableNames = assetService.getTableNamesFromAssetIds(graphiti_tid, memberId, orgId, listOfDataAssetIds);
				JSONArray responseOfAssetIdAndTableNamesArray = (JSONArray) new JSONParser().parse(responseOfAssetIdAndTableNames);
				table_name = (String) ((JSONObject) responseOfAssetIdAndTableNamesArray.get(0)).get("tableName");
				
			}
			if(!isRealtime){ // if realtime then use the chartConfigs getting realtime from UI
				chartConfigurations = assetService.getChartConfigsBasedOnIdOfChart(graphiti_tid, memberId, orgId, assetId);
			}
            // ===============================================================
            // code to convert String to array of objects (using JSON parsing)
            // ===============================================================
		    JSONParser jsonParser = new JSONParser();
		    JSONArray x_groupers = (JSONArray) jsonParser.parse(chartConfigurations.getX_groupers());

		    String where_clause = " WHERE 1=1 ";
		    table_name = "(SELECT * FROM " + table_name + where_clause + ") " + table_name;
		    
            String x_grouper_py = "1";
            String x_groupers_csv = "1";

            for (int i = 0; i < x_groupers.size(); i++) {
                JSONObject x_grouper = (JSONObject) x_groupers.get(i); // Get the object
                String field_name = (String) x_grouper.get("field_name");

                if (i == 0) {
                    x_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    x_groupers_csv = field_name;
                } else {
                    x_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'','empty')";
                    x_groupers_csv += ", " + field_name;
                }
            }
            
            JSONArray y_groupers = (JSONArray) jsonParser.parse(chartConfigurations.getY_groupers());

            String y_grouper_py = "1";
            String y_groupers_csv = "1";

            for (int i = 0; i < y_groupers.size(); i++) {
                JSONObject y_grouper = (JSONObject) y_groupers.get(i); // Get the object
                String field_name = (String) y_grouper.get("field_name");

                if (i == 0) {
                    y_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    y_groupers_csv = field_name;
                } else {
                    y_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'','empty')";
                    y_groupers_csv += ", " + field_name;
                }
            }

            String fragment_py = "1";
            String fragment_otherFields_py = "";
            String fragments_csv = "1";
            String first_fragment_field = "1";
            String second_fragment_field = "1";
            String fragments_pivotedData_csv = "1";
            String fragments_pivotedData_otherFields_csv = "";
            
            JSONArray fragments = (JSONArray) jsonParser.parse(chartConfigurations.getFragments()); //fragments_string);

            for (int i = 0; i < fragments.size(); i++) {
                JSONObject fragment = (JSONObject) fragments.get(i); // Get the object
                String field_name = (String) fragment.get("field_name");
                
                if (i == 0) {
                    fragment_py = "COALESCE(" + field_name + " || '', 'empty')";
                    fragments_csv = field_name;
                    first_fragment_field = field_name;
                    fragments_pivotedData_csv = "pivotedData." + field_name;
                } else {
                    fragment_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                    fragments_csv += ", " + field_name;
                    fragments_pivotedData_csv += ", " + "pivotedData." + field_name;
                }

                if (i == 1) {
                    second_fragment_field = field_name;
                    fragment_otherFields_py = "COALESCE(" + field_name + " || '', 'empty')";
                    fragments_pivotedData_otherFields_csv = "pivotedData." + field_name;
                } else {
                    fragments_pivotedData_otherFields_csv += ", " + "pivotedData." + field_name;
                    fragment_otherFields_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                }
            }

            String color_grouper_py = "1";
            String color_groupers_csv = "1";
            
            JSONArray color_groupers = (JSONArray) jsonParser.parse(chartConfigurations.getColor_groupers()); //color_groupers_string);

            for (int i = 0; i < color_groupers.size(); i++) {
                JSONObject color_grouper = (JSONObject) color_groupers.get(i); // Get the object
                String field_name = (String) color_grouper.get("field_name");

                if (i == 0) {
                    color_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    color_groupers_csv = field_name;
                } else {
                    color_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                    color_groupers_csv += ", " + field_name;
                }
            }

            String size_metric_py = "1";
            String size_metrics_csv = "1";

            JSONArray size_metrics = (JSONArray) jsonParser.parse(chartConfigurations.getSize_metrics()); //size_metrics_string);

            for (int i = 0; i < size_metrics.size(); i++) {
                JSONObject size_metric = (JSONObject) size_metrics.get(i); // Get the object
                String field_name = (String) size_metric.get("field_name");

                if (i == 0) {
                    size_metric_py = "COALESCE('" + field_name + "' || '', 'empty')";
                    size_metrics_csv = field_name;
                } else {
                    size_metric_py += "||'$$$$'||COALESCE('" + field_name + "' || '', 'empty')";
                    size_metrics_csv += ", " + field_name;
                }
            } 
            
            String angle_metric_py = "1";
            String angle_metrics_csv = "1";
            
            JSONArray angle_metrics = (JSONArray) jsonParser.parse(chartConfigurations.getAngle_metrics());
            
            for (int i = 0; i < angle_metrics.size(); i++) {
				JSONObject angle_metric = (JSONObject) angle_metrics.get(i); // Get the object
				String field_name = (String) angle_metric.get("field_name");
				if (i == 0) {
					angle_metric_py = "COALESCE('" + field_name
							+ "' || '', 'empty')";
					angle_metrics_csv = field_name;
				} else {
					angle_metric_py += "||'$$$$'||COALESCE('" + field_name
							+ "' || '', 'empty')";
					angle_metrics_csv += ", " + field_name;
				}
            }

            String color_metric_py = "1";
            String color_metrics_csv = "1";
            
            JSONArray color_metrics = (JSONArray) jsonParser.parse(chartConfigurations.getColor_metrics());//color_metrics_string);

            for (int i = 0; i < color_metrics.size(); i++) {
                JSONObject color_metric = (JSONObject) color_metrics.get(i); // Get the object
                String field_name = (String) color_metric.get("field_name");

                if (i == 0) {
                    color_metric_py = "COALESCE('" + field_name + "' || '', 'empty')";
                    color_metrics_csv = field_name;
                } else {
                    color_metric_py += "||'$$$$'||COALESCE('" + field_name + "' || '', 'empty')";
                    color_metrics_csv += ", " + field_name;
                }
            }

            String subject_metric_py = "1";
            String subject_metrics_csv = "1";
            
            JSONArray subject_metrics = (JSONArray) jsonParser.parse(chartConfigurations.getSubject_metrics());//subject_metrics_string);

            for (int i = 0; i < subject_metrics.size(); i++) {
                JSONObject subject_metric = (JSONObject) subject_metrics.get(i); // Get the object
                String field_name = (String) subject_metric.get("field_name");

                if (i == 0) {
                    subject_metric_py = "COALESCE('" + field_name + "' || '', 'empty')";
                    subject_metrics_csv = field_name;
                } else {
                    subject_metric_py += "||'$$$$'||COALESCE('" + field_name + "' || '', 'empty')";
                    subject_metrics_csv += ", " + field_name;
                }
            }

            String shape_grouper_py = "1";
            String shape_groupers_csv = "1";
            
            JSONArray shape_groupers = (JSONArray) jsonParser.parse(chartConfigurations.getShape_groupers()); //shape_groupers_string);

            for (int i = 0; i < shape_groupers.size(); i++) {
                JSONObject shape_grouper = (JSONObject) shape_groupers.get(i); // Get the object
                String field_name = (String) shape_grouper.get("field_name");

                if (i == 0) {
                    shape_grouper_py = "COALESCE(" + field_name + " || '', 'empty')";
                    shape_groupers_csv = field_name;
                } else {
                    shape_grouper_py += "||'$$$$'||COALESCE(" + field_name + "||'', 'empty')";
                    shape_groupers_csv += ", " + field_name;
                }
            }

            //============================================================================
            // creating x_uqkeys
            //============================================================================
            JSONArray x_metrics = (JSONArray) jsonParser.parse(chartConfigurations.getX_metrics()); //x_metrics_string);
            String x_uqkeys_sql = "";
            if (x_metrics.size() > 0) {
                for (int i = 0; i < x_metrics.size(); i++) {
                    JSONObject x_metric = (JSONObject) x_metrics.get(i); // Get the object
                    String x_metric_name = (String) x_metric.get("field_name");
                    String x_metric_scale_num = x_metric.get("scale_num")+"";

                    if (i == 0) {
                        x_uqkeys_sql += "";
                    } else {
                        x_uqkeys_sql += " UNION ALL ";
                    }

                    x_uqkeys_sql += "SELECT DISTINCT " +
                                                x_grouper_py + " || '~~~~' || '" + x_metric_name + "' as x_uqkey " +
                                        ", '" + x_metric_scale_num + "' as scale_num " +
                                        ", " + x_groupers_csv + 
                                    " FROM " + table_name +
                                    " ORDER BY " + x_groupers_csv;
                }
            } else {
                    x_uqkeys_sql += "SELECT DISTINCT " +
                                                    x_grouper_py + " || '~~~~' || '' as x_uqkey " +
                                                    ", '0'  as scale_num " +
                                                    ", " + x_groupers_csv +
                                    " FROM " + table_name +
                                    " ORDER BY " + x_groupers_csv;                                    
            }
            x_uqkeys_sql = "SELECT" +
                                "  x_uqkey as val" +
                                ", scale_num " +
                                ", ROW_NUMBER() OVER() || '' as index" +
                            " FROM (" + x_uqkeys_sql + ") x_uqkeys ";

            //JSONArray x_uqkeys = (JSONArray) getDataFromCache(databaseName, x_uqkeys_sql, orgId);
            JSONArray x_uqkeys = (JSONArray) cacheRepository.getDataFromCache(databaseName, x_uqkeys_sql,orgId);

            //============================================================================
            // creating y_uqkeys
            //============================================================================
            JSONArray y_metrics = (JSONArray) jsonParser.parse(chartConfigurations.getY_metrics()); //y_metrics_string);
            String y_uqkeys_sql = "";
            if (y_metrics.size() > 0) {
                for (int i = 0; i < y_metrics.size(); i++) {
                    JSONObject y_metric = (JSONObject) y_metrics.get(i); // Get the object
                    String y_metric_name = (String) y_metric.get("field_name");
                    String y_metric_scale_num =  y_metric.get("scale_num")+"";

                    if (i == 0) {
                        y_uqkeys_sql += "";
                    } else {
                        y_uqkeys_sql += " UNION ALL ";
                    }

                    y_uqkeys_sql += "SELECT DISTINCT " +
                                                y_grouper_py + " || '~~~~' || '" + y_metric_name + "' as y_uqkey " +
                                        ", '" + y_metric_scale_num + "' as scale_num " +
                                        ", " + y_groupers_csv + 
                                    " FROM " + table_name +
                                    " ORDER BY " + y_groupers_csv;
                }
            } else {
                    y_uqkeys_sql += "SELECT DISTINCT " +
                                                    y_grouper_py + " || '~~~~' || '' as y_uqkey " +
                                                    ", '0'  as scale_num " +
                                                    ", " + y_groupers_csv +
                                    " FROM " + table_name +
                                    " ORDER BY " + y_groupers_csv;                                    
            }
            y_uqkeys_sql = "SELECT" +
                                "  y_uqkey as val" +
                                ", scale_num " +
                                ", ROW_NUMBER() OVER() || '' as index" +
                            " FROM (" + y_uqkeys_sql + ") y_uqkeys ";

            //JSONArray y_uqkeys = (JSONArray) getDataFromCache(databaseName, y_uqkeys_sql, orgId);
            JSONArray y_uqkeys =  (JSONArray) cacheRepository.getDataFromCache(databaseName, y_uqkeys_sql,orgId);

            //============================================================================
            // creating fragment_uqkeys
            //============================================================================
            String fragment_uqkeys_sql =  "SELECT " +
            							  			"  fragments.*" +
            							  			", DENSE_RANK() OVER(PARTITION BY NULL ORDER BY val ASC) as dense_index " +
            							  "FROM (" +
		            							  "SELECT DISTINCT " + 
		                                                   fragment_py + " as val " +
		                                                ", DENSE_RANK() OVER(PARTITION BY NULL ORDER BY " + first_fragment_field + " ASC) as index " +
		                                                ", " + fragments_csv +
		                                         " FROM " + table_name  +
		                                         " ORDER BY " + fragments_csv +
                                         ") fragments";

            //JSONArray fragment_uqkeys = (JSONArray) getDataFromCache(databaseName, fragment_uqkeys_sql, orgId);
            JSONArray fragment_uqkeys = (JSONArray) cacheRepository.getDataFromCache(databaseName, fragment_uqkeys_sql,orgId);

            //============================================================================
            // creating first_fragment_uqkeys
            //============================================================================            
            String first_fragment_uqkeys_sql = " SELECT DISTINCT " +
                                                               first_fragment_field + " as val " +
                                                            ", DENSE_RANK() OVER(PARTITION BY NULL ORDER BY " + first_fragment_field + " ASC) as index " +
                                                " FROM " + table_name +
                                                " ORDER BY " + first_fragment_field;

            // JSONArray first_fragment_uqkeys = (JSONArray) getDataFromCache(databaseName, first_fragment_uqkeys_sql, orgId);
            JSONArray first_fragment_uqkeys = (JSONArray) cacheRepository.getDataFromCache(databaseName, first_fragment_uqkeys_sql,orgId);

            //============================================================================
            // creating color_uqkeys
            //============================================================================                        
            String color_uqkeys_sql = "SELECT DISTINCT " +
                                                           color_grouper_py + " as val " +
                                                    ", " + color_groupers_csv + 
                                        " FROM " + table_name +
                                        " ORDER BY " + color_groupers_csv;
            
            //JSONArray color_uqkeys = (JSONArray) getDataFromCache(databaseName, color_uqkeys_sql, orgId);
            JSONArray color_uqkeys = (JSONArray) cacheRepository.getDataFromCache(databaseName, color_uqkeys_sql,orgId);

            //============================================================================
            // creating pivotedData
            //============================================================================                                    
            String pivotedData_sql = "";
            String pivotedData_outer_sql = "";

            String size_metric_name = "0";
            String size_metric_agg = "SUM";
            String angle_metric_name = "0";
            String angle_metric_agg = "SUM";
            String color_metric_name = "0";
            String color_metric_agg = "SUM";
            String subject_metric_name = "0";
            String subject_metric_agg = "SUM";
            if (size_metrics.size() > 0) {
                JSONObject first_size_metric = (JSONObject) size_metrics.get(0); // Get first object
                size_metric_name = (String) first_size_metric.get("field_name");
                size_metric_agg = (String) first_size_metric.get("field_aggregation");
            }
            if (angle_metrics.size() > 0) {
            	JSONObject first_angle_metric = (JSONObject) angle_metrics.get(0); // Get first object
            	angle_metric_name = (String) first_angle_metric.get("field_name");
            	angle_metric_agg = (String) first_angle_metric.get("field_aggregation");
            }
            if (color_metrics.size() > 0) {
                JSONObject first_color_metric = (JSONObject) color_metrics.get(0); // Get first object
                color_metric_name = (String) first_color_metric.get("field_name");
                color_metric_agg = (String) first_color_metric.get("field_aggregation");
            }
            if (subject_metrics.size() > 0) {
                JSONObject first_subject_metric = (JSONObject) subject_metrics.get(0); // Get first object
                subject_metric_name = (String) first_subject_metric.get("field_name");
                subject_metric_agg = (String) first_subject_metric.get("field_aggregation");
            }

            String str1 = "SELECT " +
                                       x_grouper_py + " as x_grouper " +
                                ", " + y_grouper_py + " as y_grouper ";
            
            String str2 = "";

            String str3 =       ", " + fragment_py + " as fragment_uqkey " +
                                ", " + color_grouper_py + " as color_uqkey " +
                                ", " + size_metric_py + " as size_metric " +
                                ", " + angle_metric_py + " as angle_metric " +
                                ", " + color_metric_py + " as color_metric " +
                                ", " + subject_metric_py + " as subject_metric " +
                                ", " + shape_grouper_py + " as shape_uqkey ";
            
            String str4 = "";

            String str5 =       ", COALESCE(" + size_metric_agg + "(" + size_metric_name + "), 0) as size_metric_val " +
            					", COALESCE(" + angle_metric_agg + "(" + angle_metric_name + "), 0) as angle_metric_val " +
                                ", COALESCE(" + color_metric_agg + "(" + color_metric_name + "), 0) as color_metric_val " +
                                ", COALESCE(" + subject_metric_agg + "(" + subject_metric_name + "), 0) as subject_metric_val ";

            String str6 =       ", " + fragments_csv + 
                            " FROM " + table_name +
                            " GROUP BY " +
                                       x_groupers_csv +
                                ", " + y_groupers_csv +
                                ", color_uqkey"  +
                                ", " + fragments_csv;

            
            String outer_str1 =  " SELECT " +
                                        "  pivotedData.x_grouper " +
                                        ", pivotedData.y_grouper ";
            
            String outer_str2 = ""; //fragments....

            String outer_str3 = ""; //x_metric, y_metric

            String outer_str4 =         ", pivotedData.x_uqkey " +
                                        ", pivotedData.y_uqkey " +
                                        ", pivotedData.fragment_uqkey " +
                                        ", pivotedData.color_uqkey " +
                                        ", pivotedData.size_metric " +
                                        ", pivotedData.angle_metric " +
                                        ", pivotedData.color_metric " +
                                        ", pivotedData.subject_metric " +
                                        ", pivotedData.shape_uqkey";
            
            String outer_str5 = ""; //x_intercept, y_intercept, x_metric_val, y_metric_val

            String outer_str6 =         ", pivotedData.size_metric_val || '' as size_metric_val" + 
            							", pivotedData.angle_metric_val || '' as angle_metric_val" +
                                        ", pivotedData.color_metric_val || '' as color_metric_val" + 
                                        ", pivotedData.subject_metric_val || '' as subject_metric_val";            
            
            String outer_str7 = ""; //x_scale_num, y_scale_num

            String outer_str8 =         ", x_uqkeys.index as x_uqkey_index" + 
                                        ", y_uqkeys.index as y_uqkey_index" + 
                                        ", fragment_uqkeys.index as fragment_uqkey_index" +
                                        ", fragment_uqkeys.dense_index as fragment_uqkey_dense_index" +
                                        ", MAX(fragment_uqkeys.index) OVER() as fragment_uqkey_maxindex " +
                                        ", MAX(fragment_uqkeys.dense_index) OVER() as fragment_uqkey_maxdenseindex ";

            String outer_str9 = " LEFT OUTER JOIN (" + x_uqkeys_sql + " ) x_uqkeys ON x_uqkeys.val = pivotedData.x_uqkey " +
                                " LEFT OUTER JOIN (" + y_uqkeys_sql + " ) y_uqkeys ON y_uqkeys.val = pivotedData.y_uqkey " +
                                " LEFT OUTER JOIN (" + fragment_uqkeys_sql + " ) fragment_uqkeys ON fragment_uqkeys.val = pivotedData.fragment_uqkey " +
                                " ORDER BY " + fragments_pivotedData_csv;

            if (x_metrics.size() > 0 && y_metrics.size() > 0) {                

                for (int x = 0; x < x_metrics.size(); x++) {
                    JSONObject x_metric = (JSONObject) x_metrics.get(x); // Get the object
                    String x_metric_name = (String) x_metric.get("field_name");
                    String x_metric_agg = (String) x_metric.get("field_aggregation");

                    for (int y = 0; y < y_metrics.size(); y++) {
                        JSONObject y_metric = (JSONObject) y_metrics.get(y); // Get the object
                        String y_metric_name = (String) y_metric.get("field_name");
                        String y_metric_agg = (String) y_metric.get("field_aggregation");

                        if (x == 0 && y == 0) {
                            pivotedData_sql += "";
                        } else {
                            pivotedData_sql += " UNION ALL ";
                        }

                        str2 = ", '" + x_metric_name + "' as x_metric " +
                               ", '" + y_metric_name + "' as y_metric " +
                               ", " + x_grouper_py + " || '~~~~' || '" + x_metric_name + "' as x_uqkey " +
                               ", " + y_grouper_py + " || '~~~~' || '" + y_metric_name + "' as y_uqkey ";

                        str4 = ", COALESCE(" + x_metric_agg + "(" + x_metric_name + "), 0) as x_metric_val " +
                               ", COALESCE(" + y_metric_agg + "(" + y_metric_name + "), 0) as y_metric_val ";

                        pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;
                    
                    }
                }

                outer_str2 = "";

                outer_str3 = ", pivotedData.x_metric " +
                             ", pivotedData.y_metric ";

                outer_str5 = ", pivotedData.x_metric_val || '' as x_intercept" + 
                             ", pivotedData.y_metric_val || '' as y_intercept" +
                             ", pivotedData.x_metric_val || '' as x_metric_val" + 
                             ", pivotedData.y_metric_val || '' as y_metric_val";

                outer_str7 = ", x_uqkeys.scale_num as x_uqkey_scale_num" + 
                             ", y_uqkeys.scale_num as y_uqkey_scale_num";

            } else if (x_metrics.size() == 0 && y_metrics.size() > 0) {
                for (int y = 0; y < y_metrics.size(); y++) {
                    JSONObject y_metric = (JSONObject) y_metrics.get(y); // Get the object
                    String y_metric_name = (String) y_metric.get("field_name");
                    String y_metric_agg = (String) y_metric.get("field_aggregation");

                    if (y == 0) {
                        pivotedData_sql += "";
                    } else {
                        pivotedData_sql += " UNION ALL ";
                    }

                    str2 = ", '" + y_metric_name + "' as y_metric " +
                    		", " + x_grouper_py + " || '~~~~' || '' as x_uqkey " +
                            ", " + y_grouper_py + " || '~~~~' || '" + y_metric_name + "' as y_uqkey ";

                    str4 = ", COALESCE(" + y_metric_agg + "(" + y_metric_name + "), 0) as y_metric_val ";

                    pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;
                }

                String y_intercept = "";
                if (chartConfigurations.isStacked()== true && fragments.size() > 1) {
                    y_intercept = " SUM(pivotedData.y_metric_val) OVER(PARTITION BY ";
                    if (fragments.size() > 1) {
                        y_intercept += "pivotedData.x_grouper, pivotedData.y_grouper, pivotedData." + 
                                        first_fragment_field 
                                        + " ORDER BY " + fragments_pivotedData_otherFields_csv;
                    } else {
                        y_intercept += "1 ORDER BY NULL";
                    }
                    y_intercept += " ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) || '' as y_intercept ";
                } else {
                    y_intercept = " pivotedData.y_metric_val || '' as y_intercept";
                }
                
                outer_str2 = ", " + fragments_pivotedData_csv;

                outer_str3 = ", pivotedData.y_metric ";

                outer_str5 = ", " + y_intercept + 
                        	 ", pivotedData.y_metric_val || '' as y_metric_val";

                outer_str7 = ", 0 as x_uqkey_scale_num" + 
                             ", y_uqkeys.scale_num as y_uqkey_scale_num";                
                         
            } else if (x_metrics.size() > 0 && y_metrics.size() == 0) {
                for (int x = 0; x < x_metrics.size(); x++) {
                    JSONObject x_metric = (JSONObject) x_metrics.get(x); // Get the object
                    String x_metric_name = (String) x_metric.get("field_name");
                    String x_metric_agg = (String) x_metric.get("field_aggregation");

                    if (x == 0) {
                        pivotedData_sql += "";
                    } else {
                        pivotedData_sql += " UNION ALL ";
                    }

                    str2 = ", '" + x_metric_name + "' as x_metric " + 
                    		", " + x_grouper_py + " || '~~~~' || '" + x_metric_name + "' as x_uqkey " +
                            ", " + y_grouper_py + " || '~~~~' || '' as y_uqkey ";

                    str4 = ", COALESCE(" + x_metric_agg + "(" + x_metric_name + "), 0) as x_metric_val ";

                    pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;
                }

                String x_intercept = "";
                if (chartConfigurations.isStacked() == true && fragments.size() > 1) {
                    x_intercept = " SUM(pivotedData.x_metric_val) OVER(PARTITION BY ";
                    if (fragments.size() > 1) {
                        x_intercept += "pivotedData.x_grouper, pivotedData.y_grouper, pivotedData." + 
                                        first_fragment_field 
                                        + " ORDER BY " + fragments_pivotedData_otherFields_csv;
                    } else {
                        x_intercept += "1 ORDER BY NULL";
                    }
                    x_intercept += " ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) || '' as x_intercept ";
                } else {
                    x_intercept = " pivotedData.x_metric_val || '' as x_intercept";
                }
                
                outer_str2 = ", " + fragments_pivotedData_csv;

                outer_str3 = ", pivotedData.x_metric ";

                outer_str5 = ", " + x_intercept + 
                			 ", pivotedData.x_metric_val || '' as x_metric_val";

                outer_str7 = ", x_uqkeys.scale_num as x_uqkey_scale_num" + 
                             ", 0 as y_uqkey_scale_num";                  


            } else if (x_metrics.size() == 0 && y_metrics.size() == 0) {
                str2 = ", " + x_grouper_py + " || '~~~~' || '' as x_uqkey " +
                        ", " + y_grouper_py + " || '~~~~' || '' as y_uqkey ";

                str4 = "";

                pivotedData_sql += str1 + str2 + str3 + str4 + str5 + str6;

                outer_str2 = ", " + fragments_pivotedData_csv;

                outer_str3 = "";

                outer_str5 = "";

                outer_str7 = ", 0 as x_uqkey_scale_num" + 
                             ", 0 as y_uqkey_scale_num";                  


            }

            pivotedData_outer_sql = outer_str1 + 
                                    outer_str2 +
                                    outer_str3 +
                                    outer_str4 +
                                    outer_str5 +
                                    outer_str6 +
                                    outer_str7 +
                                    outer_str8 + 
                                    " FROM (" +
                                        pivotedData_sql + 
                                    " ) pivotedData " +
                                    outer_str9;

            //JSONArray pivotedData = (JSONArray) getDataFromCache(databaseName, pivotedData_outer_sql, orgId);
            JSONArray pivotedData = (JSONArray) cacheRepository.getDataFromCache(databaseName, pivotedData_outer_sql,orgId);

//            JSONObject vizData = {
//                                "data": pivotedData,
//                                "x_uqkeys": x_uqkeys,
//                                "y_uqkeys": y_uqkeys,
//                                "fragment_uqkeys": fragment_uqkeys,
//                                "first_fragment_uqkeys": first_fragment_uqkeys,
//                                "color_uqkeys": color_uqkeys
//                             };
            JSONObject vizData = new JSONObject();
            vizData.put("data", pivotedData);
            vizData.put("x_uqkeys", x_uqkeys);
            vizData.put("y_uqkeys",y_uqkeys);
            vizData.put("fragment_uqkeys", fragment_uqkeys);
            vizData.put("first_fragment_uqkeys", first_fragment_uqkeys);
            vizData.put("color_uqkeys", color_uqkeys);
            
            return vizData.toString();
    }
	
	@RequestMapping(value="/ext/chartAsset/{assetId}/getData",method=RequestMethod.POST,produces="application/json")
    public Object extgetDataFromCacheForChartAsset(
        @RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
		@RequestHeader(value = "memberId", required = true) String memberId,
		@RequestHeader(value = "orgId", required = true) String orgId,
		@RequestHeader(value = "realtime", required = false, defaultValue="false") boolean isRealtime,
		@RequestHeader(value = "sourceDataAssetId", required = false) String sourceDataAssetId,
		@PathVariable(value = "assetId") String assetId,
		@RequestBody ChartConfigs chartConfigurations) throws ParseException {
		return getDataFromCacheForChartAsset(graphiti_tid, memberId, orgId, isRealtime, sourceDataAssetId, assetId, chartConfigurations);
	}
	
	@RequestMapping(value="/ext/cache/dataAsset/{assetId}/columnNames",method= RequestMethod.GET)
	public ResponseEntity<?> extgetColumnNames(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable(value = "assetId") String assetId) {
		return getColumnNames(graphiti_tid,memberId,assetId);
	}
	/**
	 * Create a String seperated by comma and wrapped by single quote
	 * 
	 * @param listOfStrings
	 * @return
	 */
	private String composeStringTuple(List<String> listOfStrings){
		String joinedString = "'" + String.join("','",listOfStrings) + "'";
		return joinedString;
	}
	
	private String composeIntegerTuple(List<String> listOfIntegers){
		String joinedString = String.join(",",listOfIntegers);
		return joinedString;
	}
	
	private String composeLIKEQuery(List<String> listOfStrings, String columnName) {
		// (gender LIKE '%bat%' OR gender LIKE '%ball%') 
		String delimiter = columnName + " "+Criteria.CONTAINS.getValue()+" ";
		String joinedString;
		if(listOfStrings.size() == 1) {
			joinedString = delimiter+ " '%" +listOfStrings.get(0)+"%'";
		} else {
			joinedString = delimiter+ " '%" + String.join("%' OR "+delimiter+"'%", listOfStrings)+"%'";
		}
		joinedString = "("+joinedString+")";
		System.out.println(joinedString);
		return joinedString;
	}
	
	
	private String composeNOTLIKEQuery(List<String> listOfStrings, String columnName) {
		// (gender LIKE '%bat%' OR gender LIKE '%ball%') 
		String delimiter = columnName + " "+Criteria.DOES_NOT_CONTAIN.getValue()+" ";
		String joinedString;
		if (listOfStrings.size() == 1) {
			joinedString = delimiter+ " '%" +listOfStrings.get(0)+"%'";
		} else {
			joinedString = delimiter+ " '%" + String.join("%' AND "+delimiter+"'%", listOfStrings)+"%'";
		}
		joinedString = "("+joinedString+")";
		System.out.println(joinedString);
		return joinedString;
	}
	
	private StringBuffer generateIntermediateQueryBasedOnDataType(StringBuffer queryBuffer,Filter filter){
		if(filter.getDataType()==FieldDataType.STRING){
			// 1.2 Handling IS
			if(filter.getCriteria()==Criteria.IS || filter.getCriteria()==Criteria.IS_NOT){
				queryBuffer.append(filter.getColumnName()).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append("(").append(composeStringTuple(filter.getValues())).append(")").append(" ");
			}
			// 1.3 Hanling CONTAINS which is equivalent to LIKE 
			// Here we are only expecting one argument in the value
			else if(filter.getCriteria()==Criteria.CONTAINS){
				queryBuffer.append(composeLIKEQuery(filter.getValues(), filter.getColumnName())).append(" ");
			}
			// Handling DOES NOT CONTAIN
			else if(filter.getCriteria()==Criteria.DOES_NOT_CONTAIN){
				queryBuffer.append(composeNOTLIKEQuery(filter.getValues(), filter.getColumnName())).append(" ");
			} else if(filter.getCriteria()==Criteria.IS_NULL || filter.getCriteria()==Criteria.IS_NOT_NULL) {
				queryBuffer.append(filter.getColumnName()).append(" ")
				   .append(filter.getCriteria().getValue()).append(" ");
			}
		} else if (filter.getDataType()==FieldDataType.INTEGER || filter.getDataType()==FieldDataType.DECIMAL) {
			if(filter.getCriteria()==Criteria.EQUAL || filter.getCriteria()==Criteria.NOT_EQUAL) {
				queryBuffer.append(filter.getColumnName()).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append("(").append(composeIntegerTuple(filter.getValues())).append(")").append(" ");;
			} else if(filter.getCriteria()==Criteria.LESS_THAN ||
					filter.getCriteria()==Criteria.GREATER_THAN ||
					filter.getCriteria()==Criteria.LESS_THAN_EQUAL ||
					filter.getCriteria()==Criteria.GREATER_THAN_EQUAL) {
				queryBuffer.append(filter.getColumnName())
						   .append(filter.getCriteria().getValue())
						   .append(filter.getValues().get(0)).append(" ");
			} else if(filter.getCriteria()==Criteria.BETWEEN) {
				queryBuffer.append(" (").append(filter.getColumnName()).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append(filter.getValues().get(0)).append(" AND ")
						   .append(filter.getValues().get(1)).append(") ");
			} else if(filter.getCriteria()==Criteria.IS_NULL || filter.getCriteria()==Criteria.IS_NOT_NULL) {
				queryBuffer.append(filter.getColumnName()).append(" ")
				   .append(filter.getCriteria().getValue()).append(" ");
			}
		}
		else if ((filter.getDataType()==FieldDataType.DATE ||  filter.getDataType()==FieldDataType.TIMESTAMP) && filter.getSqlFunction()==SQLFunction.NULL) {
			if(filter.getCriteria()==Criteria.EQUAL || filter.getCriteria()==Criteria.NOT_EQUAL) {
				queryBuffer.append(filter.getColumnName()).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append("(").append(composeStringTuple(filter.getValues())).append(")").append(" ");;
			} else if(filter.getCriteria()==Criteria.LESS_THAN ||
					filter.getCriteria()==Criteria.GREATER_THAN ||
					filter.getCriteria()==Criteria.LESS_THAN_EQUAL ||
					filter.getCriteria()==Criteria.GREATER_THAN_EQUAL) {
				queryBuffer.append(filter.getColumnName())
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append("'").append(filter.getValues().get(0)).append("'").append(" ");
			} else if(filter.getCriteria()==Criteria.BETWEEN) {
				queryBuffer.append(" (").append(filter.getColumnName()).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append("'").append(filter.getValues().get(0)).append("'").append(" AND ")
						   .append("'").append(filter.getValues().get(1)).append("'").append(") ");
			} else if(filter.getCriteria()==Criteria.IS_NULL || filter.getCriteria()==Criteria.IS_NOT_NULL) {
				queryBuffer.append(filter.getColumnName()).append(" ")
				   .append(filter.getCriteria().getValue()).append(" ");
			}
		}
		else if ((filter.getDataType() == FieldDataType.DATE || filter.getDataType() == FieldDataType.TIMESTAMP)
				&& filter.getSqlFunction() != null
				&& (filter.getSqlFunction().name().contains("DATE") || filter.getSqlFunction().name().contains("TIMESTAMP"))) {
	 		if(filter.getCriteria()==Criteria.EQUAL || filter.getCriteria()==Criteria.NOT_EQUAL) {
				// The reason of using Integer tuple is because the 
				// Date functions will be returning Integer and not dates
				queryBuffer.append(filter.getSqlFunction().getValue().replace("$COLUMNNAME$",filter.getColumnName())).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append("(").append(composeIntegerTuple(filter.getValues())).append(")").append(" ");;
			} else if(filter.getCriteria()==Criteria.LESS_THAN ||
					filter.getCriteria()==Criteria.GREATER_THAN ||
					filter.getCriteria()==Criteria.LESS_THAN_EQUAL ||
					filter.getCriteria()==Criteria.GREATER_THAN_EQUAL) {
				queryBuffer.append(filter.getSqlFunction().getValue().replace("$COLUMNNAME$",filter.getColumnName()))
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append(filter.getValues().get(0)).append(" ");
			} else if(filter.getCriteria()==Criteria.BETWEEN) {
				queryBuffer.append(" (").append(filter.getSqlFunction().getValue().replace("$COLUMNNAME$",filter.getColumnName())).append(" ")
						   .append(filter.getCriteria().getValue()).append(" ")
						   .append(filter.getValues().get(0)).append(" AND ")
						   .append(filter.getValues().get(1)).append(") ");
			} else if(filter.getCriteria()==Criteria.IS_NULL || filter.getCriteria()==Criteria.IS_NOT_NULL) {
				queryBuffer.append(filter.getColumnName()).append(" ")
				   .append(filter.getCriteria().getValue()).append(" ");
			}
		} 
		return queryBuffer;
	}
	
	private String generateQuery(SQLCapability sqlCapability,String tableName,boolean isDistinct){
		StringBuffer queryBuffer = new StringBuffer();
		// 1. Handling SELECT
		queryBuffer.append("SELECT ");
		if(sqlCapability.getSelectColumnsAndFunctions()!=null){
			List<String> selectColumns = new ArrayList<>();
			for(int iterator=0;iterator<sqlCapability.getSelectColumnsAndFunctions().size();iterator++){
				SelectFunction function = sqlCapability.getSelectColumnsAndFunctions().get(iterator);
				if(function.getSqlFunction()==SQLFunction.NULL){
					selectColumns.add(function.getColumnName()); 
				}
				else{
					if(!function.getSqlFunction().name().contains("DATE") && !function.getSqlFunction().name().contains("TIMESTAMP")){ // Non Date Functions
						selectColumns.add(function.getSqlFunction().getValue()+"(" + function.getColumnName()+ ") AS "+function.getSqlFunction().getValue()+"_"+function.getColumnName());
					}
					else{
						String extractParameter = "";
						if(function.getSqlFunction().name().contains("DATE") && !function.getSqlFunction().name().contains("TIMESTAMP")){ // Handling TIMESTAMP_GET_DATE
							extractParameter = function.getSqlFunction().getValue().substring(function.getSqlFunction().getValue().indexOf("(")+1,function.getSqlFunction().getValue().indexOf("FROM")).trim();
							selectColumns.add(function.getSqlFunction().getValue().replace("$COLUMNNAME$",function.getColumnName())+" AS "+extractParameter+"_"+function.getColumnName());
						}
						else if(function.getSqlFunction().name().contains("TIMESTAMP")){
							if(!function.getSqlFunction().name().contains("DATE")){ // This is for handling TIMESTAMP_GET_DATE
								extractParameter = function.getSqlFunction().getValue().substring(function.getSqlFunction().getValue().indexOf("(")+1,function.getSqlFunction().getValue().indexOf("FROM")).trim();
								selectColumns.add(function.getSqlFunction().getValue().replace("$COLUMNNAME$",function.getColumnName())+" AS "+extractParameter+"_"+function.getColumnName());
							}
							else{ // handling TIMESTAMP_GET_DATE which is a but weird
								selectColumns.add(function.getSqlFunction().getValue().replace("$COLUMNNAME$",function.getColumnName())+" AS "+"DATE"+"_"+function.getColumnName());
							}
						}
					}
				}
			}
			String columnsInSelectQuery = "";
			if(isDistinct) {
				 Set<String> setOfColumnsInSelectAndOrderBy = new LinkedHashSet<>();
				 // Get columns in SELECT which is stored in selectColumns
				 setOfColumnsInSelectAndOrderBy.addAll(selectColumns);
				 if(sqlCapability.getColumnOrders()!=null){
					 // Not we have to run for-loop to get columns included in order-by
					 for(int iterator=0;iterator<sqlCapability.getColumnOrders().size();iterator++){
						 ColumnOrder columnOrder = sqlCapability.getColumnOrders().get(iterator);
						 setOfColumnsInSelectAndOrderBy.add(columnOrder.getColumnName());
					 }
				 }
				 // Now that we have columns which are there in both
				 // select and order by clause we can construct the query
				 columnsInSelectQuery = String.join(",", setOfColumnsInSelectAndOrderBy);
				 queryBuffer.append("DISTINCT ").append(columnsInSelectQuery).append(" ");
			} else {
				 columnsInSelectQuery = String.join(",", selectColumns);
				 queryBuffer.append(columnsInSelectQuery).append(" ");
			}
		}
		else{
			queryBuffer.append("* ");
		}
		queryBuffer.append("FROM ").append(tableName).append(" ");
		// 2. Handling Filters 
		// 	2.1 Handling applied filters
		if(sqlCapability.getFilters() != null){
			if(sqlCapability.getFilters().getAppliedFilters()!=null){
				queryBuffer.append("WHERE").append(" ");
				Filter appliedFilter;
				int appliedFiltersLength = sqlCapability.getFilters().getAppliedFilters().size();
				for(int i=0; i<appliedFiltersLength; ++i){
					appliedFilter = sqlCapability.getFilters().getAppliedFilters().get(i);
					queryBuffer = generateIntermediateQueryBasedOnDataType(queryBuffer,appliedFilter);
					if(appliedFiltersLength > 1 && i != appliedFiltersLength - 1){
						queryBuffer.append("AND").append(" ");
					}
				}
			}
			// TODO: redundant check
//			if(sqlCapability.getFilters().getAppliedFilters()!=null){// This means we have to append an 'AND' to the query 
//				queryBuffer.append("AND").append(" ");
//			}
			if(sqlCapability.getFilters().getCurrentFilter()!=null) { // Basically this wone be null
				if(sqlCapability.getFilters().getAppliedFilters() == null) {
					queryBuffer.append("WHERE").append(" ");
				}
				Filter currentFilter = sqlCapability.getFilters().getCurrentFilter();
				queryBuffer = generateIntermediateQueryBasedOnDataType(queryBuffer,currentFilter);
			}
		}
		// 3. Hanling GROUP BY
		if(sqlCapability.getGroupByColumns()!=null){
			queryBuffer.append(" GROUP BY").append(" ");
			String columnListsForGroupBy = String.join(",", sqlCapability.getGroupByColumns());
			queryBuffer.append(columnListsForGroupBy).append(" ");
		}
		// 4. Handling order
		if (sqlCapability.getColumnOrders() != null) {
			queryBuffer.append(" ORDER BY ");
			for (int itr = 0; itr < sqlCapability.getColumnOrders().size(); itr++) {
				ColumnOrder columnOrder = sqlCapability.getColumnOrders().get(itr);
				if (itr == sqlCapability.getColumnOrders().size() - 1) {
					queryBuffer.append(columnOrder.getColumnName()).append(" ").append(columnOrder.getOrder());
				} else {
					queryBuffer.append(columnOrder.getColumnName()).append(" ").append(columnOrder.getOrder())
							.append(",");
				}
			}
		}
		logger.info("queryBuffer: {}", queryBuffer.toString());
		return queryBuffer.toString();
	}
	
	@RequestMapping(value="/cache/dataAsset/{assetId}/generateQueryAndGetData",method=RequestMethod.POST)
	public ResponseEntity<Object> generateQueryAndGetData(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "isDistinct", required = true) boolean isDistinct,
			@PathVariable String assetId,
			@RequestBody(required=false) SQLCapability sqlCapability) {
		try {
			IdentityService identityService = new IdentityService();
			AssetService assetService = new AssetService();
			// Step 1: Getting orgnization Details
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			if(organization==null){ // That means organization was not found
				logger.error("graphiti_tid:{}. Could Not receive org details for member with id:{}",graphiti_tid,memberId);
				throw new OrganizationNotFoundException("Organization not found for member");
			}
			
			DataSet dataSetDetails = assetService.getDataSetAssetDetails(graphiti_tid, memberId, assetId,organization.getId());
			if(dataSetDetails == null) {
				logger.error("graphiti_tid:{}. Dataset Asset not found for assetId:{}",graphiti_tid,assetId);
				throw new DataAssetNotFoundException("Dataset Asset not found");
			}
			// 
			//String query = "SELECT DISTINCT "+ columnName +" FROM " + dataSetDetails.getCacheTableName();
			String query = "";
			if(sqlCapability!=null){
				query = generateQuery(sqlCapability,dataSetDetails.getCacheTableName(), isDistinct);
			}
			JSONArray returnedData = (JSONArray) cacheRepository.getDataFromCache(organization.getCacheDatabaseName(), query,organization.getId());
			return new ResponseEntity<Object>(returnedData, HttpStatus.OK);
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("graphiti_tid:{}. Unknown exception occurred:{}",graphiti_tid,e.getMessage());
			return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@RequestMapping(value="/ext/cache/dataAsset/{assetId}/generateQueryAndGetData",method=RequestMethod.POST)
	public ResponseEntity<Object> extgenerateQueryAndGetData(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "isDistinct", required = true) boolean isDistinct,
			@PathVariable String assetId,
			@RequestBody(required=false) SQLCapability sqlCapability) {
		return generateQueryAndGetData(graphiti_tid,memberId,isDistinct,assetId,sqlCapability);
	}
	
	@RequestMapping(value="/cache/dataAsset/{assetId}/{columnName}/uniqueValues",method=RequestMethod.POST)
	public ResponseEntity<Object> getUniqueValues(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable String assetId,
			@PathVariable String columnName,
			@RequestBody(required=false) SQLCapability sqlCapability) {
		try {
			IdentityService identityService = new IdentityService();
			AssetService assetService = new AssetService();
			// Step 1: Getting orgnization Details
			Organization organization = identityService.getOrganizationUsingMemberId(graphiti_tid, memberId);
			if(organization==null){ // That means organization was not found
				logger.error("graphiti_tid:{}. Could Not receive org details for member with id:{}",graphiti_tid,memberId);
				throw new OrganizationNotFoundException("Organization not found for member");
			}
			
			DataSet dataSetDetails = assetService.getDataSetAssetDetails(graphiti_tid, memberId, assetId,organization.getId());
			if(dataSetDetails == null) {
				logger.error("graphiti_tid:{}. Dataset Asset not found for assetId:{}",graphiti_tid,assetId);
				throw new DataAssetNotFoundException("Dataset Asset not found");
			}
			// 
			//String query = "SELECT DISTINCT "+ columnName +" FROM " + dataSetDetails.getCacheTableName();
			String query = "";
			if(sqlCapability!=null){
				query = generateQuery(sqlCapability,dataSetDetails.getCacheTableName(), true);
			}
			System.out.println(query);
			JSONArray returnedData = (JSONArray) cacheRepository.getDataFromCache(organization.getCacheDatabaseName(), query,organization.getId());
			JSONObject responseJSONObject = new JSONObject();
			ArrayList<Object> responseArrayObject = new ArrayList<Object>();
			for(Object data : returnedData) {
				Object columnValue = ((JSONObject) data).get(columnName);
				if(columnValue!=null) {
					responseArrayObject.add(columnValue);
				}
			}
			responseJSONObject.put(columnName, responseArrayObject);
			return new ResponseEntity<Object>(responseJSONObject, HttpStatus.OK);
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("graphiti_tid:{}. Unknown exception occurred:{}",graphiti_tid,e.getMessage());
			return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@RequestMapping(value="/ext/cache/dataAsset/{assetId}/{columnName}/uniqueValues",method=RequestMethod.POST)
	public ResponseEntity<Object> extgetUniqueValues(
			@RequestHeader(value = "graphiti-tid", required = true) String graphiti_tid,
			@RequestHeader(value = "memberId", required = true) String memberId,
			@PathVariable String assetId,
			@PathVariable String columnName,
			@RequestBody(required=false) SQLCapability sqlCapability) {
		return getUniqueValues(graphiti_tid,memberId,assetId,columnName,sqlCapability);
	}
}
