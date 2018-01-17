export const updateObjectItem = (state, newObj) => {
  const newState = state.slice();
  const editedItemIndex = newState.findIndex(item => item.id === newObj.id);
  newState[editedItemIndex] = Object.assign({}, newState[editedItemIndex], newObj);
  return newState;
};

export const addObjToArray = (state, obj) => {
  const newState = state.slice();
  newState.push(obj);
  return newState;
};

export const upsertObjectItem = (state, newObj) => {
  const newState = state.slice();
  const editedItemIndex = newState.findIndex(item => item.boxId === newObj.boxId);
  if (editedItemIndex > -1) {
    newState[editedItemIndex] = Object.assign({}, newState[editedItemIndex], newObj);
  } else {
    newState.push(newObj);
  }
  return newState;
};

export const change = (state, newObj) => {
  const newState = state.slice();
  const esitedItemIndex = newState.findIndex(item => item.id === newObj.id);
  newState[esitedItemIndex] = Object.assign({}, newState[esitedItemIndex], newObj);
  return newState;
};

export const changeEvent = (state, action) => {
  const newState = Object.assign({}, state);
  const events = newState && newState.events;
  if (events && events.length) {
    const itemToEdit = events.find(item => item.id === action.id);
    const itemIndex = events.indexOf(itemToEdit);
    itemToEdit.moment = action.time;
    events[itemIndex] = itemToEdit;
    return newState;
  }
  return state;
};

export const toggleMenuItems = (state, groupName) => {
  const newState = state.slice();
  const index = newState.findIndex(g => g.name === groupName);
  const currentVisibility = newState[index].visible;
  newState[index].visible = !currentVisibility;
  return newState;
};

export const reorderMenuItems = (state, groupName, itemsCollection, type) => {
  const newState = state.slice();
  const index = newState.findIndex(g => g.name === groupName);
  newState[index][type] = itemsCollection;
  return newState;
};

export const addBlockDropzoneItem = (state, action) => {
  const newState = state.slice();
  const itemToEditIndex = newState.findIndex(item => item.id === action.dropzoneId);
  if (itemToEditIndex > -1) {
    newState[itemToEditIndex].items.push(action.item);
  }
  return newState;
};

export const addMenuLayerItem = (state, slideName, layerObj) => {
  const newState = state.slice();
  const currentSlideIndex = newState.findIndex((l) => l.name === slideName);
  if (currentSlideIndex > -1) {
    newState[currentSlideIndex].layers.push(layerObj);
    return newState;
  }
  return state;
};

export const setActiveSlide = (state, action) => {
  const newState = state.slice();
  const activeSlideIndex = newState.findIndex((l) => l.active === true);
  const currentSlideIndex = newState.findIndex((l) => l._id === action.slideId);
  if (currentSlideIndex > -1) {
    newState[activeSlideIndex].active = false;
    newState[currentSlideIndex].active = true;
    return newState;
  }
  return state;
};
