import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
// width: 1.2 * height
export const cardSpacing = 40;
const Card = ({ children, width, height }) => (
  <div
    styleName="card-wrapper"
    style={{ width, height }}
  >
    {children}
  </div>
);

export default cssModules(Card, styles);
