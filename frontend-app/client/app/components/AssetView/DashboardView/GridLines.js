import React from 'react';
import PropTypes from 'prop-types';

const gridContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
};
const gridStyle = {
  borderRight: '1px solid #ddd',
  borderBottom: '1px solid #ddd',
  width: '10%',
  height: '100%',
};

const gridRowStyle = {
  height: '10%',
  width: '100%',
  display: 'flex',
};

const GridRow = (
  <div style={gridRowStyle}>
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
    <div style={gridStyle} />
  </div>
);

const GridLines = () => {
  const GridRows = [];
  for (let i = 0; i < 10; i++) GridRows.push(GridRow);
  return (
    <div style={gridContainerStyle}>
      {GridRows}
    </div>
  );
};

export default GridLines;
