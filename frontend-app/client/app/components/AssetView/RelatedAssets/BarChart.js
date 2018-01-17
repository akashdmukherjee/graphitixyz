import React from 'react';
import { findDOMNode } from 'react-dom';
import drawBarChart from '../Charts/drawBarChart';

class BarChart extends React.Component {
  componentDidMount() {
    const dom = findDOMNode(this);
    drawBarChart(dom, this.props);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.data_for_chart !== this.props.data_for_chart) {
      const dom = findDOMNode(this);
      drawBarChart(dom, nextProps);
    }
  }
  render() {
    return (
      <div id="barChart_container">
        <h4> Bar Chart: {this.props.title} </h4>
      </div>
    );
  }
}

BarChart.propTypes = {
  title: React.PropTypes.string,
  data_for_chart: React.PropTypes.array,
};

export default BarChart;
