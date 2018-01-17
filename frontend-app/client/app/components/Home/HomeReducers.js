import {
  collapsibleLeftMenuWidth,
  collapsibleRightMenuWidth,
  currentStaticLeftMenuWidth,
} from '../../common/vars';
import {
  SET_MAIN_SIZES,
  SET_CANVAS_SIZES,
  COLLAPSE_MENUS,
  TOGGLE_VIEW_RATIO,
  TOGGLE_FULL_SCREEN,
} from './HomeActions';

// 100% width - [sticky menu left] - [left collapsible menu] - [right collapsible menu]
// 100% height - [top] - [bottom]
export function mainSizes(
  state = {
    width: window.innerWidth -
      currentStaticLeftMenuWidth -
      collapsibleLeftMenuWidth -
      collapsibleRightMenuWidth,
    height: window.innerHeight - 80 - 100,
  },
  action
) {
  switch (action.type) {
    case SET_MAIN_SIZES:
      return action.sizes;
    default:
      return state;
  }
}

export function canvasSizes(
  state = {
    width: '100%',
    height: '100%',
  },
  action
) {
  switch (action.type) {
    case SET_CANVAS_SIZES:
      return action.sizes;
    default:
      return state;
  }
}

export function viewRatio(state = '16/9', action) {
  switch (action.type) {
    case TOGGLE_VIEW_RATIO:
      return action.viewRatio;
    default:
      return state;
  }
}

export function fullScreen(state = false, action) {
  switch (action.type) {
    case TOGGLE_FULL_SCREEN:
      return action.fullScreen;
    default:
      return state;
  }
}

export function collapsibleMenus(state = { left: true, right: false }, action) {
  switch (action.type) {
    case COLLAPSE_MENUS:
      return Object.assign({}, state, action.menus);
    default:
      return state;
  }
}
