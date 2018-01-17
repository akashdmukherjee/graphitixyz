import { asteroid } from '../../common/asteroid';

export const SET_MAIN_SIZES = 'SET_MAIN_SIZES';
export const SET_CANVAS_SIZES = 'SET_CANVAS_SIZES';
export const COLLAPSE_MENUS = 'COLLAPSE_MENUS';
export const TOGGLE_VIEW_RATIO = 'TOGGLE_VIEW_RATIO';
export const TOGGLE_FULL_SCREEN = 'TOGGLE_FULL_SCREEN';

export function setMainSizes(sizes) {
  return {
    type: SET_MAIN_SIZES,
    sizes,
  };
}

export function setCanvasSizes(sizes) {
  return {
    type: SET_CANVAS_SIZES,
    sizes,
  };
}

export function collapseMenus(menus) {
  return {
    type: COLLAPSE_MENUS,
    menus,
  };
}

export function toggleViewRatio(viewRatio) {
  return {
    type: TOGGLE_VIEW_RATIO,
    viewRatio,
  };
}

export function toggleFullScreen(fullScreen) {
  return {
    type: TOGGLE_FULL_SCREEN,
    fullScreen,
  };
}

// async

export function callDevResetData() {
  return () => asteroid.call('dev.resetData');
}
