package com.graphiti.repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.coyote.http11.filters.VoidInputFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.graphiti.bean.AssetUsers;
import com.graphiti.bean.AssetUsersInfo;
import com.graphiti.bean.DataSet;
import com.graphiti.bean.FAQ;
import com.graphiti.bean.Note;
import com.graphiti.exceptions.AssetNotFoundException;
import com.graphiti.exceptions.DataRetrievalException;
import com.graphiti.exceptions.DataUpdationException;
import com.mongodb.WriteResult;

@Repository
public class AssetUsersRepository {

	@Autowired
	MongoTemplate mongoTemplate;

	Logger logger = LoggerFactory.getLogger(AssetUsersRepository.class);

	public String save(String graphiti_tid, String memberId, AssetUsers asset) {
		logger.info("graphiti_tid:{}. Creating an asset in the repository",
				graphiti_tid);
		long currentTime = Instant.now().getEpochSecond();
		if (asset.getId() == null) {
			String assetId = UUID.randomUUID().toString();// assign the asset a
															// UUID
			asset.setId(assetId); // set the asset Id
			asset.setCreatedEpochTime(currentTime);
		}
		asset.setLastModifiedEpochTime(currentTime);
		mongoTemplate.save(asset);
		logger.info(
				"graphiti_tid:{}. Created an asset with assetId:{} for member with id:{}",
				graphiti_tid, asset.getId(), memberId);
		return asset.getId();
	}

	public AssetUsers getAsset(String graphiti_tid, String assetId) {
		logger.info("graphiti_tid:{}. Getting an asset in the repository",
				graphiti_tid);
		Query query = new Query(Criteria.where("_id").is(assetId));
		return mongoTemplate.findOne(query, AssetUsers.class);
	}

	public AssetUsers getAsset(String graphiti_tid, String assetId, String orgId) {
		logger.info("graphiti_tid:{}. Getting an asset in the repository",
				graphiti_tid);
		Query query = new Query(new Criteria().andOperator(Criteria
				.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
		return mongoTemplate.findOne(query, AssetUsers.class);
	}

	public AssetUsers getAssetBasedOnNameAndOrganization(String assetName,
			String orgId) {
		Query query = new Query(new Criteria().andOperator(
				Criteria.where("name").is(assetName), Criteria.where("orgId")
						.is(orgId)));
		return mongoTemplate.findOne(query, AssetUsers.class);
	}

	/**
	 * 
	 * @param assetId
	 * @return
	 */
	public AssetUsers getAssetUsers(String assetId, String orgId) {
		try {
			Query searchQuery = null;
			if (orgId != null) {
				searchQuery = new Query(new Criteria().andOperator(Criteria
						.where("_id").is(assetId),
						Criteria.where("orgId").is(orgId)));
			} else {
				searchQuery = new Query(new Criteria().andOperator(Criteria
						.where("_id").is(assetId)));
			}
			AssetUsers asset = mongoTemplate.findOne(searchQuery,
					AssetUsers.class, "AssetUsers");
			return asset;
		} catch (Exception e) {
			logger.error(
					"Error while getting asset details for asset with Id:{}",
					assetId);
			throw new DataRetrievalException(
					"Error while getting asset details for asset");
		}
	}

	/**
	 *
	 */
	public boolean updateAsset(String assetId, String orgId,
			Map<String, Object> mapKeyAndFieldsToUpdate) {
		try {
			Query query = null;
			if (orgId != null) {
				query = new Query(new Criteria().andOperator(
						Criteria.where("_id").is(assetId),
						Criteria.where("orgId").is(orgId)));
			} else {
				query = new Query(Criteria.where("_id").is(assetId));
			}
			Update update = new Update();
			for (String key : mapKeyAndFieldsToUpdate.keySet()) {
				if (mapKeyAndFieldsToUpdate.get(key) != null) {
					update.set(key, mapKeyAndFieldsToUpdate.get(key));
				}
			}
			WriteResult result = mongoTemplate.updateFirst(query, update,
					AssetUsers.class, "AssetUsers");
			return result.getN() == 1;
		} catch (Exception e) {
			logger.error(
					"Error while updating asset details for asset with Id:{}",
					assetId);
			throw new DataUpdationException(
					"Error while updation asset details for asset");
		}
	}

	/**
	 * Delete a specific DataSet
	 * 
	 * @param assetId
	 * @param orgId
	 */
	public void deleteAssetUser(String graphiti_tid, String assetId,
			String orgId) {
		Query searchQuery = new Query(new Criteria().andOperator(Criteria
				.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
		WriteResult result = mongoTemplate.remove(searchQuery,
				AssetUsers.class, "AssetUsers");
		if (result.getN() != 1) {
			logger.error(
					"graphiti-tid:{}.No document was deleted for asset with Id:{}",
					graphiti_tid, assetId);
		}
	}

	public List<AssetUsers> getListOfAssetBasedOnNames(String orgId,
			String[] nameOfAssets) {
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for (String nameOfAsset : nameOfAssets) {
			Criteria criteria = Criteria.where("name").is(nameOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		searchQuery.addCriteria(new Criteria().andOperator(
				Criteria.where("orgId").is(orgId), new Criteria()
						.orOperator(arrayListOfCriteria
								.toArray(new Criteria[arrayListOfCriteria
										.size()]))));
		List<AssetUsers> listOfAsset = mongoTemplate.find(searchQuery,
				AssetUsers.class, "AssetUsers");
		return listOfAsset;
	}

	public List<AssetUsers> getListOfAssetBasedOnId(String orgId,
			String[] idOfAssets) {
		Query searchQuery = new Query();
		ArrayList<Criteria> arrayListOfCriteria = new ArrayList<Criteria>();
		for (String idOfAsset : idOfAssets) {
			Criteria criteria = Criteria.where("_id").is(idOfAsset);
			arrayListOfCriteria.add(criteria);
		}
		searchQuery.addCriteria(new Criteria().andOperator(
				Criteria.where("orgId").is(orgId), new Criteria()
						.orOperator(arrayListOfCriteria
								.toArray(new Criteria[arrayListOfCriteria
										.size()]))));
		List<AssetUsers> listOfAsset = mongoTemplate.find(searchQuery,
				AssetUsers.class, "AssetUsers");
		return listOfAsset;
	}

	public Map<String, String> getListOfAssetInfoBasedOnId(String orgId,
			ArrayList<String> assetIds) {
		try {
			List<AssetUsers> listOfAssetInfo = getListOfAssetBasedOnId(orgId,assetIds);
			Map<String, String> assetList = new HashMap<String, String>();
			for (AssetUsers assetUser : listOfAssetInfo) {
				assetList.put(assetUser.getId(), assetUser.getName());
			}
			return assetList;
		} catch (Exception e) {
			logger.error("Error Retreiving Assets for the user.");
			throw new AssetNotFoundException(
					"Error Retreiving assets for the user");
		}
	}

	public List<AssetUsers> getListOfAssetBasedOnId(String orgId,
			ArrayList<String> idOfAssets) {
		// Convert ArrayList to String[]
		String[] arrayOfAssetId = new String[idOfAssets.size()];
		idOfAssets.toArray(arrayOfAssetId);
		List<AssetUsers> listOfAsset = getListOfAssetBasedOnId(orgId,
				arrayOfAssetId);
		return listOfAsset;
	}

	/**
	 * Get Map of assetId's and corresponding assetName
	 * 
	 */
	public Map<String, String> getMapOfAssetIdAndAssetName(
			String organizationId, ArrayList<String> listOfAssetId) {

		List<AssetUsers> listOfAssetUsers = getListOfAssetBasedOnId(
				organizationId, listOfAssetId);
		Map<String, String> mapOfAssetIdAndCorrespondingAssetName = new HashMap<String, String>();
		for (AssetUsers assetUsers : listOfAssetUsers) {
			mapOfAssetIdAndCorrespondingAssetName.put(assetUsers.getId(),
					assetUsers.getName());
		}
		return mapOfAssetIdAndCorrespondingAssetName;
	}

	public HashMap<String, ArrayList<String>> getMapOfAssetTypeAndCorrespondingListOfAssetId(
			String orgId, String[] idOfAssets) {
		List<AssetUsers> listOfAsset = getListOfAssetBasedOnId(orgId,
				idOfAssets);
		HashMap<String, ArrayList<String>> mapOfAssetTypeAndCorrespondinglistOfAssetId = new HashMap<String, ArrayList<String>>();
		// Iterate over the list and create a map
		for (AssetUsers assetUsers : listOfAsset) {
			ArrayList<String> listOfAssetIds = mapOfAssetTypeAndCorrespondinglistOfAssetId
					.get(assetUsers.getAssetType().getValue());
			if (listOfAssetIds == null) {
				listOfAssetIds = new ArrayList<String>();
			}
			listOfAssetIds.add(assetUsers.getId());
			mapOfAssetTypeAndCorrespondinglistOfAssetId.put(assetUsers
					.getAssetType().getValue(), listOfAssetIds);
		}
		return mapOfAssetTypeAndCorrespondinglistOfAssetId;
	}

	/**
	 * add note
	 * 
	 * @return
	 */
	public WriteResult addNote(String graphiti_tid, String assetId,
			String orgId, Note note) {
		Query searchQuery = new Query(new Criteria().andOperator(Criteria
				.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
		Update update = new Update().push("notes", note);
		return mongoTemplate.updateFirst(searchQuery, update, AssetUsers.class);
	}

	/**
	 * add faq
	 * 
	 * @return
	 */
	public WriteResult addFAQ(String graphiti_tid, String assetId,
			String orgId, FAQ faq) {
		Query searchQuery = new Query(new Criteria().andOperator(Criteria
				.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
		Update update = new Update().push("faqs", faq);
		return mongoTemplate.updateFirst(searchQuery, update, AssetUsers.class);
	}

	/**
	 * Update Asset endorsement
	 */
	public WriteResult updateEndorsement(String graphiti_tid, String assetId,
			String orgId, AssetUsersInfo assetUsersInfo, String endorsementType) {
		Query searchQuery = new Query(new Criteria().andOperator(Criteria
				.where("_id").is(assetId), Criteria.where("orgId").is(orgId)));
		Update update = new Update().push(endorsementType, assetUsersInfo);
		return mongoTemplate.updateFirst(searchQuery, update, AssetUsers.class);
	}
}
