import store from '../../store';
import { changeObjectResizableSizes, callChangeObject } from '../Object/ObjectActions';

export const resizableDispatch = (() => {
  const step = store.getState().canvasGridStep;
  const snapStepX = () => Math.round(store.getState().canvasSizes.width * (1 / step));
  const snapStepY = () => Math.round(store.getState().canvasSizes.height * (1 / step));
  const right = (type, elemId, delta, elemObjWidth) => {
    let rw;
    rw = elemObjWidth + delta.x;
    if (elemObjWidth + delta.x < 0) {
      rw = elemObjWidth;
    }
    if (type === 'box') {
      rw = Math.round(rw / snapStepX()) * snapStepX();
      store.dispatch(callChangeObject({ id: elemId, width: rw }));
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, width: rw - 2 }));
    } else {
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, width: rw, zIndex: 9999 }));
    }
  };
  const left = (type, elemId, delta, elemObjWidth, elemObjLeft) => {
    let rw;
    let rpl;
    rw = elemObjWidth - delta.x;
    rpl = elemObjLeft + delta.x;
    if (elemObjWidth - delta.x < 0) {
      rw = elemObjWidth;
      rpl = elemObjLeft;
    }
    if (type === 'box') {
      rw = Math.round(rw / snapStepX()) * snapStepX();
      rpl = Math.round(rpl / snapStepX()) * snapStepX();
      store.dispatch(callChangeObject({ id: elemId, width: rw, left: rpl }));
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, width: rw - 2, left: rpl }));
    } else {
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        width: rw,
        left: rpl,
        zIndex: 9999,
      }));
    }
  };
  const bottom = (type, elemId, delta, elemObjHeight) => {
    let rh;
    rh = elemObjHeight + delta.y;
    if (elemObjHeight + delta.y < 0) {
      rh = elemObjHeight;
    }
    if (type === 'box') {
      rh = Math.round(rh / snapStepY()) * snapStepY();
      store.dispatch(callChangeObject({ id: elemId, height: rh }));
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, height: rh - 2 }));
    } else {
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, height: rh, zIndex: 9999 }));
    }
  };
  const top = (type, elemId, delta, elemObjHeight, elemObjTop) => {
    let rh;
    let rpt;
    rh = elemObjHeight - delta.y;
    rpt = elemObjTop + delta.y;
    if (elemObjHeight - delta.y < 0) {
      rh = elemObjHeight;
      rpt = elemObjTop;
    }
    if (type === 'box') {
      rh = Math.round(rh / snapStepY()) * snapStepY();
      rpt = Math.round(rpt / snapStepY()) * snapStepY();
      store.dispatch(callChangeObject({ id: elemId, top: rpt, height: rh }));
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, top: rpt, height: rh - 2 }));
    } else {
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        top: rpt,
        height: rh,
        zIndex: 9999,
      }));
    }
  };
  const topRight = (type, elemId, delta, elemObjHeight, elemObjWidth, elemObjTop) => {
    let rh;
    let rw;
    let rpt;
    rh = elemObjHeight - delta.y;
    rw = elemObjWidth + delta.x;
    rpt = elemObjTop + delta.y;
    if (elemObjHeight - delta.y < 0) {
      rh = elemObjHeight;
      rpt = elemObjTop;
    }
    if (elemObjWidth + delta.x < 0) {
      rw = elemObjWidth;
    }
    if (type === 'box') {
      rh = Math.round(rh / snapStepY()) * snapStepY();
      rw = Math.round(rw / snapStepX()) * snapStepX();
      rpt = Math.round(rpt / snapStepY()) * snapStepY();
      store.dispatch(callChangeObject({ id: elemId, top: rpt, width: rw, height: rh }));
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        top: rpt,
        width: rw - 2,
        height: rh - 2,
      }));
    } else {
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        top: rpt,
        width: rw,
        height: rh,
        zIndex: 9999,
      }));
    }
  };
  const topLeft = (type, elemId, delta, elemObjHeight, elemObjWidth, elemObjTop, elemObjLeft) => {
    let rh;
    let rw;
    let rpt;
    let rpl;
    rh = elemObjHeight - delta.y;
    rpt = elemObjTop + delta.y;
    rw = elemObjWidth - delta.x;
    rpl = elemObjLeft + delta.x;
    if (elemObjHeight - delta.y < 0) {
      rh = elemObjHeight;
      rpt = elemObjTop;
    }
    if (elemObjWidth - delta.x < 0) {
      rw = elemObjWidth;
      rpl = elemObjLeft;
    }
    if (type === 'box') {
      rh = Math.round(rh / snapStepY()) * snapStepY();
      rpt = Math.round(rpt / snapStepY()) * snapStepY();
      rw = Math.round(rw / snapStepX()) * snapStepX();
      rpl = Math.round(rpl / snapStepX()) * snapStepX();
      store.dispatch(callChangeObject({ id: elemId, top: rpt, left: rpl, width: rw, height: rh }));
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        top: rpt,
        left: rpl,
        width: rw - 2,
        height: rh - 2,
      }));
    } else {
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        top: rpt,
        left: rpl,
        width: rw,
        height: rh,
        zIndex: 9999,
      }));
    }
  };
  const bottomLeft = (type, elemId, delta, elemObjHeight, elemObjWidth, elemObjLeft) => {
    let rh;
    let rw;
    let rpl;
    rh = elemObjHeight + delta.y;
    rw = elemObjWidth - delta.x;
    rpl = elemObjLeft + delta.x;
    if (elemObjHeight + delta.y < 0) {
      rh = elemObjHeight;
    }
    if (elemObjWidth - delta.x < 0) {
      rw = elemObjWidth;
      rpl = elemObjLeft;
    }
    if (type === 'box') {
      rh = Math.round(rh / snapStepY()) * snapStepY();
      rw = Math.round(rw / snapStepX()) * snapStepX();
      rpl = Math.round(rpl / snapStepX()) * snapStepX();
      store.dispatch(callChangeObject({ id: elemId, left: rpl, width: rw, height: rh }));
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        left: rpl,
        width: rw - 2,
        height: rh - 2,
      }));
    } else {
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        left: rpl,
        width: rw,
        height: rh,
        zIndex: 9999,
      }));
    }
  };
  const bottomRight = (type, elemId, delta, elemObjHeight, elemObjWidth) => {
    let rh;
    let rw;
    rh = elemObjHeight + delta.y;
    rw = elemObjWidth + delta.x;
    if (elemObjHeight + delta.y < 0) {
      rh = elemObjHeight;
    }
    if (elemObjWidth + delta.x < 0) {
      rw = elemObjWidth;
    }
    if (type === 'box') {
      rh = Math.round(rh / snapStepY()) * snapStepY();
      rw = Math.round(rw / snapStepX()) * snapStepX();
      store.dispatch(callChangeObject({ id: elemId, width: rw, height: rh }));
      store.dispatch(changeObjectResizableSizes({ boxId: elemId, width: rw - 2, height: rh - 2 }));
    } else {
      store.dispatch(changeObjectResizableSizes({
        boxId: elemId,
        width: rw,
        height: rh,
        zIndex: 9999,
      }));
    }
  };
  return {
    right,
    left,
    bottom,
    top,
    topRight,
    topLeft,
    bottomLeft,
    bottomRight,
  };
})();
