// This is the component which is responsible of
// managing recording and playing all actions
// in the future versions it will be decoupled

// process of connecting state and reducers to the props
// and DnD API's methods is the same as in the case of Canvas component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './timeline.styl';
import { connect as reduxConnect } from 'react-redux';
import { playTimeouts } from '../../common/playTimeouts';
import {
  addTimelineItem,
  cleanTimeline,
  startRecording,
  stopRecording,
  cleanTimer,
  play,
  stop,
} from '../../components/Timeline/TimelineActions';
import { changeObject } from '../Object/ObjectActions';
import moment from 'moment';

const TimelineRecordPlay = (props) => {
  const {
    timer,
    objAttrs,
    isPlaying,
  } = props;

  const handlePlay = () => {
    const events = timer.events && timer.events.slice();
    props.play();
    playTimeouts.set(() => props.stop(), moment(moment(timer.end)).diff(timer.start));
    if (events && events.length) {
      events.forEach(item => {
        const newobjAttrs = objAttrs.slice();
        newobjAttrs.forEach(box => {
          const boxItem = box;
          boxItem.anim = '';
        });
        props.changeObject(newobjAttrs);
        playTimeouts.set(() => {
          newobjAttrs.find(box => box.id === item.boxId).anim = `animated ${item.animation}`;
          props.changeObject(newobjAttrs);
        }, item.moment);
      });
    }
  };
  const handleStopPlaying = () => {
    playTimeouts.clearAll();
    props.stop();
  };
  const showDuration = () => {
    if (timer.start && timer.end) {
      return `Record time: ${moment(moment(timer.end)).diff(timer.start)} ms`;
    } else if (timer.start) {
      return 'Recording...';
    }
    return '';
  };
  const handleStart = () => {
    props.cleanTimer();
    props.cleanTimeline();
    props.startRecording();
  };
  const handleStopRecording = () => {
    const events = timer.events && timer.events.slice();
    props.stopRecording();
    if (events && events.length) {
      events.forEach(event => {
        props.addTimelineItem(event.id, event.boxId, event.moment, event.animation);
      });
    }
  };
  const isRecording = () => {
    if (timer.start && !timer.end) {
      return true;
    }
    return false;
  };
  const isRecorded = () => {
    if (timer.start && timer.end) {
      return true;
    }
    return false;
  };
  return (
    <div styleName="timeline-record-play">
      {isRecording() ?
        <span>
          <button styleName="record-button" onClick={handleStopRecording}>
            <i className="fa fa-stop-circle-o" aria-hidden="true"></i> Stop recording
          </button>
        </span> :
        <span>
          <button styleName="record-button" onClick={handleStart}>
            <i className="fa fa-dot-circle-o" aria-hidden="true"></i> Record
          </button>
        </span>
      }
      {isRecorded() && !isPlaying ?
        <button styleName="play-button" onClick={handlePlay}>
          <i className="fa fa-play"></i> Play
        </button> : null
      }
      {isPlaying ?
        <button styleName="stop-button" onClick={handleStopPlaying}>
          <i className="fa fa-stop"></i> Stop
        </button> : null
      }
      <small>
        {showDuration()}
      </small>
    </div>
  );
};

TimelineRecordPlay.propTypes = {
  timer: React.PropTypes.object.isRequired,
  objAttrs: React.PropTypes.array.isRequired,
  isPlaying: React.PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  objAttrs: state.object,
  timer: state.timer,
  isPlaying: state.isPlaying,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({
  cleanTimer,
  cleanTimeline,
  startRecording,
  stopRecording,
  changeObject,
  addTimelineItem,
  play,
  stop,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(TimelineRecordPlay, style)
);
