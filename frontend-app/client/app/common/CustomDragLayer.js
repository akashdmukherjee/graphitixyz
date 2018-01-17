import React from 'react';
import { DragLayer as dragLayer } from 'react-dnd';
import BoxDragPreview from '../components/Object/ObjectDragPreview';
import TimelineItemDragPreview from '../components/Timeline/TimelineItemDragPreview';
import { dndItemTypes } from './vars';
import store from '../store';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function collect(monitor) {
  return {
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getSourceClientOffset(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    isDragging: monitor.isDragging(),
  };
}

function getItemStyles(props, type) {
  const { currentOffset, initialOffset } = props;
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  let x = currentOffset.x;
  let y = currentOffset.y;
  if (type === dndItemTypes.DRAGABLETIMELINEITEM) {
    const step = store.getState().canvasGridStep;
    x = Math.round(currentOffset.x / step) * step;
    y = initialOffset.y;
  }
  const stylesObj = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
  };
  return stylesObj;
}

class CustomDragLayer extends React.Component {
  renderItem(type, item, style) {
    if (store.getState().fullScreen) {
      return null;
    }
    if (type === dndItemTypes.DRAGABLEBOX && !item.resizableHandler) {
      const styles = Object.assign({}, style, { width: item.width, height: item.height });
      return <BoxDragPreview style={styles} id={item.id} />;
    }
    if (type === dndItemTypes.DRAGABLETIMELINEITEM) {
      return <TimelineItemDragPreview style={style} anim={item.anim} />;
    }
    return null;
  }
  render() {
    const { isDragging, item, itemType } = this.props;
    if (!isDragging) {
      return null;
    }
    return (
      <div style={layerStyles}>
        {this.renderItem(itemType, item, getItemStyles(this.props, itemType))}
      </div>
    );
  }
}

CustomDragLayer.propTypes = {
  isDragging: React.PropTypes.bool.isRequired,
  item: React.PropTypes.object,
  itemType: React.PropTypes.string,
};

export default dragLayer(collect)(CustomDragLayer);
