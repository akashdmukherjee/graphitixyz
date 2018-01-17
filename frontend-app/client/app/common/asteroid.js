// Here we use Asteroid (https://github.com/mondora/asteroid)
// DDP client - so we will be able to connect to the Meteor backend
// we need to specify Meteor host and port number
// for now all is commented because we don't want to use it right now...

import { createClass } from 'asteroid';
import store from '../store';
import {
  addMenuLayerItems,
  addSlide,
  clearState,
} from '../components/CollapsibleLeftMenu/CollapsibleLeftMenuActions';
import {
  addObject,
  changeObject,
  changeObjectResizableSizes,
  addBlockDropzone,
  addBlockDropzoneItem,
} from '../components/Object/ObjectActions';

const Asteroid = createClass();
// // Connect to a Meteor backend
export const asteroid = new Asteroid({
  // endpoint: 'ws://storybook-test-server.julian.io/websocket', // prod
  endpoint: 'ws://localhost:9000/websocket', // dev
});

// if you want realitme updates in all connected clients
// subscribe to the publication
asteroid.subscribe('slides');
asteroid.subscribe('blocks');
asteroid.subscribe('dropzones');
asteroid.subscribe('blocksResizableSizes');

// TODO refactor and move operations to separate files

asteroid.ddp.on('added', (doc) => {
  if (doc.collection === 'Slides') {
    store.dispatch(addSlide(doc.fields.name, doc.id));
    doc.fields.layers.forEach((l) => {
      store.dispatch(addMenuLayerItems(doc.fields.name, { name: l.name }));
    });
  }
  if (doc.collection === 'Blocks') {
    store.dispatch(addObject(Object.assign({}, doc.fields, { _id: doc.id })));
  }
  if (doc.collection === 'Dropzones') {
    store.dispatch(addBlockDropzone(Object.assign({}, doc.fields, { _id: doc.id })));
  }
});

asteroid.ddp.on('changed', (updatedDoc) => {
  if (updatedDoc.collection === 'Slides') {
    const changedLayer = store.getState().leftMenuLayers.find(l => l._id === updatedDoc.id);
    const changedLayerName = changedLayer && changedLayer.name;
    const updatedLayersLength = updatedDoc.fields.layers.length;
    const addedLayer = updatedDoc.fields.layers[updatedLayersLength - 1];
    if (addedLayer) {
      store.dispatch(addMenuLayerItems(changedLayerName, addedLayer));
    }
  }
  if (updatedDoc.collection === 'Blocks') {
    const changedBlock = store.getState().object.find(l => l._id === updatedDoc.id);
    const changedBlockId = changedBlock && changedBlock.id;
    store.dispatch(changeObject({
      id: changedBlockId,
      top: updatedDoc.fields.top || changedBlock.top,
      left: updatedDoc.fields.left || changedBlock.left,
      anim: updatedDoc.fields.anim || changedBlock.anim,
      height: updatedDoc.fields.height || changedBlock.height,
      width: updatedDoc.fields.width || changedBlock.width,
    }));
    store.dispatch(changeObjectResizableSizes({
      boxId: changedBlockId,
      top: 0,
      left: 0,
      zIndex: 0,
      height: updatedDoc.fields.height - 2 || changedBlock.height - 2,
      width: updatedDoc.fields.width - 2 || changedBlock.width - 2,
    }));
  }
  if (updatedDoc.collection === 'Dropzones') {
    const changedDropzone = store.getState().blockDropzones.find(l => l._id === updatedDoc.id);
    const changedDropzoneId = changedDropzone && changedDropzone.id;
    const updatedDropzoneItemsLength = updatedDoc.fields.items.length;
    const addedItem = updatedDoc.fields.items[updatedDropzoneItemsLength - 1];
    if (addedItem) {
      store.dispatch(addBlockDropzoneItem(changedDropzoneId, addedItem));
    }
  }
});

asteroid.ddp.on('removed', () => {
  // only for now - clear state for all stores after reset data
  store.dispatch(clearState());
});
