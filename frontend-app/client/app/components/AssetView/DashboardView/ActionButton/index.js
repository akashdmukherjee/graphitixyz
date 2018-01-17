import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import style from './index.styl';
import actionTypes from '../newItemActionTypes';

const ActionButton = ({ onClick }) =>
  <ul styleName="ActionButton">
    <li onClick={() => onClick(actionTypes.IMAGE)}>
      <i className="fa fa-picture-o" title="Image" />
    </li>
    <li onClick={() => onClick(actionTypes.TEXT)}>
      <i className="fa fa-font" title="Text" />
    </li>
    <li onClick={() => onClick(actionTypes.CHART)}>
      <i className="fa fa-area-chart" title="Chart" />
    </li>
    <li>
      <span>+</span>
      <i className="fa fa-pencil" title="New" />
    </li>
  </ul>;

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
export default cssModules(ActionButton, style);
