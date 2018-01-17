// Collapsible Right Menu component

import React from 'react';
import cssModules from 'react-css-modules';
import style from './sortable-menu.styl';
import { findDOMNode } from 'react-dom';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';
import { dndItemTypes } from '../../common/vars';
import { connect as reduxConnect } from 'react-redux';
import { changeObject } from '../Object/ObjectActions';

const itemSource = {
  beginDrag(props) {
    return {
      id: props.name,
      index: props.index,
      groupName: props.groupName,
      type: props.type,
      canvasPositions: document.querySelector('#main-canvas').getBoundingClientRect(),
    };
  },
};

const itemTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const dragGroupName = monitor.getItem().groupName;
    const hoverIndex = props.index;
    const hoverGroupName = props.groupName;
    if (dragIndex === hoverIndex) {
      return;
    }
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
    const clientOffset = monitor.getClientOffset();
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;
    if (dragGroupName !== hoverGroupName) {
      return;
    }
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }
    props.moveMenuItem(dragIndex, hoverIndex);
    /* eslint-disable */
    monitor.getItem().index = hoverIndex;
    /* eslint-enable */
  },
};

const collectDrop = (connect) => ({ connectDropTarget: connect.dropTarget() });
const collectSource = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
});

class SortableMenuItem extends React.Component {
  render() {
    const {
      connectDragSource,
      connectDropTarget,
      isDragging,
      name,
      type,
      dispatchChangeObject,
      objAttrs,
    } = this.props;
    const currentBox = () => objAttrs.find(b => b.id === name);
    const eyeIconClass = () => (
      currentBox() && currentBox().visible ? 'fa fa-eye' : 'fa fa-eye-slash'
    );
    const handleBoxVisibility = () => {
      dispatchChangeObject({ id: name, visible: !currentBox().visible });
    };
    return connectDragSource(connectDropTarget(
      <div styleName="left-menu-item" style={{ opacity: isDragging ? 0 : 1 }}>
        {type === 'layers' ?
          <i className={eyeIconClass()} onClick={handleBoxVisibility}></i> :
          null
        } {name}
      </div>
    ));
  }
}

SortableMenuItem.propTypes = {
  name: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  groupName: React.PropTypes.string.isRequired,
  isDragging: React.PropTypes.bool.isRequired,
  connectDragSource: React.PropTypes.func.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
  dispatchChangeObject: React.PropTypes.func.isRequired,
  objAttrs: React.PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
  objAttrs: state.object,
});
const mapDispatchToProps = (dispatch) => ({
  dispatchChangeObject: objAttrs => dispatch(changeObject(objAttrs)),
});

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  dragSource(dndItemTypes.SORTABLEMENUITEM, itemSource, collectSource)(
    dropTarget(dndItemTypes.SORTABLEMENUITEM, itemTarget, collectDrop)(
      cssModules(SortableMenuItem, style)
    )
  )
);
