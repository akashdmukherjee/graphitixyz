import React from 'react';
import PropTypes from 'prop-types';
import { GridLoader } from 'halogen';

const loaderStyle = {
  display: 'flex',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
};

const gridLoaderStyle = {
  display: 'flex',
  WebkitFlex: '0 1 auto',
  flex: '0 1 auto',
  WebkitFlexDirection: 'column',
  flexDirection: 'column',
  WebkitFlexGrow: 1,
  flexGrow: 1,
  WebkitFlexShrink: 0,
  flexShrink: 0,
  WebkitFlexBasis: '25%',
  flexBasis: '25%',
  maxWidth: '25%',
  height: '200px',
  WebkitAlignItems: 'center',
  alignItems: 'center',
  WebkitJustifyContent: 'center',
  justifyContent: 'center',
};

const Loader = ({ style }) =>
  <div style={{ ...loaderStyle, ...style }}>
    <GridLoader style={gridLoaderStyle} color="#f26450" />
  </div>;

Loader.propTypes = {
  style: PropTypes.object,
};

Loader.defaultProps = {
  style: {},
};

export default Loader;
