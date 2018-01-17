import { asteroid } from '../../common/asteroid';

export const CHANGE_OBJECT = 'CHANGE_OBJECT';
export const ADD_OBJECT = 'ADD_OBJECT';
export const CHANGE_OBJECT_RESIZABLE_SIZES = 'CHANGE_OBJECT_RESIZABLE_SIZES';
export const ADD_BLOCK_DROPZONE_ITEM = 'ADD_BLOCK_DROPZONE_ITEM';
export const ADD_BLOCK_DROPZONE = 'ADD_BLOCK_DROPZONE';
export const EXPAND_BLOCK = 'EXPAND_BLOCK';
export const COMPRESS_BLOCK = 'COMPRESS_BLOCK';
export const DEV_MODE_BLOCK_ON = 'DEV_MODE_BLOCK_ON';
export const DEV_MODE_BLOCK_OFF = 'DEV_MODE_BLOCK_OFF';
export const CLEAR_STATE = 'CLEAR_STATE';

// actions creators
export const changeObject = (objAttrs) => ({
  type: CHANGE_OBJECT,
  objAttrs,
});

export const addObject = (obj) => ({
  type: ADD_OBJECT,
  obj,
});

export const changeObjectResizableSizes = (sizes) => ({
  type: CHANGE_OBJECT_RESIZABLE_SIZES,
  sizes,
});

export function clearState() {
  return {
    type: CLEAR_STATE,
  };
}


// TODO actions for blocks - we need to define and implement different elements here

export function addBlockDropzoneItem(dropzoneId, item) {
  return {
    type: ADD_BLOCK_DROPZONE_ITEM,
    dropzoneId,
    item,
  };
}

export function addBlockDropzone(dropzoneObj) {
  return {
    type: ADD_BLOCK_DROPZONE,
    dropzoneObj,
  };
}

export function expandBlock(blockId) {
  return {
    type: EXPAND_BLOCK,
    blockId,
  };
}

export function compressBlock() {
  return {
    type: COMPRESS_BLOCK,
  };
}

export function blockDevModeOn(blockId) {
  return {
    type: DEV_MODE_BLOCK_ON,
    blockId,
  };
}

export function blockDevModeOff() {
  return {
    type: DEV_MODE_BLOCK_OFF,
  };
}

// async actions

export const callAddObject = (obj) => (
  () => asteroid.call('blocks.addBlock', obj)
);

export const callChangeObject = (obj) => (
  () => asteroid.call('blocks.editBlock', obj)
);

export const callChangeObjectResizableSizes = (sizesObj) => (
  () => asteroid.call('blocksResizableSizes.change', sizesObj)
);

export const callAddBlockDropzone = (dropzoneObj) => (
  () => asteroid.call('dropzones.addDropzone', dropzoneObj)
);

export const callAddBlockDropzoneItem = (dropzoneId, itemObj) => (
  () => asteroid.call('dropzones.editDropzone', dropzoneId, itemObj)
);
