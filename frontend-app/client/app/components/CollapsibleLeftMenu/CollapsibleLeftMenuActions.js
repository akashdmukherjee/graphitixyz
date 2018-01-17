import { asteroid } from '../../common/asteroid';

export const REORDER_MENU_BLOCKS = 'REORDER_MENU_BLOCKS';
export const TOGGLE_MENU_BLOCK_ITEMS = 'TOGGLE_MENU_BLOCK_ITEMS';
export const REORDER_MENU_PILLS = 'REORDER_MENU_PILLS';
export const REORDER_MENU_LAYERS = 'REORDER_MENU_LAYERS';
export const TOGGLE_MENU_PILL_ITEMS = 'TOGGLE_MENU_PILL_ITEMS';
export const TOGGLE_MENU_LAYER_ITEMS = 'TOGGLE_MENU_LAYER_ITEMS';
export const ADD_MENU_LAYER_ITEMS = 'ADD_MENU_LAYER_ITEMS';
export const ADD_SLIDE = 'ADD_SLIDE';
export const SWITCH_SLIDE = 'SWITCH_SLIDE';
export const CLEAR_STATE = 'CLEAR_STATE';


export function reorderMenuBlocks(groupName, blocksCollection) {
  return {
    type: REORDER_MENU_BLOCKS,
    groupName,
    blocksCollection,
  };
}

export function reorderMenuPills(groupName, pillsCollection) {
  return {
    type: REORDER_MENU_PILLS,
    groupName,
    pillsCollection,
  };
}

export function reorderMenuLayers(groupName, layersCollection) {
  return {
    type: REORDER_MENU_LAYERS,
    groupName,
    layersCollection,
  };
}

export function toggleMenuBlocksItems(groupName) {
  return {
    type: TOGGLE_MENU_BLOCK_ITEMS,
    groupName,
  };
}

export function toggleMenuPillsItems(groupName) {
  return {
    type: TOGGLE_MENU_PILL_ITEMS,
    groupName,
  };
}

export function toggleMenuLayersItems(groupName) {
  return {
    type: TOGGLE_MENU_LAYER_ITEMS,
    groupName,
  };
}

export function addMenuLayerItems(slideName, layerObj) {
  return {
    type: ADD_MENU_LAYER_ITEMS,
    slideName,
    layerObj,
  };
}

export function addSlide(slideName, slideId) {
  return {
    type: ADD_SLIDE,
    slideName,
    slideId,
  };
}

export function switchSlide(slideId) {
  return {
    type: SWITCH_SLIDE,
    slideId,
  };
}

export function clearState() {
  return {
    type: CLEAR_STATE,
  };
}

// async

export function callAddSlide(slideObj) {
  return () => asteroid.call('slides.addSlide', slideObj);
}

export function callAddMenuLayerItems(slideName, layerObj) {
  return () => asteroid.call('slides.addMenuLayer', { slideName, layerObj });
}
