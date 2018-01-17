import { addObjToArray, change, changeEvent } from '../../common/reduxHelpers';
import {
  CLEAN_TIMELINE,
  ADD_TIMELINE_ITEM,
  CHANGE_TIMELINE,
  RESIZE_TIMELINE_CONTAINER,
  CLEAN_TIMER,
  START_RECORDING,
  STOP_RECORDING,
  ADD_TIMER_EVENT,
  CHANGE_TIMER_EVENT,
  PLAY,
  STOP,
} from './TimelineActions';

export function timeline(state = [], action) {
  switch (action.type) {
    case CLEAN_TIMELINE:
      return [];
    case ADD_TIMELINE_ITEM:
      return addObjToArray(state, {
        id: action.id,
        boxId: action.boxId,
        startsAt: action.startsAt,
        anim: action.anim,
      });
    case CHANGE_TIMELINE:
      return change(state, action.timelineAttrs);
    default:
      return state;
  }
}

export function timelineContainerHeight(state = 100, action) {
  switch (action.type) {
    case RESIZE_TIMELINE_CONTAINER:
      return action.height;
    default:
      return state;
  }
}

export function timer(state = { start: 0, end: 0, events: [] }, action) {
  switch (action.type) {
    case CLEAN_TIMER:
      return { start: 0, end: 0 };
    case START_RECORDING:
      return Object.assign({}, state, { start: new Date().getTime() });
    case STOP_RECORDING:
      return Object.assign({}, state, { end: new Date().getTime() });
    case ADD_TIMER_EVENT:
      return Object.assign({}, state, {
        events: state.events ? state.events.concat([action.event]) : [action.event],
      });
    case CHANGE_TIMER_EVENT:
      return changeEvent(state, action);
    default:
      return state;
  }
}

export function isPlaying(state = false, action) {
  switch (action.type) {
    case PLAY:
      return true;
    case STOP:
      return false;
    default:
      return state;
  }
}
