import React from 'react';
import cssModules from 'react-css-modules';

import styles from './logo.styl';
import Strings from '../../strings';

const Logo = ({ noDescription }) => (
  <div styleName="logo-wrapper" style={{ position: noDescription ? 'relative' : 'absolute' }}>
    <div styleName={'logo-red'}>
      <span styleName="company-name" style={{ color: '#f26450' }}>
        {Strings.companyname}
      </span>
    </div>
    {noDescription ? null : <h5 styleName="desc">{Strings.description}</h5>}
  </div>
);

Logo.defaultProps = {
  noDescription: false,
};

Logo.propTypes = {
  noDescription: React.PropTypes.bool,
};

export default cssModules(Logo, styles);
