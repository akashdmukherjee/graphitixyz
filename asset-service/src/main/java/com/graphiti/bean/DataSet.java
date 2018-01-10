package com.graphiti.bean;

import java.util.ArrayList;
import java.util.List;
import javax.xml.bind.annotation.XmlRootElement;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Data Set Details
 * 
 * @author 
 *
 */
@Document(collection = "DataSetAsset")
@XmlRootElement
public class DataSet{

	private String id;
	private String name;
	private String cacheTableName;
	private DataSourceType dataSourceType;
	private String uploadFileName;
	private List<String> columnNamesInCache;
	private String orgId;
	// lets have this initialized for every object
	private RelatedAssets relatedAssets = new RelatedAssets();
	private String idOfDefaultFilter;
	private List<SQLCapability> sqlCapabilities;
	private List<SQLFilter> sqlFilters;


	public DataSet(){
		columnNamesInCache = new ArrayList<String>();
	}
	
	// Full Constructor
	public DataSet(String assetId, String assetName, String cacheTableName,
			DataSourceType dataSourceType, String uploadFileName,
			List<String> columnNamesInCache, String orgId) {
			this.id = assetId;
			this.name = assetName;
			this.cacheTableName = cacheTableName;
			this.dataSourceType = dataSourceType;
			this.uploadFileName = uploadFileName;
			this.columnNamesInCache = columnNamesInCache;
			this.orgId = orgId;
	}
	
	// Constructor
	public DataSet(String assetId, String assetName, String cacheTableName,
				DataSourceType dataSourceType,
				List<String> columnNamesInCache, String orgId) {
				this.id = assetId;
				this.name = assetName;
				this.cacheTableName = cacheTableName;
				this.dataSourceType = dataSourceType;
				this.columnNamesInCache = columnNamesInCache;
				this.orgId = orgId;
	}
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getCacheTableName() {
		return cacheTableName;
	}
	public void setCacheTableName(String cacheTableName) {
		this.cacheTableName = cacheTableName;
	}
	public DataSourceType getDataSourceType() {
		return dataSourceType;
	}
	public void setDataSourceType(DataSourceType dataSourceType) {
		this.dataSourceType = dataSourceType;
	}
	public String getUploadFileName() {
		return uploadFileName;
	}
	public void setUploadFileName(String uploadFileName) {
		this.uploadFileName = uploadFileName;
	}
	public List<String> getColumnNamesInCache() {
		return columnNamesInCache;
	}
	public void setColumnNamesInCache(List<String> columnNamesInCache) {
		this.columnNamesInCache = columnNamesInCache;
	}
	public String getOrgId() {
		return orgId;
	}
	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}
	
	public RelatedAssets getRelatedAssets() {
		return relatedAssets;
	}

	public void setRelatedAssets(RelatedAssets relatedAssets) {
		this.relatedAssets = relatedAssets;
	}
	
	public String getIdOfDefaultFilter() {
		return idOfDefaultFilter;
	}

	public void setIdOfDefaultFilter(String idOfDefaultFilter) {
		this.idOfDefaultFilter = idOfDefaultFilter;
	}
	
	public List<SQLCapability> getSqlCapabilities() {
		return sqlCapabilities;
	}

	public void setSqlCapabilities(List<SQLCapability> sqlCapabilities) {
		this.sqlCapabilities = sqlCapabilities;
	}

	public List<SQLFilter> getSqlFilters() {
		return sqlFilters;
	}

	public void setSqlFilters(List<SQLFilter> sqlFilters) {
		this.sqlFilters = sqlFilters;
	}
	
}