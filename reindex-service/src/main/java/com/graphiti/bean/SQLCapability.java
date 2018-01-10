package com.graphiti.bean;

import java.util.List;

public class SQLCapability {
	private List<SelectFunction> selectColumnsAndFunctions ;
	private String filterSetId;
	private String filterSetName;
	private List<String> groupByColumns;
	private Filters filters;
	private List<ColumnOrder> columnOrders;
	private boolean isDistinctApplied;

	
	public List<String> getGroupByColumns() {
		return groupByColumns;
	}


	public void setGroupByColumns(List<String> groupByColumns) {
		this.groupByColumns = groupByColumns;
	}

	public List<SelectFunction> getSelectColumnsAndFunctions() {
		return selectColumnsAndFunctions;
	}

	public void setSelectColumnsAndFunctions(List<SelectFunction> selectColumnsAndFunctions) {
		this.selectColumnsAndFunctions = selectColumnsAndFunctions;
	}

	public String getFilterSetId() {
		return filterSetId;
	}

	public void setFilterSetId(String filterSetId) {
		this.filterSetId = filterSetId;
	}

	public String getFilterSetName() {
		return filterSetName;
	}

	public void setFilterSetName(String filterSetName) {
		this.filterSetName = filterSetName;
	}

	public Filters getFilters() {
		return filters;
	}

	public void setFilters(Filters filters) {
		this.filters = filters;
	}

	public List<ColumnOrder> getColumnOrders() {
		return columnOrders;
	}

	public void setColumnOrders(List<ColumnOrder> columnOrders) {
		this.columnOrders = columnOrders;
	}
	
	public boolean getIsDistinctApplied() {
		return isDistinctApplied;
	}

	public void setIsDistinctApplied(boolean isDistinctApplied) {
		this.isDistinctApplied = isDistinctApplied;
	}
}
