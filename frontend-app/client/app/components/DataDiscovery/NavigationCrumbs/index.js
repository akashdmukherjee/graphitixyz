import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Tag from '../Tag';

class NavigationCrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div styleName="main-wrapper">
      </div>
    );
  }
}

export default cssModules(NavigationCrumbs, styles);
