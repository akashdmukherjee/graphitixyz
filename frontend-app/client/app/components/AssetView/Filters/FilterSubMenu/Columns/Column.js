import React from 'react';
import cssModules from 'react-css-modules';
import styles from './column.styl';

const Column = ({ text, active, onClick }) => (
  <h5
    styleName={active ? 'text-active' : 'text'}
    onClick={event => {
      onClick(event, { text, active });
    }}
  >
    {text}
  </h5>
);

Column.propTypes = {
  text: React.PropTypes.string,
  active: React.PropTypes.bool,
  onClick: React.PropTypes.func,
};

export default cssModules(Column, styles);
