// This is a simple timeline item component
// We can drag and drop them
// For now this is a simple box with fixed width

import React from 'react';
import cssModules from 'react-css-modules';
import { DragSource as dragSource } from 'react-dnd';
import style from './timeline.styl';
import { dndItemTypes } from '../../common/vars';
import { getEmptyImage } from 'react-dnd-html5-backend';

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

const TimelineItem = (props) => {
  const { connectDragSource, connectDragPreview, top, isDragging, left, attrs } = props;
  connectDragPreview(getEmptyImage());
  if (isDragging) {
    return null;
  }
  return connectDragSource(
    <div styleName="timeline-item" style={{ left, top }}>
      {attrs.anim}
    </div>
  );
};

export default dragSource(
  dndItemTypes.DRAGABLETIMELINEITEM, ItemSource, collect
)(cssModules(TimelineItem, style));
