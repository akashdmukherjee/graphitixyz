import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const FeatureHighlight = ({ text, subtext, iconName, onClick }) => (
  <div
    styleName="feature-highlight-wrapper"
    onClick={onClick}
  >
    <span styleName={iconName}></span>
    <h5>
      <span>{subtext}</span>
      <br />
      {text}
    </h5>
  </div>
);

FeatureHighlight.defaultProps = {
  onClick: null,
  subtext: 'Add',
};

FeatureHighlight.propTypes = {
  text: React.PropTypes.string.isRequired,
  subtext: React.PropTypes.string,
  iconName: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func,
};

export default cssModules(FeatureHighlight, styles);
