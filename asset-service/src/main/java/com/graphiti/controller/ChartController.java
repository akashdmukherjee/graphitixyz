package com.graphiti.controller;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.ws.rs.PathParam;

import org.json.simple.JSONObject;
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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.graphiti.bean.Asset;
import com.graphiti.bean.AssetDetailedInformation;
import com.graphiti.bean.AssetType;
import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.ChartAsset;
import com.graphiti.bean.ChartConfigs;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.Member;
import com.graphiti.bean.UserAssetsInfo;
import com.graphiti.bean.UserType;
import com.graphiti.externalServices.IdentityService;
import com.graphiti.externalServices.SearchService;
import com.graphiti.repository.AssetUsersRepository;
import com.graphiti.repository.ChartAssetRepository;
import com.graphiti.repository.DataSetRepository;
import com.graphiti.repository.UserAssetsRepository;

@RestController
public class ChartController {

	private Logger logger = LoggerFactory.getLogger(ChartController.class);
	
	@Autowired
	private AssetUsersRepository assetUsersRepository;
	
	@Autowired
	private UserAssetsRepository userAssetsRepository;
	
	@Autowired
	private ChartAssetRepository chartAssetRepository;
	
	@Autowired
	private DataSetRepository dataSetRepository;
	
	
	// IsRelatedAsset - This is true because Charts has to be backed up by a 
	// DataAsset
	@RequestMapping(value = "/asset/chartAsset", method = RequestMethod.POST)
	public ResponseEntity<?> addChartAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestBody AssetDetailedInformation assetDetailInformation) {
		try{
			// Get member Information from memberId
			IdentityService identityService = new IdentityService();
			Member member = identityService.getMember(graphiti_tid, memberId);
			logger.info("graphiti-tid:{}.Creation of Chart Asset for Member with Id:{} and OrgId:{}",graphiti_tid,memberId,assetDetailInformation.getOrgId());
			// Create AssetUsers first
			// 1. Create Creator
			logger.info("graphiti-tid:{}.Initializing creator of an asset",graphiti_tid);
			AssetUsersInfo creator = new AssetUsersInfo(memberId, member.getFullName(),
					UserType.MEMBER);
			logger.info("graphiti-tid:{}. Creating AssetUsers object",graphiti_tid);
			AssetUsers assetUser = new AssetUsers(assetDetailInformation.getAssetName(),
					AssetType.CHART, creator, orgId);
			// This saves to AssetUser collection
			// Since this is a newly created asset we do not have to worry
			// about it and simply save it
			logger.info("graphiti-tid:{}. Saving AssetUsers object in database",graphiti_tid);
			String assetId = assetUsersRepository.save(graphiti_tid, memberId, assetUser);
			logger.info("graphiti-tid:{}. AssetUsers object successfully saved in database. AssetId created:{}",graphiti_tid,assetId);
			// UserAssetsInfo
			logger.info(
					"graphiti-tid:{}.Creating an entry of the newly created asset with Id:{} in UserAssetsInfo for member with Id:{}",
					graphiti_tid, assetId, memberId);
			// TODO - change this name creatorOfAsset
			UserAssetsInfo creatorOfAsset = new UserAssetsInfo(assetId, AssetType.CHART);
			userAssetsRepository.addUserAsCreatorOfAsset(graphiti_tid, memberId, orgId,
					UserType.MEMBER, creatorOfAsset);
			// Create ChartAsset
			ChartAsset chartAsset = new ChartAsset(
					assetId,
					assetDetailInformation.getAssetName(),
					assetDetailInformation.getChartConfigs(),orgId);
			// As of now there will only be 1 source which is the dataset
			String[] arrayOfAssetIdsInflow = assetDetailInformation.getSourceAssetIds().toArray(new String[assetDetailInformation.getSourceAssetIds().size()]);
			UserAssetsInfo inflowAssetInfo = new UserAssetsInfo(arrayOfAssetIdsInflow[0], AssetType.DATASET);
			chartAsset.getRelatedAssets().getInflow().add(inflowAssetInfo);
			// We have to add outflow for the data asset too
			List<DataSet> listOfDataSetWhichAreInflowFortheChart = dataSetRepository.getListOfDataSetBasedOnIds(orgId,new String[] { arrayOfAssetIdsInflow[0] });
			listOfDataSetWhichAreInflowFortheChart.get(0).getRelatedAssets().getOutflow().add(creatorOfAsset);
			dataSetRepository.addOutFlowForDataSets(listOfDataSetWhichAreInflowFortheChart); 
			// save the asset 
			chartAssetRepository.save(graphiti_tid, memberId, chartAsset);
			// Add to search also
			SearchService searchService = new SearchService();
			searchService.addAssetForSearch(graphiti_tid, assetId, assetDetailInformation.getAssetName(), AssetType.CHART.getValue(), null, memberId, member.getFullName(), orgId, null, assetDetailInformation.getAsset_description());
			// Once the asset is saved 
			// we have to return the Id 
			JSONObject responseObject = new JSONObject();
			responseObject.put("chartAssetId", assetId);
			return new ResponseEntity<>(responseObject,HttpStatus.OK);
		}
		catch(JsonProcessingException e){
			// TODO 
			// logger of exception
			// throw exception
			return new ResponseEntity<>(null,HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@RequestMapping(value = "/ext/asset/chartAsset", method = RequestMethod.POST)
	public ResponseEntity<?> extaddChartAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@RequestBody AssetDetailedInformation assetDetailInformation) {
		return addChartAsset(memberId, graphiti_tid, orgId, assetDetailInformation);
	}
	
	@RequestMapping(value = "/asset/chartAsset/{assetId}", method = RequestMethod.PUT)
	public ResponseEntity<?> updateChartAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId")String assetId,
			@RequestBody AssetDetailedInformation assetDetailInformation) {
		logger.info("graphiti-tid:{}. Updating chart configs for chart with id:{}",graphiti_tid,assetId);
		boolean statusOfUpdate = chartAssetRepository.updateChartConfigs(assetId,orgId,assetDetailInformation.getChartConfigs());
		if(statusOfUpdate){
			return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
		}
		else{
			// TODO - Throw Exception
			return new ResponseEntity<>(null,HttpStatus.NO_CONTENT);
		}
	}
	
	@RequestMapping(value = "/ext/asset/chartAsset/{assetId}", method = RequestMethod.PUT)
	public ResponseEntity<?> extupdateChartAsset(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId")String assetId,
			@RequestBody AssetDetailedInformation assetDetailInformation) {
		return updateChartAsset(memberId, graphiti_tid, orgId, assetId, assetDetailInformation);
	}
	
	@RequestMapping(value = "/asset/chartAsset/{assetId}/getTableName", method = RequestMethod.GET,produces="application/json")
	public ResponseEntity<?> getTableNamePoweringChart(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId")String assetId) {
		logger.info("graphiti-tid:{}.Getting details of the dataset powering chart asset with Id:{}",graphiti_tid,assetId);
		ChartAsset chartAssetDetails = chartAssetRepository.getChartDetails(assetId, orgId);
		String dataAssetIdPoweringChart = chartAssetDetails.getRelatedAssets().getInflow().get(0).getId();
		DataSet dataAssetPoweingTheChart = dataSetRepository.get(graphiti_tid, memberId, orgId, dataAssetIdPoweringChart);
		logger.info("graphiti-tid:{}.Got details of the dataset powering chart asset with Id:{}",graphiti_tid,assetId);
		String tableName = dataAssetPoweingTheChart.getCacheTableName();
		JSONObject jsonResponse = new JSONObject();
		jsonResponse.put("tableName",tableName);
		return new ResponseEntity<>(jsonResponse,HttpStatus.OK);
	}
	
	@RequestMapping(value = "/asset/chartAsset/{assetId}", method = RequestMethod.GET,produces="application/json")
	public ResponseEntity<ChartAsset> getChartDetails(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId")String assetId) {
		logger.info("graphiti-tid:{}. Getting chart details for asset with id:{}",graphiti_tid,assetId);
		ChartAsset chartAssetDetails = chartAssetRepository.getChartDetails(assetId, orgId);
		return new ResponseEntity<ChartAsset>(chartAssetDetails,HttpStatus.OK); 
	}
	
	@RequestMapping(value = "/ext/asset/chartAsset/{assetId}", method = RequestMethod.GET,produces="application/json")
	public ResponseEntity<ChartAsset> extgetChartDetails(@RequestHeader(value = "memberId") String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestHeader(value = "orgId") String orgId,
			@PathVariable(value = "assetId")String assetId) {
		return getChartDetails(memberId, graphiti_tid, orgId, assetId);
	}
}
