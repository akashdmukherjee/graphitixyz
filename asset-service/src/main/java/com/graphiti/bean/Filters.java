package com.graphiti.bean;

import java.util.List;

public class Filters {
	private List<Filter> appliedFilters;
	private Filter currentFilter;
	
	public List<Filter> getAppliedFilters() {
		return appliedFilters;
	}
	public void setAppliedFilters(List<Filter> appliedFilters) {
		this.appliedFilters = appliedFilters;
	}
	public Filter getCurrentFilter() {
		return currentFilter;
	}
	public void setCurrentFilter(Filter currentFilter) {
		this.currentFilter = currentFilter;
	}
}
