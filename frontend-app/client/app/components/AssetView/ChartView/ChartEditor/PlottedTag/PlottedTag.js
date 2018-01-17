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
import iconNames from '../iconNames';
import dataTypes from '../dataTypes';
import aggregations from '../aggregations';
import { getMenus } from './menus';

const fieldStyles = {
  content: {
    maxWidth: 120,
  },
};

const plotFieldSubMenuWrapperStyle = {
  position: 'absolute',
  zIndex: 999,
  backgroundColor: '#fff',
  transition: 'all 0.3s ease-in-out',
};

const plottedTagSource = {
  beginDrag(props) {
    console.info('target beginDrag', props);
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

    // if there is no `id` then this data is coming from
    // DraggableColumnName which has nothing to do with PlottedTag on hover
    // so do nothing
    if (dragData && !dragData.id) return;

    // Don't replace items with themselves
    if (dragData.index === hoverData.index) {
      // console.info('Same Tag');
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = ReactDOM.findDOMNode(component).getBoundingClientRect();

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
    const { data } = props;
    const menus = getMenus(data.dataType, data.configType);
    const menuMatchIndex = menus.findIndex(menu => menu.value === data.field_aggregation);
    if (menuMatchIndex !== -1) {
      menus[menuMatchIndex].active = true;
    }
    this.state = {
      openPlotFieldSubMenu: false,
      data,
      menus,
    };

    this.plotFieldSubMenu = null;
  }

  componentDidMount() {
    window.addEventListener('click', this.handleDOMClick);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleDOMClick);
  }

  handleDOMClick = e => {
    // console.info(this.plottedTag.contains(event.target), this.plottedTag, e.target);
    if (this.plottedTag && e.target !== this.plottedTag && !this.plottedTag.contains(e.target)) {
      this.setState({ openPlotFieldSubMenu: false });
    }
  };

  onPlotFieldSubMenuItemSelect = data => {
    const { data: plottedTagData, menus } = this.state;
    const { removePlottedTag, onDataUpdated } = this.props;
    if (data.text === 'REMOVE') {
      removePlottedTag(plottedTagData);
      return;
    }
    // console.info('onPlotFieldSubMenuItemSelect', data);
    const plottedTagDataCopy = { ...plottedTagData };
    plottedTagDataCopy.field_aggregation =
      data.text === aggregations.COUNT.label ? aggregations.COUNT.value : data.text;

    const menusSlice = menus.slice(0).map(menu => ({ ...menu, active: data.value === menu.value }));
    this.setState({
      data: plottedTagDataCopy,
      menus: menusSlice,
      openPlotFieldSubMenu: false,
    });
    onDataUpdated(plottedTagDataCopy);
  };

  onDropdownClick = e => {
    // e.nativeEvent.stopImmediatePropagation();
    const { top, left, width } = ReactDOM.findDOMNode(this.plottedTag).getBoundingClientRect();
    const plotFieldSubMenuWidth = 150;
    // console.info(top, left, right, width, this.plottedTag.clientWidth, this.plottedTag.clientLeft);
    this.setState({
      top: top - 4,
      left: left + width - plotFieldSubMenuWidth,
      openPlotFieldSubMenu: !this.state.openPlotFieldSubMenu,
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
    const { openPlotFieldSubMenu, menus, data, top, left } = this.state;
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
            dropdownLabel={
              data.field_aggregation === aggregations.COUNT.value
                ? aggregations.COUNT.label
                : data.field_aggregation
            }
            data={data}
            style={fieldStyles}
            {...fieldProps}
            onDropdownClick={this.onDropdownClick}
            transformLeftIconName={() => iconNames[data.dataType]}
          />
          <div
            style={{
              display: openPlotFieldSubMenu ? 'block' : 'none',
              top,
              left,
              ...plotFieldSubMenuWrapperStyle,
            }}
          >
            <PlotFieldSubMenu dataSource={menus} onItemClick={this.onPlotFieldSubMenuItemSelect} />
          </div>
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
