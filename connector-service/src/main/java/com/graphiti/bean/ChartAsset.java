package com.graphiti.bean;

import org.springframework.data.mongodb.core.mapping.Document;
// In this case we can get to know the dataAsset from which it is created from 
// the inflow which will be basically 1 dataSet only

@Document(collection = "ChartAsset")
public class ChartAsset {
	private String id;
	private String name;
	private ChartConfigs chartConfigs;
	private RelatedAssets relatedAssets = new RelatedAssets();
	private String orgId;
	
	
	
	public ChartAsset(String id, String name, ChartConfigs chartConfigs,String orgId) {
		super();
		this.id = id;
		this.name = name;
		this.chartConfigs = chartConfigs;
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
	public ChartConfigs getChartConfigs() {
		return chartConfigs;
	}
	public void setChartConfigs(ChartConfigs chartConfigs) {
		this.chartConfigs = chartConfigs;
	}

	public RelatedAssets getRelatedAssets() {
		return relatedAssets;
	}

	public void setRelatedAssets(RelatedAssets relatedAssets) {
		this.relatedAssets = relatedAssets;
	}

	public String getOrgId() {
		return orgId;
	}

	public void setOrgId(String orgId) {
		this.orgId = orgId;
	}
}
