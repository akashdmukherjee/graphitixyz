export const CLEAN_TIMELINE = 'CLEAN_TIMELINE';
export const CHANGE_TIMELINE = 'CHANGE_TIMELINE';
export const ADD_TIMELINE_ITEM = 'ADD_TIMELINE_ITEM';
export const RESIZE_TIMELINE_CONTAINER = 'RESIZE_TIMELINE_CONTAINER';
export const CLEAN_TIMER = 'CLEAN_TIMER';
export const START_RECORDING = 'START_RECORDING';
export const STOP_RECORDING = 'STOP_RECORDING';
export const ADD_TIMER_EVENT = 'ADD_TIMER_EVENT';
export const CHANGE_TIMER_EVENT = 'CHANGE_TIMER_EVENT';
export const PLAY = 'PLAY';
export const STOP = 'STOP';

export function changeTimeline(timelineAttrs) {
  return {
    type: CHANGE_TIMELINE,
    timelineAttrs,
  };
}

export function addTimelineItem(id, boxId, startsAt, anim) {
  return {
    type: ADD_TIMELINE_ITEM,
    id,
    boxId,
    startsAt,
    anim,
  };
}

export function cleanTimeline() {
  return {
    type: CLEAN_TIMELINE,
  };
}

export function resizeTimelineContainer(height) {
  return {
    type: RESIZE_TIMELINE_CONTAINER,
    height,
  };
}

export function cleanTimer() {
  return {
    type: CLEAN_TIMER,
  };
}


export function startRecording() {
  return {
    type: START_RECORDING,
  };
}

export function stopRecording() {
  return {
    type: STOP_RECORDING,
  };
}

export function addTimerEvent(event) {
  return {
    type: ADD_TIMER_EVENT,
    event,
  };
}

export function changeTimerEvent(id, time) {
  return {
    type: CHANGE_TIMER_EVENT,
    id,
    time,
  };
}

export function play() {
  return {
    type: PLAY,
  };
}

export function stop() {
  return {
    type: STOP,
  };
}
