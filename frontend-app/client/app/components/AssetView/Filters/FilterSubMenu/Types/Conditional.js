import React from 'react';
import cssModules from 'react-css-modules';
import styles from './conditional.styl';

export const Types = {
  STRING: 'string',
  INTEGER: 'integer',
  DECIMAL: 'decimal',
  DATE: 'date',
  TIMESTAMP: 'timestamp',
};

export const DateConditionals = {
  ONE: 'ONE',
  TWO: 'TWO',
};

const Conditional = ({ conditional, active, onClick, keyName }) =>
  <h5
    styleName={active ? 'text-active' : 'text'}
    onClick={event => {
      const data = {
        ...conditional,
      };
      data.inputTypeText = 'Some Text';
      onClick(event, data);
    }}
    key={keyName}
  >
    {conditional.text}
  </h5>;

Conditional.propTypes = {
  conditional: React.PropTypes.object.isRequired,
  type: React.PropTypes.string,
  keyName: React.PropTypes.string,
  active: React.PropTypes.bool,
  onClick: React.PropTypes.func,
};

export default cssModules(Conditional, styles);
