// Bottom area with Timeline component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './bottom-menu.styl';
import TimelineResizeHandler from '../Timeline/TimelineResizeHandler';
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

const BottomMenu = (props) => {
  const { connectDropTarget } = props;
  return connectDropTarget(
    <div
      styleName="bottom-menu"
      style={{ display: props.visible ? 'block' : 'none', height: props.height }}
    >
      <TimelineResizeHandler timelineHeight={props.height} />
      <div styleName="wrapper">{props.children}</div>
    </div>
  );
};

BottomMenu.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.arrayOf(React.PropTypes.element),
  ]),
  visible: React.PropTypes.bool.isRequired,
  height: React.PropTypes.number.isRequired,
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
    cssModules(BottomMenu, style)
  )
);
