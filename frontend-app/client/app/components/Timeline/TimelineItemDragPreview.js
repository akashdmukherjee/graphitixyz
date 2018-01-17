// Here we define DnD drag preview for the timeline item element
// in the future versions it will be much more universal

import React from 'react';
import cssModules from 'react-css-modules';
import style from './timeline.styl';

// TODO: code reuse from TimelineItem if needed separated component to use in both places
const TimelineItemDragPreview = (props) => (
  <div styleName="timeline-item" style={Object.assign({}, { margin: 0 }, props.style)}>
    {props.anim}
  </div>
);

TimelineItemDragPreview.propTypes = {
  style: React.PropTypes.object.isRequired,
  anim: React.PropTypes.string,
};

export default cssModules(TimelineItemDragPreview, style);
