// Here we define DnD drag preview for the box block element
// in the future versions it will be much more universal

import React from 'react';
import cssModules from 'react-css-modules';
import style from './object.styl';

// TODO: code reuse from DraggableBox if needed separated component to use in both places
// draging animations list is very heavy
// we can drag te same element
// but we need to activate loading animations list after some action triggered
// on the box, for now 'dummy' select box as a placeholder
const ObjectDragPreview = (props) => (
  <div
    styleName="draggable-object"
    style={props.style}
  >
    <div styleName="object-name">
      Box: {props.id}
    </div>
    <select style={{ width: '100%' }}>
      <option>bounce</option>
    </select>
  </div>
);

ObjectDragPreview.propTypes = {
  style: React.PropTypes.object.isRequired,
  id: React.PropTypes.string,
};


export default cssModules(ObjectDragPreview, style);
