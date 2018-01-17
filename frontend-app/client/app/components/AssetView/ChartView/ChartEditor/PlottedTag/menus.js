/**
 * construct PlottedTag Dropdown menus dataSource
 */
import aggregations from '../aggregations';
import dataTypes from '../dataTypes';

/**
 * REMOVE is by default included to all
 */
const menuConstructionActionTypes = {
  INCLUDE: 'INCLUDE',
  EXCLUDE: 'EXCLUDE',
};

/**
 * menuConstructionRules for metrics
 * for Dimension it is RAW by default
 */
const menuConstructionRules = {
  [dataTypes.string]: {
    type: menuConstructionActionTypes.INCLUDE,
    value: [aggregations.COUNT.label],
  },
  [dataTypes.integer]: {
    type: menuConstructionActionTypes.EXCLUDE,
    value: [aggregations.RAW.label],
  },
  [dataTypes.decimal]: {
    type: menuConstructionActionTypes.EXCLUDE,
    value: [aggregations.RAW.label],
  },
  [dataTypes.date]: {
    type: menuConstructionActionTypes.INCLUDE,
    value: [aggregations.COUNT.label],
  },
  [dataTypes.timestamp]: {
    type: menuConstructionActionTypes.INCLUDE,
    value: [aggregations.COUNT.label],
  },
};

export const getMenus = (dataType, configType) => {
  const aggregationsCopy = { ...aggregations };
  const constructedMenus = Object.keys(aggregationsCopy).map(key => ({
    ...aggregationsCopy[key],
    text: aggregationsCopy[key].label,
    active: false,
  }));
  const menus = constructedMenus.slice(0);
  const removeMenu = {
    text: 'REMOVE',
    label: 'REMOVE',
    value: 'REMOVE',
    active: false,
    delete: true,
  };
  /**
   * if it's a Grouper/Dimension then only RAW is required
   */
  if (configType && configType.match(/.*group.*/)) {
    return [
      {
        ...aggregations.RAW,
        text: aggregations.RAW.label,
        active: true,
      },
      removeMenu,
    ];
  }
  const menuConstructionActionType = menuConstructionRules[dataType].type;
  const menuConstructionRuleValue = menuConstructionRules[dataType].value;

  if (menuConstructionActionType === menuConstructionActionTypes.INCLUDE) {
    const filteredMenus = menus.filter(
      menu => menuConstructionRuleValue.findIndex(ruleValue => ruleValue === menu.label) !== -1
    );
    filteredMenus.push(removeMenu);
    return filteredMenus;
  }
  const filteredMenus = menus.filter(
    menu => menuConstructionRuleValue.findIndex(ruleValue => ruleValue === menu.label) === -1
  );
  filteredMenus.push(removeMenu);
  return filteredMenus;
};
