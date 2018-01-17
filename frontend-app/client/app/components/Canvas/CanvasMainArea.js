// Main area with Canvas component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './canvas-main-area.styl';
import { DropTarget as dropTarget } from 'react-dnd';
import {
  dndItemTypes,
  collapsibleLeftMenuWidth,
  collapsibleRightMenuWidth,
} from '../../common/vars';
import { connect as reduxConnect } from 'react-redux';
import { resizeTimelineContainer } from '../../components/Timeline/TimelineActions';
import { sizesRecalc } from '../../common/sizesRecalc';

const ItemTarget = {
  drop(props) {
    sizesRecalc.adjust(
      props.collapsibleMenus.left ? collapsibleLeftMenuWidth : 0,
      props.collapsibleMenus.right ? collapsibleRightMenuWidth : 0
    );
  },
  hover(props, monitor) {
    const delta = monitor.getDifferenceFromInitialOffset();
    const item = monitor.getItem();
    props.resizeTimelineContainer(item.timelineHeight - delta.y);
  },
};

const collect = (connect) => ({ connectDropTarget: connect.dropTarget() });

const CanvasMainArea = (props) => {
  const { connectDropTarget } = props;
  return connectDropTarget(
    <div styleName="main-area" style={props.style}>
      {props.children}
    </div>
  );
};

CanvasMainArea.propTypes = {
  children: React.PropTypes.element.isRequired,
  style: React.PropTypes.object.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
  timelineContainerHeight: React.PropTypes.number.isRequired,
  collapsibleMenus: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  timelineContainerHeight: state.timelineContainerHeight,
  collapsibleMenus: state.collapsibleMenus,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({
  resizeTimelineContainer,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  dropTarget(dndItemTypes.TIMELINERESIZE, ItemTarget, collect)(
    cssModules(CanvasMainArea, style)
  )
);
