/**
 * StyledPopUp defines the structure and common behaviour
 * of a pop up List
 */
import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const caretPositions = {
  left: 'left',
  right: 'right',
  middle: 'middle',
};
const propTypes = {
  open: PropTypes.bool.isRequired,
  children: PropTypes.any.isRequired,
  showCaret: PropTypes.bool,
  caretPosition: PropTypes.oneOf([
    caretPositions.left,
    caretPositions.right,
    caretPositions.middle,
  ]),
  style: PropTypes.object,
};

const defaultProps = {
  style: {},
  showCaret: true,
  caretPosition: 'right',
};

const StyledPopUp = ({ children, style, showCaret, caretPosition }) => {
  const caret = showCaret ? 'caret' : '';
  return (
    <div styleName={`StyledPopUp ${caret} caret-${caretPosition}`} style={style}>
      {children}
    </div>
  );
};

StyledPopUp.propTypes = propTypes;
StyledPopUp.defaultProps = defaultProps;

export default cssModules(StyledPopUp, styles, { allowMultiple: true });
