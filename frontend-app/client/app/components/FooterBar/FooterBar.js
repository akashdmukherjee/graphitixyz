// Collapsible Right Menu component

import React from 'react';
import cssModules from 'react-css-modules';
import style from './footer-bar.styl';

const FooterBar = (props) => (
  <div styleName="static-footer-bar" style={{ display: props.visible ? 'flex' : 'none' }}>
    <div styleName="menu-column"></div>
    <div styleName="menu-column text-right">
      <button styleName="footer-bar-button">STORYBOARD</button>
    </div>
  </div>
);

FooterBar.propTypes = {
  visible: React.PropTypes.bool.isRequired,
};

export default cssModules(FooterBar, style, { allowMultiple: true });
