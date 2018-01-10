package com.graphiti.bean;

import java.util.ArrayList;

public class RelatedAssets {
	
	private ArrayList<UserAssetsInfo> inflow;
	private ArrayList<UserAssetsInfo> outflow;
	private ArrayList<UserAssetsInfo> manual;
	
	// Constructor
	public RelatedAssets(){
		inflow = new ArrayList<UserAssetsInfo>(1);
		outflow = new ArrayList<UserAssetsInfo>(1);
		manual = new ArrayList<UserAssetsInfo>(1);
	}

	public ArrayList<UserAssetsInfo> getInflow() {
		return inflow;
	}

	public void setInflow(ArrayList<UserAssetsInfo> inflow) {
		this.inflow = inflow;
	}

	public ArrayList<UserAssetsInfo> getOutflow() {
		return outflow;
	}

	public void setOutflow(ArrayList<UserAssetsInfo> outflow) {
		this.outflow = outflow;
	}

	public ArrayList<UserAssetsInfo> getManual() {
		return manual;
	}

	public void setManual(ArrayList<UserAssetsInfo> manual) {
		this.manual = manual;
	}
}
