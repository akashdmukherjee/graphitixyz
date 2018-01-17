import React, { Component, PropTypes } from 'react';
import update from 'react/lib/update';
import { DropTarget as dropTarget } from 'react-dnd';
import * as Types from './draggableItemTypes';
import PlottedTag from './PlottedTag/PlottedTag';
import configTypes from './configTypes';
import aggregations from './aggregations';
import dataTypes from './dataTypes';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const plottedTagsTarget = {
  drop(props, monitor, component) {
    const dragData = monitor.getItem();
    const { list } = component.state;
    const object = {
      removeFromList: false,
    };
    // console.info('drop', props, monitor, component, dragData);
    if (list && list.findIndex(data => data && data.columnName === dragData.columnName) === -1) {
      component.pushPlottedTag(dragData);
      object.removeFromList = true;
    }
    return object;
  },
};

class PlottedTags extends Component {
  static propTypes = {
    configType: PropTypes.string.isRequired,
    newKey: PropTypes.string.isRequired,
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
    this.configType = props.configType;
  }

  componentWillReceiveProps(nextProps) {
    const { list, newKey } = nextProps;
    if (list !== this.props.list) {
      this.setState({ list });
    }

    if (newKey !== this.props.newKey) {
      this.setState({ key: newKey, list: [] });
    }
  }

  getDataWithFieldAggregation = data => {
    // console.info('onPlotFieldItemSelect', data, configType);
    // apply some rules on a selected field
    const plottedTagObject = {
      ...data,
      field_name: data.columnName,
      id: data.id ? data.id : generateRandomId(),
      field_aggregation: aggregations.RAW.value,
      scale_num: 0,
      configType: this.configType,
    };
    /**
     * if it's a grouper then only apply RAW aggregation
     */
    if (this.configType.match(/.*group.*/)) return plottedTagObject;

    const dataType = plottedTagObject.dataType.toLowerCase();

    // if startsWith `id` or endsWith `_id` apply COUNT function
    if (plottedTagObject.columnName.match(/(^id|_id)$/)) {
      plottedTagObject.field_aggregation = aggregations.COUNT.value;
    } else if (dataType === dataTypes.integer || dataType === dataTypes.decimal) {
      plottedTagObject.field_aggregation = aggregations.SUM.value;
    } else if (
      dataType === dataTypes.string ||
      dataTypes.date === dataType ||
      dataTypes.timestamp === dataType
    ) {
      if (dataType === dataTypes.string && this.props.configType.match(/.*metrics$/)) {
        plottedTagObject.field_aggregation = aggregations.COUNT.value;
      } else {
        plottedTagObject.field_aggregation = aggregations.RAW.value;
      }
    }
    return plottedTagObject;
  };

  pushPlottedTag = data => {
    console.info('pushPlottedTag', data);
    const list = [...this.state.list, this.getDataWithFieldAggregation(data)];
    this.setState({ list });
    this.props.onListUpdated({ list, configType: this.configType });
  };

  removePlottedTag = data => {
    console.info('removePlottedTag', data);
    const list = [...this.state.list];
    list.splice(data.index - 1, 1);
    this.setState({ list });
    this.props.onListUpdated({ list, configType: this.configType });
  };

  movePlottedTag = (dragData, hoverData) => {
    this.setState(
      update(this.state, {
        list: {
          $splice: [[dragData.index, 1], [hoverData.index, 0, this.state.list[dragData.index]]],
        },
      }),
      () => {
        this.props.onListUpdated({ list: this.state.list, configType: this.configType });
      }
    );
  };

  onDataUpdated = data => {
    const { list } = this.state;
    const listCopy = [...list];
    const dataCopy = { ...data };
    listCopy[dataCopy.index] = dataCopy;
    this.setState({ list: listCopy });
    this.props.onListUpdated({ list: listCopy, configType: this.configType });
  };

  render() {
    const { connectDropTarget, isOver, canDrop } = this.props;
    const isDragDroppable = isOver && canDrop;
    const { list, key } = this.state;
    return connectDropTarget(
      <div
        key={key}
        style={{
          height: '100%',
          maxHeight: '150',
          width: '100%',
          border: isDragDroppable ? '1px dashed #e8e8e8' : '1px dashed transparent',
          overflowY: 'scroll',
        }}
      >
        {list &&
          list.map((data, index) => {
            if (!data) {
              return null;
            }
            return (
              <PlottedTag
                key={data.id}
                movePlottedTag={this.movePlottedTag}
                removePlottedTag={this.removePlottedTag}
                text={data.columnName}
                hasDropdown
                dropDownPosition="right"
                rightIcon={false}
                dropdownLabel={data.field_aggregation}
                data={{ ...data, index }}
                onDataUpdated={this.onDataUpdated}
              />
            );
          })}
      </div>
    );
  }
}

export default dropTarget(Types.PLOTTED_TAG, plottedTagsTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}))(PlottedTags);
