/**
 * construct appliedFilter by utilizing appliedConditionals in Filter Component
 */

import * as Criteria from './Menus/criteria';

/**
 * appliedFilters: [
 *  {
 *    columnName
 *    dataType
 *    criteria
 *    sqlFunction
 *    values
 *  }
 * ]
 */
const constructAppliedFilters = (
  columnName,
  appliedConditionalsCriterias,
  columnNamesOfAnAsset
) => {
  // console.info(columnName, appliedConditionalsCriterias, columnNamesOfAnAsset);
  const appliedFilters = [];
  Object.keys(appliedConditionalsCriterias).forEach(key => {
    const object = {
      columnName,
      dataType: columnNamesOfAnAsset[columnName].toUpperCase(),
      criteria: key,
      sqlFunction: 'NULL',
      values: [],
    };

    const filterCriteria = appliedConditionalsCriterias[key];
    const filterCriteriaType = Object.prototype.toString.call(filterCriteria);
    if (filterCriteriaType === '[object Object]') {
      Object.keys(filterCriteria).forEach(filterCriteriaKey => {
        object.sqlFunction = `${filterCriteriaKey}`;
        object.values = filterCriteria[filterCriteriaKey];
      });
    } else {
      filterCriteria &&
        filterCriteria.forEach(criteria => {
          if (typeof criteria === 'object') {
            object.values.push(criteria.targetValue);
          } else if (
            typeof criteria === 'string' || typeof criteria === 'number'
          ) {
            object.values.push(criteria);
          }
        });
    }

    if (
      key === Criteria.IS_NULL ||
      key === Criteria.IS_NOT_NULL ||
      key === Criteria.IS_EMPTY ||
      key === Criteria.IS_NOT_EMPTY ||
      (filterCriteria && filterCriteria.length) ||
      Object.prototype.toString.call(filterCriteria) === '[object Object]'
    ) {
      // //console.info(criteriaKey);
      appliedFilters.push(object);
    }
  });
  // //console.info(appliedFilters);
  return appliedFilters.length ? appliedFilters : null;
};

export default constructAppliedFilters;
