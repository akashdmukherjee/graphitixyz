// This is the main Timeline component
// here we have logic which is responsible of placing TimelineItems
// Here we can also drag and drop timeline items
// We have drop method which dispaches some actions like
// writing new TimelineItems positions and changing timing in the recorded events

// process of connecting state and reducers to the props
// and DnD API's methods is the same as in the case of Canvas component

import React from 'react';
import cssModules from 'react-css-modules';
import { DropTarget as dropTarget } from 'react-dnd';
import style from './timeline.styl';
import TimelineItem from './TimelineItem';
import { dndItemTypes } from '../../common/vars';
import { changeTimeline, changeTimerEvent } from '../../components/Timeline/TimelineActions';
import { connect as reduxConnect } from 'react-redux';
import { positionTimeCalc } from '../../common/positionTimeCalc';
import TimelinePlaceholder from './TimelinePlaceholder';
import TimelineRecordPlay from './TimelineRecordPlay';
import moment from 'moment';
import _ from 'lodash';

const ItemTarget = {
  drop(props, monitor) {
    const step = positionTimeCalc.get() + 1;
    const item = monitor.getItem();
    const delta = monitor.getDifferenceFromInitialOffset();
    const left = Math.round(positionTimeCalc.position(item.startsAt) + delta.x);
    const snappedLeft = Math.round(left / step) * step;
    props.changeTimeline({ id: item.id, startsAt: positionTimeCalc.startsAt(snappedLeft) });
    props.changeTimerEvent(item.id, positionTimeCalc.startsAt(snappedLeft));
  },
};

const collect = (connect) => ({
  connectDropTarget: connect.dropTarget(),
});

const Timeline = (props) => {
  const { connectDropTarget, timelineAttrs, timer, isPlaying, mainSizes } = props;
  const timeIndicatorStyles = () => {
    if (isPlaying) {
      return {
        left: mainSizes.width,
        transitionDuration: `${moment(moment(timer.end)).diff(timer.start)}ms`,
      };
    }
    return { left: 0 };
  };
  const buildScale = () => {
    if (timer.start && timer.end) {
      const duration = moment(moment(timer.end)).diff(timer.start);
      const amount = Math.round(duration / 1000);
      positionTimeCalc.set((mainSizes.width - amount) / amount);
      const amountRange = _.range(amount);
      if (amount) {
        return (
          <div styleName="timeline-scale-container">
            <div styleName="time-indicator" style={timeIndicatorStyles()}></div>
            {amountRange.map((item, index) => (
              <div
                styleName="scale-item"
                key={index}
                style={{ marginLeft: positionTimeCalc.get() }}
              >
                <div styleName="scale-item-number" key={index + 1000}>{item + 1} s</div>
              </div>
            ))}
          </div>
        );
      }
      return null;
    }
    return <TimelinePlaceholder />;
  };
  const timelineItems = _.sortBy(timelineAttrs, o => o.boxId);
  const placeTimelineItems = () => {
    if (timelineItems[0]) {
      let currentBoxId = timelineItems[0].boxId;
      const items = [[]];
      let counter = 0;
      let boxItemCounter = 0;
      timelineItems.forEach((item, index) => {
        if (currentBoxId !== item.boxId) {
          items.push([]);
          counter = counter + 1;
        }
        boxItemCounter = boxItemCounter + 1;
        if (index === 0 || currentBoxId !== item.boxId) {
          boxItemCounter = 0;
          items[counter].push(
            <div
              key={index + 2000}
              style={{ top: 40 * boxItemCounter }}
              styleName="timeline-item-box-name"
            >
              {item.boxId}
            </div>
          );
        }
        items[counter].push(
          <TimelineItem
            attrs={item}
            left={positionTimeCalc.position(item.startsAt)}
            top={40 * boxItemCounter}
            id={index}
            key={index}
            hideSourceOnDrag
          />
        );
        currentBoxId = item.boxId;
      });
      return items;
    }
    return null;
  };
  return connectDropTarget(
    <div
      styleName="timeline-container"
      style={{ width: mainSizes.width }}
    >
      <div styleName="timeline-menu-column">
        <TimelineRecordPlay />
      </div>
      <div styleName="timeline-menu-column text-right"></div>
      <div>{buildScale()}</div>
      {placeTimelineItems() ? placeTimelineItems().map((item, index) => (
        <div
          styleName="timeline-box-wrapper"
          style={{ height: 40 * (item.length - 1) }} key={index}
        >
          {item}
        </div>
      )) : null}
    </div>
  );
};

Timeline.propTypes = {
  connectDropTarget: React.PropTypes.func.isRequired,
  timelineAttrs: React.PropTypes.array.isRequired,
  timer: React.PropTypes.object.isRequired,
  isPlaying: React.PropTypes.bool.isRequired,
  mainSizes: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  timelineAttrs: state.timeline,
  timer: state.timer,
  isPlaying: state.isPlaying,
  mainSizes: state.mainSizes,
});
const mapDispatchToProps = (dispatch) => ({
  changeTimeline: timelineAttrs => dispatch(changeTimeline(timelineAttrs)),
  changeTimerEvent: (id, time) => dispatch(changeTimerEvent(id, time)),
});

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  dropTarget(dndItemTypes.DRAGABLETIMELINEITEM, ItemTarget, collect)(
    cssModules(Timeline, style, { allowMultiple: true })
  )
);
