import React, { Component, PropTypes } from 'react';
import update from 'react/lib/update';
import { DropTarget as dropTarget } from 'react-dnd';
import * as Types from './draggableItemTypes';
import PlottedTag from './PlottedTag/PlottedTag';

const plottedTagsTarget = {
  drop(props, monitor, component) {
    const dragData = monitor.getItem();
    const { list } = component.state;
    const object = {
      removeFromList: false,
    };
    // console.info('drop', props, monitor, component, dragData);
    if (list && list.findIndex(data => data.id === dragData.id) === -1) {
      component.pushPlottedTag(dragData);
      object.removeFromList = true;
    }
    return object;
  },
};

class PlottedTags extends Component {
  static propTypes = {
    connectDropTarget: PropTypes.func,
    list: PropTypes.arrayOf(PropTypes.object),
    onListUpdated: PropTypes.func,
  };

  static defaultProps = {
    list: [],
    onListUpdated: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      list: props.list,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { list } = nextProps;
    if (list !== this.props.list) {
      this.setState({ list });
    }
  }

  pushPlottedTag = data => {
    // console.info('pushPlottedTag', data);
    const list = [...this.state.list, { ...data }];
    this.setState({ list });
    this.props.onListUpdated(list);
  };

  removePlottedTag = data => {
    // console.info('removePlottedTag', data);
    const list = [...this.state.list];
    list.splice(data.index, 1);
    this.setState({ list });
    this.props.onListUpdated(list);
  };

  movePlottedTag = (dragData, hoverData) => {
    this.setState(
      update(this.state, {
        list: {
          $splice: [
            [dragData.index, 1],
            [hoverData.index, 0, this.state.list[dragData.index]],
          ],
        },
      }),
      () => {
        this.props.onListUpdated(this.state.list);
      }
    );
  };

  onDataUpdated = data => {
    const { list } = this.state;
    const listCopy = [...list];
    const dataCopy = { ...data };
    listCopy[dataCopy.index] = dataCopy;
    this.setState({ list: listCopy });
    this.props.onListUpdated(listCopy);
  };

  render() {
    const { connectDropTarget, isOver, canDrop } = this.props;
    const isDragDroppable = isOver && canDrop;
    const { list } = this.state;
    return connectDropTarget(
      <div
        style={{
          height: '150',
          maxHeight: '150',
          border: isDragDroppable
            ? '1px dashed #e8e8e8'
            : '1px dashed transparent',
          overflowY: 'scroll',
        }}
      >
        {list.map((data, index) => (
          <PlottedTag
            key={data.id}
            movePlottedTag={this.movePlottedTag}
            removePlottedTag={this.removePlottedTag}
            text={data.columnName}
            hasDropdown
            dropDownPosition="right"
            rightIcon={false}
            dropdownLabel={data.sqlFunction}
            data={{ ...data, index }}
            onDataUpdated={this.onDataUpdated}
          />
        ))}
      </div>
    );
  }
}

export default dropTarget(
  Types.PLOTTED_TAG,
  plottedTagsTarget,
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  })
)(PlottedTags);
