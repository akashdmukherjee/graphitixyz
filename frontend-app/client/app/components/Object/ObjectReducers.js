import {
  CHANGE_OBJECT,
  ADD_OBJECT,
  CHANGE_BOX_RESIZABLE_SIZES,
  CLEAR_STATE,
  ADD_BLOCK_DROPZONE,
  ADD_BLOCK_DROPZONE_ITEM,
  EXPAND_BLOCK,
  COMPRESS_BLOCK,
  DEV_MODE_BLOCK_ON,
  DEV_MODE_BLOCK_OFF,
} from './ObjectActions';
import {
  addObjToArray,
  updateObjectItem,
  upsertObjectItem,
  addBlockDropzoneItem,
} from '../../common/reduxHelpers';

export const object = (state = [], action) => {
  switch (action.type) {
    case ADD_OBJECT:
      return addObjToArray(state, action.obj);
    case CHANGE_OBJECT:
      return updateObjectItem(state, action.objAttrs);
    case CLEAR_STATE:
      return [];
    default:
      return state;
  }
};

export const objectResizableSizes = (state = [], action) => {
  switch (action.type) {
    case CHANGE_BOX_RESIZABLE_SIZES:
      return upsertObjectItem(state, action.sizes);
    default:
      return state;
  }
};

// TODO needs unification for many different objects
export function blockDropzones(state = [], action) {
  switch (action.type) {
    case ADD_BLOCK_DROPZONE:
      return addObjToArray(state, action.dropzoneObj);
    case ADD_BLOCK_DROPZONE_ITEM:
      return addBlockDropzoneItem(state, action);
    case CLEAR_STATE:
      return [];
    default:
      return state;
  }
}

export function expandedBlock(state = '', action) {
  switch (action.type) {
    case EXPAND_BLOCK:
      return action.blockId;
    case COMPRESS_BLOCK:
      return '';
    default:
      return state;
  }
}

export function devModeBlock(state = '', action) {
  switch (action.type) {
    case DEV_MODE_BLOCK_ON:
      return action.blockId;
    case DEV_MODE_BLOCK_OFF:
      return '';
    default:
      return state;
  }
}
