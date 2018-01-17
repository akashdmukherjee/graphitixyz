import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import { getChartAssetDetails, getChartData } from '../../Api';
import { getAssignedColorCodes } from './colorCodes';
import createChart from './utils/createChart';
import updateChartConfig from './utils/updateChartConfig';
import StyledItemWithContextMenu from '../StyledItemWithContextMenu';

const propTypes = {
  assetId: PropTypes.string.isRequired,
  apiData: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  dashboardChartAssetDetails: PropTypes.object,
  dashboardChartData: PropTypes.object,
  getChartAssetDetails: PropTypes.func.isRequired,
  getChartData: PropTypes.func.isRequired,
  onContextMenuItemClick: PropTypes.func.isRequired,
};
const defaultProps = {
  dashboardChartAssetDetails: {},
  dashboardChartData: {},
};

class Chart extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    this.state = {};
    this.chartConfigs = {};
    this.chartContainerId = `chart_${props.assetId}`;
    this.createChart = createChart.bind(this);
    this.updateChartConfig = updateChartConfig.bind(this);
    this.dashboardChartData = null;
  }

  componentDidMount() {
    const { apiData, assetId } = this.props;
    this.props.getChartAssetDetails({ ...apiData, assetId }, true);
    window.addEventListener('message', this.handleIncomingMessage);
  }

  componentWillUnmount() {
    window.addEventListener('message', this.handleIncomingMessage);
  }

  handleIncomingMessage = e => {
    const { type, item } = e.data;
    if (type === 'CHART_RESIZE') {
      // console.info('chartResize', item);
      this.handleChartResize();
    }
  };

  handleChartResize = e => {
    // console.info(this.id, this.chart.clientWidth, this.chart.clientHeight);

    const { clientWidth, clientHeight } = this.chart;
    this.renderChart();
  };

  componentWillReceiveProps(nextProps) {
    const { assetId, dashboardChartAssetDetails, dashboardChartData } = nextProps;
    if (
      dashboardChartAssetDetails &&
      dashboardChartAssetDetails[assetId] !== this.props.dashboardChartAssetDetails[assetId]
    ) {
      if (dashboardChartAssetDetails[assetId] === undefined) return;
      this.sanitizeChartConfigs(dashboardChartAssetDetails[assetId].chartConfigs);
      this.props.getChartData(
        {
          chartConfig: { ...this.chartConfigs },
          ...this.props.apiData,
          sourceDataAssetId: dashboardChartAssetDetails[assetId].relatedAssets.inflow[0].id,
        },
        true,
        assetId
      );
    }
    if (
      dashboardChartData &&
      dashboardChartData[assetId] !== this.props.dashboardChartData[assetId]
    ) {
      this.dashboardChartData = dashboardChartData[assetId];
      this.renderChart();
    }
  }

  renderChart = () => {
    setTimeout(() => {
      const chart = this.updateChartConfig(
        this.dashboardChartData,
        this.chartConfigs,
        getAssignedColorCodes(this.dashboardChartData),
        this.chartContainerId
      );
      this.createChart(chart);
    });
  };

  updateChartConfig = (chartData, chartConfigs, assignedColorCodes, chartContainerId) => {
    const ucc = updateChartConfig.clone();
    return ucc(chartData, chartConfigs, assignedColorCodes, chartContainerId);
  };

  sanitizeChartConfigs = chartConfigs => {
    Object.keys(chartConfigs).forEach(key => {
      const value = chartConfigs[key];
      if (typeof value === 'string') {
        this.chartConfigs[key] = JSON.parse(value);
      } else {
        this.chartConfigs[key] = value;
      }
    });
    return this.chartConfigs;
    // console.info(this.chartConfig);
  };
  render() {
    const { item, onContextMenuItemClick } = this.props;
    return (
      <StyledItemWithContextMenu item={item} onContextMenuItemClick={onContextMenuItemClick}>
        <div
          ref={_ref => {
            this.chart = _ref;
          }}
          id={this.chartContainerId}
          style={{ width: '100%', height: '100%' }}
        />
      </StyledItemWithContextMenu>
    );
  }
}

const mapStateToProps = state => ({
  dashboardChartAssetDetails: state.dataAssetView.dashboardChartAssetDetails,
  dashboardChartData: state.dataAssetView.dashboardChartData,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getChartAssetDetails,
      getChartData,
    },
    dispatch
  );
export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Chart, styles));
