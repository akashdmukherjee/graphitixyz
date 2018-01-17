// This is just a placeholder for the timeline
// It shows when we don't have recorded events
// It will be replaced with the proper calculated timeline after recording

import React from 'react';
import cssModules from 'react-css-modules';
import style from './timeline.styl';
import _ from 'lodash';
import { connect as reduxConnect } from 'react-redux';

const TimelinePlaceholder = (props) => {
  const { mainSizes } = props;
  return (
    <div styleName="timeline-scale-container">
      {_.range(12).map(item => (
        <div styleName="scale-item" key={item} style={{ marginLeft: (mainSizes.width - 12) / 12 }}>
          <div styleName="scale-item-number" key={item + 1000}>{item + 1} s</div>
        </div>
      ))}
    </div>
  );
};

TimelinePlaceholder.propTypes = {
  mainSizes: React.PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  mainSizes: state.mainSizes,
});

export default reduxConnect(mapStateToProps)(cssModules(TimelinePlaceholder, style));
