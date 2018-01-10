package com.graphiti.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.graphiti.bean.DataSet;
import com.graphiti.bean.SQLAsset;
import com.mongodb.WriteResult;


@Repository
public class SQLAssetRepository {

	@Autowired 
	MongoTemplate mongoTemplate;
	
	Logger logger = LoggerFactory.getLogger(DataSetRepository.class);

	public boolean save(String graphiti_tid,String memberId, SQLAsset sqlAsset){
		logger.info("graphiti-tid:{}.Creating an entry into Collection for assetId : {} by memberId:{}",graphiti_tid,sqlAsset.getId(),memberId);
		try{
			mongoTemplate.save(sqlAsset,"SQLAsset");
		}
		catch(Exception e){
			return false;
		}
		logger.info("graphiti-tid:{}.Created an entry into Collection for assetId : {} by memberId:{}",graphiti_tid,sqlAsset.getId(),memberId);
		return true;
	}
	
	public boolean updateSQLAsset(String assetId,String organizationId,Map<String,Object> fieldsToUpdate){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId)));
		Update update = new Update();
		for(String key: fieldsToUpdate.keySet()) {
			if(fieldsToUpdate.get(key) != null && !key.equalsIgnoreCase("olderVersionLinks")) {
				update.set(key, fieldsToUpdate.get(key));
			}
			else{
				// Only to push to a array
				update.push(key,fieldsToUpdate.get(key));
			}
		}
		WriteResult result = mongoTemplate.updateFirst(searchQuery, update, SQLAsset.class, "SQLAsset");
		return result.getN() == 1;
	}
	
	public SQLAsset getSQLAsset(String assetId, String orgId) {
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId)));
		//Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
		return mongoTemplate.findOne(searchQuery, SQLAsset.class, "SQLAsset");
	}
	
	public Map<String,SQLAsset> getMapOfSQLAssetBasedOnId(String orgId,String[] idsOfAsset){
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for(String idOfAsset:idsOfAsset){
			Criteria criteria = Criteria.where("_id").is(idOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		// TODO - Criteria.where("orgId").is(orgId)
		searchQuery.addCriteria(new Criteria().andOperator(new Criteria()
												.orOperator(arrayListOfCriteria
														.toArray(new Criteria[arrayListOfCriteria.size()]))));
		List<SQLAsset> listOfSQLAssetSet = mongoTemplate.find(searchQuery, SQLAsset.class, "SQLAsset");
		if(listOfSQLAssetSet!=null){
			Map<String,SQLAsset> mapOfSQLAssetIdAndCorrespondingAsset = new HashMap<String,SQLAsset>(listOfSQLAssetSet.size());
			for(SQLAsset sqlAsset : listOfSQLAssetSet){
				mapOfSQLAssetIdAndCorrespondingAsset.put(sqlAsset.getId(), sqlAsset);
			}
			return mapOfSQLAssetIdAndCorrespondingAsset;
		}
		else{
			return null;
		}
	}
	
	/**
	 * Get SQLAsset with specific interested fields only
	 * @param assetId
	 * @param fieldNames
	 * @return
	 */
	public SQLAsset getSQLAsset(String assetId,String...fieldNames){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId)));
		for(String fieldName:fieldNames){
			searchQuery.fields().include(fieldName);
		}
		return mongoTemplate.findOne(searchQuery, SQLAsset.class, "SQLAsset");
	}
	
	public void removeDataAssetInformationFromOutflow(String assetId,List<String> assetIdsToRemoveOuflow){
		for(String id:assetIdsToRemoveOuflow){
			Query searchQuery = new Query(Criteria.where("_id").is(id));
			SQLAsset sqlAsset = mongoTemplate.findOne(searchQuery, SQLAsset.class,"SQLAsset");
			if(sqlAsset.getRelatedAssets()!=null && sqlAsset.getRelatedAssets().getOutflow()!=null){
				boolean isAssetIdPresent = false;
				int iterator = 0;
				for(iterator=0;iterator<sqlAsset.getRelatedAssets().getOutflow().size();iterator++){
					if(sqlAsset.getRelatedAssets().getOutflow().get(iterator).getId().equalsIgnoreCase(assetId)){
						isAssetIdPresent = true;
						break;
					}
				}
				if(isAssetIdPresent == true){
					sqlAsset.getRelatedAssets().getOutflow().remove(iterator); // remove from outflow
				}
				mongoTemplate.save(sqlAsset);
			}
			else{
				continue;
			}
		}
	}
	
	// TODO = Accept OrgId
	public List<SQLAsset> getListOfSQLAssetBasedOnIds(String[] idOfAssets){
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for(String idOfAsset:idOfAssets){
			Criteria criteria = Criteria.where("_id").is(idOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		searchQuery.addCriteria(new Criteria().andOperator(new Criteria()
												.orOperator(arrayListOfCriteria
														.toArray(new Criteria[arrayListOfCriteria.size()]))));
		List<SQLAsset> listOfSQLAsset = mongoTemplate.find(searchQuery, SQLAsset.class, "SQLAsset");
		return listOfSQLAsset;
	}
	
	public void addOutFlowForSQLAsset(List<SQLAsset> listOfSQLAsset){
		for(SQLAsset sqlAsset:listOfSQLAsset){
			mongoTemplate.save(sqlAsset, "SQLAsset");
		}
	}
	
	
	public void removeSQLAssetInformationFromOutFlow(String assetId,List<String> assetIdsToRemoveOuflow){
		for(String id:assetIdsToRemoveOuflow){
			Query searchQuery = new Query(Criteria.where("_id").is(id));
			SQLAsset sqlAsset = mongoTemplate.findOne(searchQuery, SQLAsset.class,"SQLAsset");
			if(sqlAsset.getRelatedAssets()!=null && sqlAsset.getRelatedAssets().getOutflow()!=null){
				boolean isAssetIdPresent = false;
				int iterator = 0;
				for(iterator=0;iterator<sqlAsset.getRelatedAssets().getOutflow().size();iterator++){
					if(sqlAsset.getRelatedAssets().getOutflow().get(iterator).getId().equalsIgnoreCase(assetId)){
						isAssetIdPresent = true;
						break;
					}
				}
				if(isAssetIdPresent == true){
					sqlAsset.getRelatedAssets().getOutflow().remove(iterator); // remove from outflow
				}
				mongoTemplate.save(sqlAsset);
			}
			else{
				continue;
			}
		}
	}
	
	/**
	 * Delete a specific SQLAsset
	 * @param assetId
	 * @param orgId
	 */
	public void deleteSQLAsset(String graphiti_tid,String assetId,String orgId){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId))); // TODO - Need to add Org Id here
		WriteResult result = mongoTemplate.remove(searchQuery, SQLAsset.class, "SQLAsset");
		if(result.getN() != 1){
			logger.error("graphiti-tid:{}.No document was deleted for asset with Id:{}",graphiti_tid,assetId);
		}
	}
	
}
