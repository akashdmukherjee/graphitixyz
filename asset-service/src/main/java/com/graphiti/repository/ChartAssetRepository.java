package com.graphiti.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.graphiti.bean.ChartAsset;
import com.graphiti.bean.ChartConfigs;
import com.graphiti.bean.SQLAsset;
import com.mongodb.WriteResult;

@Repository
public class ChartAssetRepository {

	@Autowired 
	MongoTemplate mongoTemplate;
	
	Logger logger = LoggerFactory.getLogger(ChartAssetRepository.class);

	public boolean save(String graphiti_tid,String memberId, ChartAsset chartAsset){
		logger.info("graphiti-tid:{}.Creating an entry into Collection for assetId : {} by memberId:{}",graphiti_tid,chartAsset.getId(),memberId);
		try{
			mongoTemplate.save(chartAsset,"ChartAsset");
		}
		catch(Exception e){
			return false;
		}
		logger.info("graphiti-tid:{}.Created an entry into Collection for assetId : {} by memberId:{}",graphiti_tid,chartAsset.getId(),memberId);
		return true;
	}	
	
	public boolean updateChartConfigs(String assetId, String orgId, ChartConfigs chartConfigs){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		Update update = new Update();
		update.set("chartConfigs", chartConfigs);
		WriteResult result = mongoTemplate.updateFirst(searchQuery, update, ChartAsset.class, "ChartAsset");
		return result.getN() == 1;
	}
	
	public ChartAsset getChartDetails(String assetId,String orgId){
		Query searchQuery = new Query(new Criteria().andOperator(Criteria.where("_id").is(assetId),Criteria.where("orgId").is(orgId)));
		ChartAsset chartAsset =  mongoTemplate.findOne(searchQuery, ChartAsset.class,"ChartAsset");
		return chartAsset;
	}
}
