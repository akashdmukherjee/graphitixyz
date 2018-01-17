import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class Image extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <div />;
  }
}

export default cssModules(Image, styles);
