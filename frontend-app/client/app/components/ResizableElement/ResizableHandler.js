// Resizable element wrapper helper

import React from 'react';
import cssModules from 'react-css-modules';
import { DragSource as dragSource } from 'react-dnd';
import { dndItemTypes } from '../../common/vars';
import style from './resizable-element.styl';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { connect as reduxConnect } from 'react-redux';

const ItemSource = {
  beginDrag(props) {
    const resizableHandler = true;
    return Object.assign({}, { resizableHandler }, props);
  },
};

const collect = (connect) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
});

const ResizableHandler = (props) => {
  const { type, connectDragSource, connectDragPreview, fullScreen } = props;
  const t = `resizable-${type}`;
  if (fullScreen) {
    return null;
  }
  connectDragPreview(getEmptyImage());
  return connectDragSource(
    <div styleName={t}></div>
  );
};

ResizableHandler.propTypes = {
  type: React.PropTypes.string.isRequired,
  connectDragSource: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  fullScreen: state.fullScreen,
});

export default reduxConnect(mapStateToProps)(
  dragSource(dndItemTypes.DRAGABLEBOX, ItemSource, collect)(
    cssModules(ResizableHandler, style)
  )
);
