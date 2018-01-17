// Collapsible Right Menu component

import React from 'react';
import cssModules from 'react-css-modules';
import style from './collapsible-right-menu.styl';

const CollapsibleRightMenu = (props) => (
  <div styleName="collapsible-right-menu" style={{ display: props.visible ? 'block' : 'none' }}>
    crm
  </div>
);

CollapsibleRightMenu.propTypes = {
  visible: React.PropTypes.bool.isRequired,
};

export default cssModules(CollapsibleRightMenu, style);
