import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Tag from '../Tag';

class FilterParams extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div styleName="filter-params-wrapper">
        <Tag label="infosec" />
        <Tag label="tech" />
      </div>
    );
  }
}

export default cssModules(FilterParams, styles);
