// Main canvas component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import DraggableBox from '../Object/ObjectDragabble';
import style from './canvas.styl';
import { DropTarget as dropTarget } from 'react-dnd';
import { dndItemTypes } from '../../common/vars';
import { connect as reduxConnect } from 'react-redux';
import {
  changeObject,
  changeObjectResizableSizes,
  callAddObject,
  callChangeObject,
  callAddBlockDropzone,
} from '../Object/ObjectActions';
import { toggleFullScreen } from '../Home/HomeActions';
import { callAddMenuLayerItems } from '../CollapsibleLeftMenu/CollapsibleLeftMenuActions';
import { resizableDispatch } from '../ResizableElement/ResizableElementDispatchHelper';
import randomString from 'random-string';
import CanvasMenu from './CanvasMenu';

// We need to define drop function
// We can get all the props from the components here
// and also we can monitor behavior
// the drop method is from the DnD API
const ItemTarget = {
  drop(props, monitor) {
    const item = monitor.getItem();
    const delta = monitor.getDifferenceFromInitialOffset();
    const snapStepX = Math.round(props.canvasSizes.width * (1 / props.canvasGridStep));
    const snapStepY = Math.round(props.canvasSizes.height * (1 / props.canvasGridStep));

    if (item.type === 'pills' || item.type === 'layers' || props.fullScreen) {
      return;
    }

    if (item.type === 'blocks') {
      const boxId = randomString();
      const activeSlide = props.leftMenuLayers.find(s => s.active === true);
      const mouseOffset = monitor.getClientOffset();
      if (activeSlide) {
        props.callAddObject({
          id: boxId,
          top: Math.round((mouseOffset.y - item.canvasPositions.top) / snapStepY) * snapStepY,
          left: Math.round((mouseOffset.x - item.canvasPositions.left) / snapStepX) * snapStepX,
          anim: '',
          width: Math.round(200 / snapStepX) * snapStepX,
          height: Math.round(200 / snapStepY) * snapStepY,
          visible: true,
          zIndex: 10,
          slideId: activeSlide._id,
        });
        // TODO only for now... we need 2 demo dropzones for every block/box
        [1, 2].forEach(() => {
          props.callAddBlockDropzone({
            id: randomString(),
            boxId,
            items: [],
          });
        });
        props.callAddMenuLayerItems(activeSlide.name, { name: boxId });
      }
      return;
    }

    const left = Math.round(item.left + delta.x);
    const top = Math.round(item.top + delta.y);
    const snappedLeft = Math.round(left / snapStepX) * snapStepX;
    const snappedTop = Math.round(top / snapStepY) * snapStepY;

    // resizable only logic
    if (item.resizableHandler) {
      const resizedBoxId = item.parentId;
      const resizedBoxObj = props.objAttrs.find(b => b.id === resizedBoxId);
      const resizedBoxObjWidth = resizedBoxObj && resizedBoxObj.width;
      const resizedBoxObjHeight = resizedBoxObj && resizedBoxObj.height;
      const resizedBoxObjLeft = resizedBoxObj && resizedBoxObj.left;
      const resizedBoxObjTop = resizedBoxObj && resizedBoxObj.top;

      if (item.type === 'right') {
        resizableDispatch.right(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjWidth,
          true
        );
      }
      if (item.type === 'left') {
        resizableDispatch.left(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjWidth,
          resizedBoxObjLeft,
          true
        );
      }
      if (item.type === 'bottom') {
        resizableDispatch.bottom(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjHeight,
          true
        );
      }
      if (item.type === 'top') {
        resizableDispatch.top(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjHeight,
          resizedBoxObjTop,
          true
        );
      }
      if (item.type === 'top-right') {
        resizableDispatch.topRight(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjHeight,
          resizedBoxObjWidth,
          resizedBoxObjTop,
          true
        );
      }
      if (item.type === 'top-left') {
        resizableDispatch.topLeft(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjHeight,
          resizedBoxObjWidth,
          resizedBoxObjTop,
          resizedBoxObjLeft,
          true
        );
      }
      if (item.type === 'bottom-left') {
        resizableDispatch.bottomLeft(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjHeight,
          resizedBoxObjWidth,
          resizedBoxObjLeft,
          true
        );
      }
      if (item.type === 'bottom-right') {
        resizableDispatch.bottomRight(
          'box',
          resizedBoxId,
          delta,
          resizedBoxObjHeight,
          resizedBoxObjWidth,
          true
        );
      }
      props.changeObjectResizableSizes({
        boxId: resizedBoxId,
        top: 0,
        left: 0,
        zIndex: 0,
      });
      return;
    }
    // TODO optimistic ui API
    props.changeObject({ id: item.id, top: snappedTop, left: snappedLeft, anim: '' });
    props.callChangeObject({ id: item.id, top: snappedTop, left: snappedLeft, anim: '' });
  },
  hover(props, monitor) {
    const item = monitor.getItem();
    if (item.resizableHandler) {
      const delta = monitor.getDifferenceFromInitialOffset();
      const resizedBoxId = item.parentId;
      const resizedBorderObj = props.objectResizableSizes.find(b => b.id === resizedBoxId);
      const resizedBoxObj = props.objAttrs.find(b => b.id === resizedBoxId);
      const resizedBorderObjWidth =
        resizedBorderObj && resizedBorderObj.width - 2 ||
        resizedBoxObj && resizedBoxObj.width - 2;
      const resizedBorderObjHeight =
        resizedBorderObj && resizedBorderObj.height - 2 ||
        resizedBoxObj && resizedBoxObj.height - 2;
      const resizedBorderObjLeft = resizedBorderObj && resizedBorderObj.left || 0;
      const resizedBorderObjTop = resizedBorderObj && resizedBorderObj.top || 0;

      if (item.type === 'right') {
        resizableDispatch.right(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjWidth
        );
        return;
      }
      if (item.type === 'left') {
        resizableDispatch.left(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjWidth,
          resizedBorderObjLeft
        );
        return;
      }
      if (item.type === 'bottom') {
        resizableDispatch.bottom(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjHeight
        );
        return;
      }
      if (item.type === 'top') {
        resizableDispatch.top(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjHeight,
          resizedBorderObjTop
        );
        return;
      }
      if (item.type === 'top-right') {
        resizableDispatch.topRight(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjHeight,
          resizedBorderObjWidth,
          resizedBorderObjTop
        );
        return;
      }
      if (item.type === 'top-left') {
        resizableDispatch.topLeft(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjHeight,
          resizedBorderObjWidth,
          resizedBorderObjTop,
          resizedBorderObjLeft
        );
        return;
      }
      if (item.type === 'bottom-left') {
        resizableDispatch.bottomLeft(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjHeight,
          resizedBorderObjWidth,
          resizedBorderObjLeft
        );
        return;
      }
      if (item.type === 'bottom-right') {
        resizableDispatch.bottomRight(
          'boxBorder',
          resizedBoxId,
          delta,
          resizedBorderObjHeight,
          resizedBorderObjWidth
        );
        return;
      }
    }
  },
};

const collect = (connect) => ({ connectDropTarget: connect.dropTarget() });

// We import DraggableBox
// we get the boxes from the objAttrs state
// it could be dynamically and globally changed
// we will be able to add and remove boxes
const Canvas = (props) => {
  const {
    connectDropTarget,
    objAttrs,
    canvasSizes,
    canvasGridStep,
    leftMenuLayers,
    expandedBlock,
    fullScreen,
  } = props;
  const snapStepX = Math.round(canvasSizes.width * (1 / canvasGridStep));
  const snapStepY = Math.round(canvasSizes.height * (1 / canvasGridStep));
  const styles = Object.assign({}, props.style, {
    backgroundSize: `${snapStepX}px ${snapStepY}px`,
    position: expandedBlock ? 'static' : 'relative',
    overflow: expandedBlock ? 'visible' : 'hidden',
  });
  const activeSlide = leftMenuLayers.find(s => s.active === true);
  const isExpanded = (blockId) => expandedBlock === blockId;
  const styleName = fullScreen ? 'main-canvas full-screen' : 'main-canvas';
  return connectDropTarget(
    <main styleName={styleName} id="main-canvas" style={styles}>
      {objAttrs
        .filter(item => item.visible && item.slideId === (activeSlide ? activeSlide._id : null))
        .map(item => (
          <DraggableBox
            attrs={item}
            id={item.id}
            key={item.id}
            zIndex={item.zIndex}
            expanded={isExpanded(item.id)}
          />
        )
      )}
      <CanvasMenu />
    </main>
  );
};

Canvas.propTypes = {
  objAttrs: React.PropTypes.array.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
  style: React.PropTypes.object.isRequired,
  fullScreen: React.PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  objAttrs: state.object,
  objectResizableSizes: state.objectResizableSizes,
  canvasSizes: state.canvasSizes,
  canvasGridStep: state.canvasGridStep,
  leftMenuLayers: state.leftMenuLayers,
  expandedBlock: state.expandedBlock,
  fullScreen: state.fullScreen,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  callChangeObject,
  changeObject,
  callAddObject,
  callAddBlockDropzone,
  changeObjectResizableSizes,
  callAddMenuLayerItems,
  toggleFullScreen,
}, dispatch);

// We connect our store and reducers to the props of the component here
// also we connect DnD types and drop function here (see DnD docs)
export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  dropTarget([dndItemTypes.DRAGABLEBOX, dndItemTypes.SORTABLEMENUITEM], ItemTarget, collect)(
    cssModules(Canvas, style, { allowMultiple: true })
  )
);
