// Bottom area with Timeline component

import React from 'react';
import cssModules from 'react-css-modules';
import style from './timeline.styl';
import { DragSource as dragSource } from 'react-dnd';
import { dndItemTypes } from '../../common/vars';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { connect as reduxConnect } from 'react-redux';

const ItemSource = {
  beginDrag(props) {
    return {
      width: props.mainSizes.width,
      timelineHeight: props.timelineHeight,
    };
  },
};

const collect = (connect) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
});

const TimelineResizeHandler = (props) => {
  const { connectDragSource, connectDragPreview } = props;
  connectDragPreview(getEmptyImage());
  return connectDragSource(
    <div styleName="dnd-handler"></div>
  );
};

TimelineResizeHandler.propTypes = {
  connectDragSource: React.PropTypes.func.isRequired,
  mainSizes: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  mainSizes: state.mainSizes,
});

export default reduxConnect(mapStateToProps)(
  dragSource(dndItemTypes.TIMELINERESIZE, ItemSource, collect)(
    cssModules(TimelineResizeHandler, style)
  )
);
