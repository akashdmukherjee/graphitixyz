package com.graphiti.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.crypto.Data;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.grapthiti.utils.*;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.SQLAsset;
import com.graphiti.bean.SQLCapability;
import com.graphiti.bean.SQLFilter;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.exceptions.FilterAdditionException;
import com.graphiti.exceptions.FilterSetNotFoundException;
import com.graphiti.exceptions.FilterUpdationException;
import com.mongodb.WriteResult;

@Repository
public class DataSetRepository {

	@Autowired 
	MongoTemplate mongoTemplate;
	
	Logger logger = LoggerFactory.getLogger(DataSetRepository.class);

	public void save(String graphiti_tid,String memberId, DataSet dataset){
		logger.info("graphiti-tid:{}.Creating an entry into Collection for assetId : {} by memberId:{}",graphiti_tid,dataset.getId(),memberId);
		mongoTemplate.save(dataset);
		logger.info("graphiti-tid:{}.Created an entry into Collection for assetId : {} by memberId:{}",graphiti_tid,dataset.getId(),memberId);
	}
	
	public DataSet getDataSetAsset(String assetId) {
		Query query = new Query(Criteria.where("id").is(assetId));
		return mongoTemplate.findOne(query, DataSet.class, "DataSetAsset");
	}
	
	// The purpose of this function is to only store filters
	// SQLCapability and SQLOnly
	public String storeOrUpdateFilter(String graphiti_tid,String assetId,String orgId, String fieldName,
			Object filter) {
		try{
			Query query = new Query(new Criteria().andOperator(Criteria
					.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
			Update update = new Update();
			if (fieldName.equalsIgnoreCase("sqlCapability")) {
				logger.info("graphiti-tid:{}.The request is for a SQLCapability filter.",graphiti_tid);
				// First we have to check if the sqlCapability is a new one
				// If its a new one then the id field in that case will be empty
				SQLCapability sqlCapability = (SQLCapability) filter;
				if (sqlCapability.getFilterSetId() == null
						|| sqlCapability.getFilterSetId().trim().length() == 0) { // New SQLCapability
					logger.info("graphiti-tid:{}. There is no Id set for this filter that means its a new filter.",graphiti_tid);										
					// Have a random Id for the Filter
					logger.info("graphiti-tid:{}.Creating a new Id for storing the filter.",graphiti_tid);
					String filterId = Utils.generateRandomAlphaNumericString(6);
					sqlCapability.setFilterSetId(filterId);
					logger.info("graphiti-tid:{}.Created a filter with Id:{}",graphiti_tid,filterId);
					update.push("sqlCapabilities", sqlCapability); // Make an update to sqlCapabilities
					WriteResult result = mongoTemplate.updateFirst(query, update, DataSet.class, "DataSetAsset");
					if(result.getN() != 1){
						logger.error("graphiti-tid:{}.No document was updated for asset with Id:{}",graphiti_tid,assetId);
						throw new FilterAdditionException("Filter could not be added successfully");
					}
					return filterId;
				} else {
					logger.info("graphiti-tid:{}. Will be updating filter with id:{} for asset with id:{}",graphiti_tid,sqlCapability.getFilterSetId(),assetId);
					// Get the appropirate SQLCapability that we wish to update
					DataSet dataSet = getDataSetAsset(assetId);
					List<SQLCapability> sqlCapabilityList = dataSet.getSqlCapabilities();
					int iterator = 0;
					for (iterator = 0; iterator < sqlCapabilityList.size(); iterator++) {
						if (sqlCapabilityList.get(iterator).getFilterSetId()
								.equalsIgnoreCase(sqlCapability.getFilterSetId())) {
							break;
						}
					}
					// Replacing old SQLCapability by new SQLCapability
					if (iterator < sqlCapabilityList.size()) { // To avoid arrayIndexOutOfBounds
						sqlCapabilityList.set(iterator, sqlCapability);
						update.set("sqlCapabilities", sqlCapabilityList); // Now update in the database
						WriteResult result = mongoTemplate.updateFirst(query, update, DataSet.class, "DataSetAsset");
						if(result.getN() != 1){
							logger.error("graphiti-tid:{}. Could not update asset with Id:{}",graphiti_tid,assetId);
							throw new FilterUpdationException("Could not update filter");
						}
						return sqlCapability.getFilterSetId();
					} else {
						logger.error("graphiti_tid:{}.Filter with the mentioned Id:{} was not found in the asset with id:{}",graphiti_tid,sqlCapability.getFilterSetId(),assetId);
						throw new FilterSetNotFoundException("Filter that was supposed to be updated was not found");
					}
				}
			} else if (fieldName.equalsIgnoreCase("sqlFilters")) {
					logger.info("graphiti-tid:{}.The request is for a SQLOnly filter.",graphiti_tid);
					SQLFilter sqlFitler = (SQLFilter) filter;
					if (sqlFitler.getFilterSetId() == null
							|| sqlFitler.getFilterSetId().trim().length() == 0) { // New SQLFilter
						logger.info("graphiti-tid:{}. There is no Id set for this filter that means its a new filter.",graphiti_tid);
						logger.info("graphiti-tid:{}.Creating a new Id for storing the filter.",graphiti_tid);
						String filterId = Utils
								.generateRandomAlphaNumericString(6);
						logger.info("graphiti-tid:{}.Created a sql only filter with Id:{}",graphiti_tid,filterId);
						// Have a random Id for the Filter
						sqlFitler.setFilterSetId(filterId);
						update.push("sqlFilters", sqlFitler); // Make an update to sqlFilter
						WriteResult result = mongoTemplate.updateFirst(query, update, DataSet.class, "DataSetAsset");
						if(result.getN() != 1){
							logger.error("graphiti-tid:{}.No document was updated for asset with Id:{}",graphiti_tid,assetId);
							throw new FilterAdditionException("SQL Filter could not be added successfully");
						}
						return filterId;
					} else {
						logger.info("graphiti-tid:{}. Will be updating filter with id:{} for asset with id:{}",graphiti_tid,sqlFitler.getFilterSetId(),assetId);
						// Get the appropirate SQLFilter that we wish to update
						DataSet dataSet = getDataSetAsset(assetId);
						List<SQLFilter> sqlOnlyFilters = dataSet.getSqlFilters();
						int iterator = 0;
						for (iterator = 0; iterator < sqlOnlyFilters.size(); iterator++) {
							if (sqlOnlyFilters.get(iterator).getFilterSetId()
									.equalsIgnoreCase(sqlFitler.getFilterSetId())) {
								break;
							}
						}
						// Replacing old SQLCapability by new SQLCapability
						if (iterator < sqlOnlyFilters.size()) { // To avoid arrayIndexOutOfBounds
							sqlOnlyFilters.set(iterator, sqlFitler);
							update.set("sqlFilters", sqlOnlyFilters); // Now update in the database
							WriteResult result = mongoTemplate.updateFirst(query, update, DataSet.class, "DataSetAsset");
							if(result.getN() != 1){
								logger.error("graphiti-tid:{}. Could not update asset with Id:{}",graphiti_tid,assetId);
								throw new FilterUpdationException("Could not update filter");
							}
							return sqlFitler.getFilterSetId();
						} else {
							logger.error("graphiti_tid:{}.Filter with the mentioned Id:{} was not found in the asset with id:{}",graphiti_tid,sqlFitler.getFilterSetId(),assetId);
							throw new FilterSetNotFoundException("Filter that was supposed to be updated was not found");
						}
					}
			}
		}
		catch(Exception e){
			logger.error("graphiti-tid:{}. Error during addition/updation of filter into asset with id:{}",graphiti_tid,assetId);
			throw new FilterUpdationException("Could Not Add/Update filter");
		}
		return null;
	}
	
	public boolean updateDataSetAsset(String assetId, Map<String, Object> updateFields) {
		Query query = new Query(Criteria.where("_id").is(assetId));
		Update update = new Update();
		for(String key: updateFields.keySet()) {
			if(key.equalsIgnoreCase("sqlCapability")){
				// First we have to check if the sqlCapability is a new one
				// If its a new one then the id field in that case will be empty
				SQLCapability sqlCapability = (SQLCapability) updateFields.get(key);
				if(sqlCapability.getFilterSetId()==null || sqlCapability.getFilterSetId().trim().length()==0){ // New SQLCapability
					// Have a random Id for the Filter
					sqlCapability.setFilterSetId(Utils.generateRandomAlphaNumericString(6));
					update.push("sqlCapabilities",sqlCapability); // Make an update to sqlCapabilities
				}
				else{
					// Get the appropirate SQLCapability that we wish to update
					DataSet dataSet  = getDataSetAsset(assetId);
					List<SQLCapability> sqlCapabilityList = dataSet.getSqlCapabilities();
					int iterator = 0;
					for(iterator=0;iterator<sqlCapabilityList.size();iterator++){
						if(sqlCapabilityList.get(iterator).getFilterSetId().equalsIgnoreCase(sqlCapability.getFilterSetId())){
							break;
						}
					}
					// Replacing old SQLCapability by new SQLCapability
					if(iterator<sqlCapabilityList.size()){  // To avoid arrayIndexOutOfBounds
						sqlCapabilityList.set(iterator, sqlCapability);
						update.set("sqlCapabilities", sqlCapabilityList); // Now update in the database
					}
					else{
						return true;
					}
				}
			}
			else{
				if(updateFields.get(key) != null) {
					update.set(key, updateFields.get(key));
				}
			}
		}
		WriteResult result = mongoTemplate.updateFirst(query, update, DataSet.class, "DataSetAsset");
		return result.getN() == 1;
	}
	
	
	public DataSet get(String graphiti_tid,String memberId,String orgId,String assetId){
		logger.info("graphiti_tid:{}. Getting asset details for asset with id:{}",graphiti_tid,assetId);
		// I think we should also check here if the user has access to the dataset in this case
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		DataSet dataSet = mongoTemplate.findOne(searchQuery,DataSet.class,"DataSetAsset");
		if(dataSet==null){
			logger.info("graphiti_tid:{}. Did not receive asset details for asset with id:{}",graphiti_tid,assetId);
		}
		else{
			logger.info("graphiti_tid:{}. Received asset details for asset with id:{}",graphiti_tid,assetId);
		}
		return dataSet; 
	}
	
	public boolean deleteSQLCapability(String graphiti_tid,String memberId,String orgId,String assetId,String filterId){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		DataSet dataSet = mongoTemplate.findOne(searchQuery,DataSet.class,"DataSetAsset");
		Update update = new Update();
		if(dataSet==null){
			logger.info("graphiti_tid:{}. Did not receive asset details for asset with id:{}",graphiti_tid,assetId);
			return false;
		}
		else{
			logger.info("graphiti_tid:{}. Received asset details for asset with id:{}",graphiti_tid,assetId);
		}
		// Now once we have the dataset 
		// we have to first iterate over the filters and find the appropriate filter
		List<SQLCapability> sqlCapabilityList = dataSet.getSqlCapabilities();
		int iterator = 0;
		for(iterator=0;iterator<sqlCapabilityList.size();iterator++){
			if(sqlCapabilityList.get(iterator).getFilterSetId().equalsIgnoreCase(filterId)){
				break;
			}
		}
		if(iterator<sqlCapabilityList.size()){ // To avoid arrayIndexOutOfBounds
			sqlCapabilityList.remove(iterator);
			update.set("sqlCapabilities", sqlCapabilityList); // Now update in the database
		}
		else{
			return true;
		}
		WriteResult result = mongoTemplate.updateFirst(searchQuery, update, DataSet.class, "DataSetAsset");
		return result.getN() == 1;
	}
	
	public boolean deleteSQLOnlyFilter(String graphiti_tid,String memberId,String orgId,String assetId,String filterId){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		DataSet dataSet = mongoTemplate.findOne(searchQuery,DataSet.class,"DataSetAsset");
		Update update = new Update();
		if(dataSet==null){
			logger.info("graphiti_tid:{}. Did not receive asset details for asset with id:{}",graphiti_tid,assetId);
			return false;
		}
		else{
			logger.info("graphiti_tid:{}. Received asset details for asset with id:{}",graphiti_tid,assetId);
		}
		// Now once we have the dataset 
		// we have to first iterate over the filters and find the appropriate filter
		List<SQLFilter> sqlFilterList = dataSet.getSqlFilters();
		int iterator = 0;
		for(iterator=0;iterator<sqlFilterList.size();iterator++){
			if(sqlFilterList.get(iterator).getFilterSetId().equalsIgnoreCase(filterId)){
				break;
			}
		}
		if(iterator<sqlFilterList.size()){ // To avoid arrayIndexOutOfBounds
			sqlFilterList.remove(iterator);
			update.set("sqlFilters", sqlFilterList); // Now update in the database
		}
		else{
			return true;
		}
		WriteResult result = mongoTemplate.updateFirst(searchQuery, update, DataSet.class, "DataSetAsset");
		return result.getN() == 1;
	}
	
	public List<DataSet> getListOfDataSetBasedOnIds(String orgId,String[] idOfAssets){
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for(String idOfAsset:idOfAssets){
			Criteria criteria = Criteria.where("_id").is(idOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		searchQuery.addCriteria(new Criteria().andOperator(
												Criteria.where("orgId").is(orgId), new Criteria()
												.orOperator(arrayListOfCriteria
														.toArray(new Criteria[arrayListOfCriteria.size()]))));
		List<DataSet> listOfDataSet = mongoTemplate.find(searchQuery, DataSet.class, "DataSetAsset");
		return listOfDataSet;
	}
	
	public Map<String,DataSet> getMapOfDataSetBasedOnId(String orgId,String[] idsOfAsset){
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for(String idOfAsset:idsOfAsset){
			Criteria criteria = Criteria.where("_id").is(idOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		searchQuery.addCriteria(new Criteria().andOperator(
												Criteria.where("orgId").is(orgId), new Criteria()
												.orOperator(arrayListOfCriteria
														.toArray(new Criteria[arrayListOfCriteria.size()]))));
		List<DataSet> listOfDataSet = mongoTemplate.find(searchQuery, DataSet.class, "DataSetAsset");
		if(listOfDataSet!=null){
			Map<String,DataSet> mapOfDataAssetIdAndCorrespondingAsset = new HashMap<String,DataSet>(listOfDataSet.size());
			for(DataSet dataSet : listOfDataSet){
				mapOfDataAssetIdAndCorrespondingAsset.put(dataSet.getId(), dataSet);
			}
			return mapOfDataAssetIdAndCorrespondingAsset;
		}
		else{
			return null;
		}
	}
	
	public void addOutFlowForDataSets(List<DataSet> listOfDataSets){
		for(DataSet dataSet:listOfDataSets){
			mongoTemplate.save(dataSet, "DataSetAsset");
		}
	}
	
	public void removeSQLAssetInformationFromOutFlow(String assetId,List<String> assetIdsToRemoveOuflow){
		for(String id:assetIdsToRemoveOuflow){
			Query searchQuery = new Query(Criteria.where("_id").is(id));
			DataSet dataSet = mongoTemplate.findOne(searchQuery, DataSet.class,"DataSetAsset");
			if(dataSet.getRelatedAssets()!=null && dataSet.getRelatedAssets().getOutflow()!=null){
				boolean isAssetIdPresent = false;
				int iterator = 0;
				for(iterator=0;iterator<dataSet.getRelatedAssets().getOutflow().size();iterator++){
					if(dataSet.getRelatedAssets().getOutflow().get(iterator).getId().equalsIgnoreCase(assetId)){
						isAssetIdPresent = true;
						break;
					}
				}
				if(isAssetIdPresent == true){
					dataSet.getRelatedAssets().getOutflow().remove(iterator); // remove from outflow
				}
				mongoTemplate.save(dataSet);
			}
			else{
				continue;
			}
		}
	}
	
	/**
	 * Delete a specific DataSet
	 * @param assetId
	 * @param orgId
	 */
	public void deleteDataSetAsset(String graphiti_tid,String assetId,String orgId){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		WriteResult result = mongoTemplate.remove(searchQuery, DataSet.class, "DataSetAsset");
		if(result.getN() != 1){
			logger.error("graphiti-tid:{}.No document was deleted for asset with Id:{}",graphiti_tid,assetId);
		}
	}
}
