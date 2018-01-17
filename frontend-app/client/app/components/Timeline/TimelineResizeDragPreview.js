import React from 'react';
import cssModules from 'react-css-modules';
import style from './timeline.styl';

const TimelineResizeDragPreview = (props) => (
  <div styleName="dnd-handler" style={props.style}></div>
);

TimelineResizeDragPreview.propTypes = {
  style: React.PropTypes.object.isRequired,
};

export default cssModules(TimelineResizeDragPreview, style);
