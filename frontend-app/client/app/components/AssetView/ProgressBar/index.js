import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const ProgressBar = ({ score }) => {
  const width = Math.round(score);
  let progressStyleName = 'progress-bar-low';
  if (score > 33 && score < 66) {
    progressStyleName = 'progress-bar-medium';
  } else if (score > 66) {
    progressStyleName = 'progress-bar-high';
  }
  return (
    <div styleName="ProgressBar-wrapper">
      <div styleName={progressStyleName} style={{ width: `${width}%` }} />
    </div>
  );
};

export default cssModules(ProgressBar, styles);
