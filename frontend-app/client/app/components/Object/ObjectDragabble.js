// Here is the main component - dragable box
// in the future versions there will be some abstractions
// because of many such block objects
//
// process of connecting state and reducers to the props
// and DnD API's methods is the same as in the case of Canvas component

import React from 'react';
import { bindActionCreators } from 'redux';
import { dndItemTypes } from '../../common/vars';
import { DragSource as dragSource } from 'react-dnd';
import { connect as reduxConnect } from 'react-redux';
import cssModules from 'react-css-modules';
import {
  changeObject,
  expandBlock,
  compressBlock,
  blockDevModeOn,
  blockDevModeOff,
} from '../Object/ObjectActions';
import { addTimerEvent } from '../Timeline/TimelineActions';
import style from './object.styl';
import '../../styles/animate.css';
import '../../styles/codemirror.css';
import AnimationOptions from '../../common/AnimationOptions';
import ResizableElement from '../ResizableElement/ResizableElement';
import { getEmptyImage } from 'react-dnd-html5-backend';
import moment from 'moment';
import shortid from 'shortid';
import BlockDropzone from './ObjectDropzone';
import Codemirror from 'react-codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/selection/active-line';

const ItemSource = {
  beginDrag(props) {
    const { attrs } = props;
    return attrs;
  },
};

const collect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
});

const ObjectDragabble = (props) => {
  const {
    objAttrs,
    connectDragSource,
    attrs,
    id,
    connectDragPreview,
    isDragging,
    timer,
    blockDropzones,
    zIndex,
    expanded,
    expandedBlock,
    devModeBlock,
    fullScreen,
  } = props;
  const handleAnimChange = (e) => {
    const newobjAttrs = objAttrs.slice();
    const itemIndex = newobjAttrs.findIndex(item => item.id === id);
    newobjAttrs[itemIndex].anim = `animated ${e.target.value}`;
    props.changeObject(newobjAttrs);
    if (timer.start) {
      props.addTimerEvent({
        id: shortid.generate(),
        boxId: id,
        animation: e.target.value,
        moment: Math.round(moment(moment(new Date().getTime())).diff(timer.start) / 1000) * 1000,
      });
    }
  };
  const isBlockExpanded = (blockId) => expandedBlock === blockId;
  const isBlockInDevMode = (blockId) => devModeBlock === blockId;
  const handleExpandBlock = (blockId) => {
    if (!isBlockExpanded(blockId)) {
      props.expandBlock(blockId);
    } else {
      props.blockDevModeOff();
      props.compressBlock();
    }
  };
  const handleSwitchDeveloper = (blockId) => {
    if (!isBlockInDevMode(blockId)) {
      props.blockDevModeOn(blockId);
    } else {
      props.blockDevModeOff();
    }
  };
  const codeMirrorOptions = {
    lineNumbers: true,
    styleActiveLine: true,
    theme: 'monokai',
    mode: 'javascript',
  };
  const draggableBoxStyleNames = (blockId) => {
    let styleNames = 'draggable-object';
    if (isBlockExpanded(blockId)) {
      styleNames = `${styleNames} full-size`;
    }
    return styleNames;
  };
  connectDragPreview(getEmptyImage());
  if (isDragging && !fullScreen) {
    return null;
  }

  return connectDragSource(
    <div
      styleName={draggableBoxStyleNames(attrs.id)}
      className={attrs.anim}
      style={{
        top: expanded ? '0' : attrs.top,
        left: expanded ? '0' : attrs.left,
        width: expanded ? '100%' : attrs.width,
        height: expanded ? '100%' : attrs.height,
        zIndex: expanded ? 99999 : zIndex,
      }}
    >
      <ResizableElement
        parentId={attrs.id}
        borderWidth={attrs.width}
        borderHeight={attrs.height}
        boxId={attrs.id}
        expanded={expanded}
      >
        <div>
          <div styleName="object-name">
            Box ID: {attrs.id}
          </div>
          {!isBlockInDevMode(attrs.id) ?
            <div styleName={isBlockExpanded(attrs.id) ? 'object-content-wrapper' : ''}>
              <AnimationOptions handleAnimChange={handleAnimChange} />
              {isBlockExpanded(attrs.id) ?
                <button
                  type="button"
                  onClick={() => handleSwitchDeveloper(attrs.id)}
                  styleName="object-dev-button"
                >
                  Developer Mode
                </button> : null
              }
              <div styleName={!isBlockExpanded(attrs.id) ? 'object-dropzones-container' : ''}>
                <div styleName="object-dropzones-label">Dropzones:</div>
                {blockDropzones.map((d) => {
                  if (d.boxId === attrs.id) {
                    return <BlockDropzone key={d.id} id={d.id} />;
                  }
                  return null;
                })}
              </div>
            </div> :
            <div styleName="object-content-wrapper">
              {isBlockExpanded(attrs.id) ?
                <button
                  type="button"
                  onClick={() => handleSwitchDeveloper(attrs.id)}
                  styleName="object-dev-button"
                >
                  Developer Mode
                </button> : null
              }
              <Codemirror options={codeMirrorOptions} />
            </div>
          }
          {isBlockExpanded(attrs.id) ? <div styleName="object-content-wrapper" /> : null}
        </div>
      </ResizableElement>
      <div styleName="object-expand">
        <i
          className={isBlockExpanded(attrs.id) ? 'fa fa-compress' : 'fa fa-expand'}
          onClick={() => handleExpandBlock(attrs.id)}
        ></i>
      </div>
    </div>
  );
};

ObjectDragabble.propTypes = {
  objAttrs: React.PropTypes.array.isRequired,
  blockDropzones: React.PropTypes.array.isRequired,
  connectDragSource: React.PropTypes.func.isRequired,
  connectDragPreview: React.PropTypes.func.isRequired,
  attrs: React.PropTypes.object.isRequired,
  id: React.PropTypes.string.isRequired,
  isDragging: React.PropTypes.bool.isRequired,
  timer: React.PropTypes.object.isRequired,
  zIndex: React.PropTypes.number.isRequired,
  expanded: React.PropTypes.bool.isRequired,
  expandBlock: React.PropTypes.func.isRequired,
  expandedBlock: React.PropTypes.string.isRequired,
  devModeBlock: React.PropTypes.string.isRequired,
  fullScreen: React.PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  objAttrs: state.object,
  timer: state.timer,
  blockDropzones: state.blockDropzones,
  expandedBlock: state.expandedBlock,
  devModeBlock: state.devModeBlock,
  fullScreen: state.fullScreen,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  changeObject,
  addTimerEvent,
  expandBlock,
  compressBlock,
  blockDevModeOn,
  blockDevModeOff,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  dragSource(dndItemTypes.DRAGABLEBOX, ItemSource, collect)(
    cssModules(ObjectDragabble, style, { allowMultiple: true })
    )
);
