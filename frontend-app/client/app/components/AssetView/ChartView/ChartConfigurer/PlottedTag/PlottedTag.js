import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import ReactDOM from 'react-dom';
import { DropTarget as dropTarget, DragSource as dragSource } from 'react-dnd';
import _ from 'lodash';
import styles from './plottedTag.styl';
import Field from '../../../../common/Field';
import PlotFieldSubMenu from '../PlotFieldSubMenu';
import * as Types from '../draggableItemTypes';

const menus = [
  {
    text: 'RAW',
    active: false,
  },
  {
    text: 'MIN',
    active: false,
  },
  {
    text: 'MAX',
    active: false,
  },
  {
    text: 'CNT',
    active: false,
  },
  {
    text: 'REMOVE',
    active: false,
    delete: true,
  },
];

const plottedTagSource = {
  beginDrag(props) {
    // console.info('target beginDrag', props);
    return {
      ...props.data,
    };
  },

  endDrag(props, monitor) {
    const dragData = monitor.getItem();
    // dropResult is an array of objects @list
    const dropResult = monitor.getDropResult();
    // console.info('source endDrag', dragData, dropResult, props);
    if (dropResult && dropResult.removeFromList) {
      props.removePlottedTag(dragData);
    }
  },
};

const plottedTagTarget = {
  hover(props, monitor, component) {
    const dragData = monitor.getItem();
    const hoverData = props.data;
    // console.info('target hover', dragData, hoverData);

    // Don't replace items with themselves
    if (dragData.index === hoverData.index) {
      // console.info('Same Tag');
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = ReactDOM.findDOMNode(
      component
    ).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragData.index < hoverData.index && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragData.index > hoverData.index && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    if (dragData.id !== hoverData.id) {
      props.movePlottedTag(dragData, hoverData);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      /* eslint-disable */
      monitor.getItem().data = hoverData;
      /* eslint-enable */
    }
  },
};

class PlottedTag extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func,
    connectDropTarget: PropTypes.func,
    isDragging: PropTypes.bool.isRequired,
    data: PropTypes.object.isRequired,
    removePlottedTag: PropTypes.func.isRequired,
    movePlottedTag: PropTypes.func.isRequired,
    onDataUpdated: PropTypes.func.isRequired,
  };

  static defaultProps = {
    removePlottedTag: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      openPlotFieldSubMenu: false,
      data: props.data,
    };
  }

  onPlotFieldSubMenuItemSelect = data => {
    const { openPlotFieldSubMenu, data: plottedTagData } = this.state;
    const { removePlottedTag, onDataUpdated } = this.props;
    if (data.text === 'REMOVE') {
      removePlottedTag(plottedTagData);
      return;
    }
    // console.info('onPlotFieldSubMenuItemSelect', data);
    const plottedTagDataCopy = { ...plottedTagData };
    plottedTagDataCopy.sqlFunction = data.text;
    this.setState({
      data: plottedTagDataCopy,
      openPlotFieldSubMenu: !openPlotFieldSubMenu,
    });
    onDataUpdated(plottedTagDataCopy);
  };

  onDropdownClick = e => {
    const { openPlotFieldSubMenu } = this.state;
    e.nativeEvent.stopImmediatePropagation();
    const { top, left, width } = ReactDOM.findDOMNode(
      this.plottedTag
    ).getBoundingClientRect();
    this.setState({
      openPlotFieldSubMenu: !openPlotFieldSubMenu,
      top: top - 4,
      left,
    });
  };

  render() {
    /* eslint-disable */
    const {
      connectDropTarget,
      connectDragSource,
      isDragging,
      styles,
      dropdownLabel: propsDropdownLabel,
      data: propsData,
      ...fieldProps
    } = this.props;
    /* eslint-enable */
    const { openPlotFieldSubMenu, data, top, left } = this.state;
    const opacity = isDragging ? 0 : 1;
    return connectDragSource(
      connectDropTarget(
        <div
          styleName="plotted-tag"
          style={{ opacity }}
          ref={_ref => {
            this.plottedTag = _ref;
          }}
        >
          <Field
            dropdownLabel={data.sqlFunction}
            data={data}
            {...fieldProps}
            onDropdownClick={this.onDropdownClick}
          />
          <PlotFieldSubMenu
            open={openPlotFieldSubMenu}
            dataSource={menus}
            style={{
              top,
              left,
            }}
            onVisibilityChanged={({ open }) => {
              this.state.openPlotFieldSubMenu = open;
            }}
            onItemClick={this.onPlotFieldSubMenuItemSelect}
          />
        </div>
      )
    );
  }
}

export default _.flow(
  dropTarget(Types.PLOTTED_TAG, plottedTagTarget, connect => ({
    connectDropTarget: connect.dropTarget(),
  })),
  dragSource(Types.PLOTTED_TAG, plottedTagSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }))
)(cssModules(PlottedTag, styles));
