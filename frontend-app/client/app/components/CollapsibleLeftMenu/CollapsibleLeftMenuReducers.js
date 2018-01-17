import {
  REORDER_MENU_BLOCKS,
  TOGGLE_MENU_BLOCK_ITEMS,
  REORDER_MENU_PILLS,
  REORDER_MENU_LAYERS,
  TOGGLE_MENU_PILL_ITEMS,
  TOGGLE_MENU_LAYER_ITEMS,
  ADD_MENU_LAYER_ITEMS,
  ADD_SLIDE,
  SWITCH_SLIDE,
  CLEAR_STATE,
 } from './CollapsibleLeftMenuActions';

import * as actionHelpers from '../../common/reduxHelpers';

// TODO for now only static initialization
export function leftMenuPills(state = [
  {
    name: 'db-marketing',
    visible: true,
    pills: [
      { name: 'department_name' },
      { name: 'region' },
      { name: 'revenue' },
      { name: 'profit' },
    ],
  }, {
    name: 'db-products',
    visible: true,
    pills: [
      { name: 'Product ID' },
      { name: 'name' },
      { name: 'cost_price' },
    ],
  },
], action) {
  switch (action.type) {
    case REORDER_MENU_PILLS:
      return actionHelpers.reorderMenuItems(
        state, action.groupName, action.pillsCollection, 'pills'
      );
    case TOGGLE_MENU_PILL_ITEMS:
      return actionHelpers.toggleMenuItems(state, action.groupName);
    default:
      return state;
  }
}

export function leftMenuBlocks(state = [
  {
    name: 'Charts',
    visible: true,
    blocks: [
      { name: 'Intelligent Chart' },
      { name: 'Bars' },
      { name: 'Table' },
      { name: 'Line' },
      { name: 'Pie' },
    ],
  }, {
    name: 'Media',
    visible: true,
    blocks: [
      { name: 'Image' },
      { name: 'Video' },
      { name: 'Text' },
    ],
  },
], action) {
  switch (action.type) {
    case REORDER_MENU_BLOCKS:
      return actionHelpers.reorderMenuItems(
        state, action.groupName, action.blocksCollection, 'blocks'
      );
    case TOGGLE_MENU_BLOCK_ITEMS:
      return actionHelpers.toggleMenuItems(state, action.groupName);
    default:
      return state;
  }
}

export function leftMenuLayers(state = [], action) {
  switch (action.type) {
    case REORDER_MENU_LAYERS:
      return actionHelpers.reorderMenuItems(
        state, action.groupName, action.layersCollection, 'layers'
      );
    case TOGGLE_MENU_LAYER_ITEMS:
      return actionHelpers.toggleMenuItems(state, action.groupName);
    case ADD_MENU_LAYER_ITEMS:
      return actionHelpers.addMenuLayerItem(state, action.slideName, action.layerObj);
    case ADD_SLIDE:
      return actionHelpers.addObjToArray(state, {
        _id: action.slideId,
        name: action.slideName,
        layers: [],
        active: true,
        visible: true,
      });
    case SWITCH_SLIDE:
      return actionHelpers.setActiveSlide(state, action);
    case CLEAR_STATE:
      return [];
    default:
      return state;
  }
}
