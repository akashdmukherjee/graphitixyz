// File with all Redux Reducers

import {
  object,
  objectResizableSizes,
  blockDropzones,
  expandedBlock,
  devModeBlock,
} from './components/Object/ObjectReducers';
import {
  timeline,
  timelineContainerHeight,
  timer,
  isPlaying,
} from './components/Timeline/TimelineReducers';
import {
  leftMenu,
  staticLeftMenuStretched,
} from './components/StaticLeftMenu/StaticLeftMenuReducers';
import {
  canvasGridStep,
} from './components/GridStepSwitcher/GridStepSwitcherReducers';
import {
  leftMenuBlocks,
  leftMenuPills,
  leftMenuLayers,
} from './components/CollapsibleLeftMenu/CollapsibleLeftMenuReducers';
import {
  mainSizes,
  canvasSizes,
  collapsibleMenus,
  viewRatio,
  fullScreen,
} from './components/Home/HomeReducers';
import { orgUserVerification } from './components/Login/LoginReducers';
import { dataDiscovery } from './components/DataDiscovery/Reducers';
import { dataAssetView } from './components/AssetView/Reducers';

import { combineReducers } from 'redux';

const mainReducer = combineReducers({
  object,
  timeline,
  timer,
  isPlaying,
  mainSizes,
  canvasSizes,
  collapsibleMenus,
  staticLeftMenuStretched,
  leftMenu,
  leftMenuBlocks,
  leftMenuPills,
  leftMenuLayers,
  viewRatio,
  fullScreen,
  objectResizableSizes,
  timelineContainerHeight,
  blockDropzones,
  canvasGridStep,
  expandedBlock,
  devModeBlock,
  orgUserVerification,
  dataDiscovery,
  dataAssetView,
});

export default mainReducer;
