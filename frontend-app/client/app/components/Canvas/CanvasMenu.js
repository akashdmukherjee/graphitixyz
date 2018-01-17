import React from 'react';
import cssModules from 'react-css-modules';
import style from './canvas-menu.styl';

const CanvasMenu = () => (
  <ul styleName="canvas-menu">
    <li>
      <i className="fa fa-table" title="Tag"></i>
    </li>
    <li>
      <i className="fa fa-area-chart" title="User"></i>
    </li>
    <li>
      <i className="fa fa-paperclip" title="Like"></i>
    </li>
    <li>
      <span>+</span>
      <i className="fa fa-pencil" title="Write new"></i>
    </li>
  </ul>
);

export default cssModules(CanvasMenu, style);
