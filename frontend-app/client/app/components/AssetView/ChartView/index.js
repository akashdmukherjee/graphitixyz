import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory } from 'react-router';
import PropTypes from 'prop-types';
import d3 from 'd3';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ChartEditor from './ChartEditor';
import updateChartConfig from './utils/updateChartConfig';
import Select from '../../common/Select';
import { getAssignedColorCodes } from './colorCodes';
import { getChartData, getChartAssetDetails, updateChartAsset } from '../Api';
import Button from '../../common/Button';
import configTypes from './ChartEditor/configTypes';

// expose everything related to charts in global
window.d3 = d3;
import './utils/utilityFunctions';
import './utils/chartFunctions';
import './utils/createChart';
import './chartView.css';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const createDefaultChartConfigs = () => {
  const configTypesCopy = { ...configTypes };
  const chartConfigs = {
    fragments: [],
    barThickness: 0.9,
    holeSize: 0.8,
  };
  Object.keys(configTypesCopy).forEach(configType => {
    chartConfigs[configType] = [];
  });
  return chartConfigs;
};

const propTypes = {
  chartData: PropTypes.object,
  chartConfigs: PropTypes.object,
  createdChartAsset: PropTypes.object,
  apiData: PropTypes.object.isRequired,
  isNewAsset: PropTypes.bool.isRequired,
  getChartData: PropTypes.func.isRequired,
  onSaveChartClick: PropTypes.func.isRequired,
  getChartAssetDetails: PropTypes.func.isRequired,
};

const defaultProps = {
  chartData: null,
  createdChartAsset: null,
  chartAssetDetails: null,
  chartConfigs: {
    ...createDefaultChartConfigs(),
    stacked: true,
  },
};

const scrollTypes = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
};

const selectItems = {
  horizontal: [
    {
      text: 'Fit Horizontally',
      value: 'fit',
      scrollType: scrollTypes.HORIZONTAL,
    },
    {
      text: 'Scroll Horizontally',
      value: 'scroll',
      scrollType: scrollTypes.HORIZONTAL,
    },
  ],
  vertical: [
    {
      text: 'Fit Vertically',
      value: 'fit',
      scrollType: scrollTypes.VERTICAL,
    },
    {
      text: 'Scroll Vertically',
      value: 'scroll',
      scrollType: scrollTypes.VERTICAL,
    },
  ],
};

class ChartView extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    const chartConfigs = { ...props.chartConfigs };
    this.state = {
      stacked: true,
      assignedColorCodes: null,
      chartConfigs,
      chartViewKey: generateRandomId(),
      isAssetSaving: false,
      isAssetUpdating: false,
      isDirty: false,
    };
    this.isNewAsset = props.isNewAsset;
    this.sourceDataAssetId = null;
    window.horizontal_scroll = 'fit';
    window.vertical_scroll = 'fit';
    window.hole_size = chartConfigs.holeSize;
    window.bar_thickness = chartConfigs.barThickness;
    this.chartConfigs = chartConfigs;
  }

  componentDidMount() {
    if (!this.isNewAsset) {
      this.props.getChartAssetDetails({
        ...this.props.apiData,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      chartData,
      createdChartAsset,
      chartAssetUpdated,
      chartAssetCreationStarted,
      isSideBarOpened,
    } = nextProps;
    if (chartData !== this.props.chartData) {
      // this.setState({ chartData });
      this.renderChart(chartData);
    }
    if (createdChartAsset !== this.props.createdChartAsset) {
      if (!!createdChartAsset === false) return;
      browserHistory.replace(createdChartAsset.chartAssetId);
      this.isNewAsset = false;
      this.setState({ isAssetSaving: false });
    }
    if (chartAssetUpdated !== this.props.chartAssetUpdated) {
      this.setState({ isAssetUpdating: false });
    }
    if (chartAssetCreationStarted !== this.props.chartAssetCreationStarted) {
      this.setState({ isAssetSaving: true });
    }
    if (isSideBarOpened !== this.props.isSideBarOpened) {
      // defer chart render for 250ms
      // let RightSideBar close first: transition 0.25s ease-in-out
      // [refer AssetView index.styl => .right-sidebar]
      setTimeout(() => {
        this.renderChart();
      }, 250);
    }
  }

  callGetChartData = () => {
    this.props.getChartData({
      ...this.props.apiData,
      sourceDataAssetId: this.sourceDataAssetId,
      chartConfig: this.chartConfigs,
    });
  };

  handleConfigUpdated = (updatedConfig, isDirtyCheck) => {
    // console.info(updatedConfig);
    this.chartConfigs = { ...this.chartConfigs, ...updatedConfig };
    this.callGetChartData();
    // isDirtyCheck is required so that it can
    // ignore the config update call from ChartEditor's componentWillReceiveProps
    if (!isDirtyCheck) {
      this.setState({ isDirty: true });
    }
  };

  handleScrollOptionSelect = data => {
    // console.info(data);
    // this.scroll[data.scrollType] = data.value;
    window[`${data.scrollType}_scroll`] = data.value;
    this.renderChart();
  };

  handleStackedToggle = () => {
    const stacked = !this.state.stacked;
    this.chartConfig.is_stacked = stacked;
    this.callGetChartData();
    this.setState({ stacked });
  };

  handleColorsApplied = assignedColors => {
    // console.info(assignedColors);
    this.renderChart(
      this.props.chartData,
      this.state.stacked,
      Object.keys(assignedColors).map(key => ({
        value: key,
        color: assignedColors[key],
      }))
    );
  };

  handleAngleOrSizeChanged = (values, name) => {
    // console.info(values, name);
    if (name === 'angle') {
      window.hole_size = values[0];
      this.chartConfigs.holeSize = window.hole_size;
    } else if (name === 'size') {
      window.bar_thickness = values[0];
      this.chartConfigs.barThickness = window.bar_thickness;
    }
    this.setState({ isDirty: true });
    this.renderChart();
  };

  handleSourceDataSetSelection = sourceDataAsset => {
    this.sourceDataAssetId = sourceDataAsset.id;
    // if there is name in sourceDataAsset
    // then it's being called from Select component
    // which need to reset some components
    if (sourceDataAsset.name) {
      this.setState({ chartViewKey: generateRandomId() });
    }
  };

  handleSaveUpdateChartClick = () => {
    const saveOrUpdateObject = {
      isDirty: false,
    };
    // save if it's a new asset
    if (this.isNewAsset) {
      this.props.onSaveChartClick({
        chartConfig: { ...this.chartConfigs },
        sourceDataAssetId: this.sourceDataAssetId,
      });
    } else {
      this.props.updateChartAsset({ ...this.props.apiData, chartConfigs: this.chartConfigs });
      saveOrUpdateObject.isAssetUpdating = true;
    }
    this.setState(saveOrUpdateObject);
  };

  renderChart = (chartData, stacked, assignedColorCodesParam) => {
    const newChartData = chartData || this.props.chartData;
    if (!newChartData) return;
    const assignedColorCodes = assignedColorCodesParam || getAssignedColorCodes(newChartData);
    // set barThickness and holeSize if there is in the chartConfigs
    window.bar_thickness = this.chartConfigs.barThickness;
    window.hole_size = this.chartConfigs.holeSize;
    const chart = updateChartConfig(
      newChartData,
      this.chartConfigs,
      assignedColorCodes,
      stacked || this.state.stacked
    );
    window.createChart(chart);
    this.setState({ assignedColorCodes });
  };

  renderSaveAndUpdateButton = () => {
    const { isAssetSaving, isAssetUpdating, isDirty } = this.state;
    let text = this.isNewAsset ? 'Save Chart' : 'Update Chart';
    if (isAssetSaving) {
      text = 'Saving Chart...';
    }
    if (isAssetUpdating) {
      text = 'Updating Chart...';
    }
    if (isAssetSaving || isAssetUpdating) {
      return (
        <h5>
          {text}
        </h5>
      );
    }
    if (!isDirty) return null;
    return (
      <Button
        styleClassName="btn-fav"
        text={text}
        style={{ padding: 5 }}
        onClick={this.handleSaveUpdateChartClick}
      />
    );
  };

  render() {
    const { styles, ...restProps } = this.props;
    const { assignedColorCodes, chartViewKey } = this.state;
    return (
      <div styleName="ChartView">
        <ChartEditor
          assignedColorCodes={assignedColorCodes}
          onConfigUpdated={this.handleConfigUpdated}
          onColorsApplied={this.handleColorsApplied}
          onAngleOrSizeChanged={this.handleAngleOrSizeChanged}
          onSourceDataSetSelection={this.handleSourceDataSetSelection}
          {...restProps}
        />
        <div styleName="scroll-configurer">
          <div styleName="stack">
            {/* <h5>Stacked:</h5>
            <ul>
              <li>
                <input
                  type="checkbox"
                  name="stack"
                  id="stack-on"
                  checked={stacked}
                  onChange={this.handleStackedToggle}
                />
                <label htmlFor="stack-on">
                  {stacked ? 'ON' : 'OFF'}
                </label>
              </li>
            </ul> */}
            {this.renderSaveAndUpdateButton()}
          </div>
          <div styleName="scroll">
            <div styleName="scroll-horizontal">
              <Select
                items={selectItems.horizontal}
                onOptionSelect={this.handleScrollOptionSelect}
              />
            </div>
            <div styleName="scroll-vertical">
              <Select items={selectItems.vertical} onOptionSelect={this.handleScrollOptionSelect} />
            </div>
          </div>
        </div>
        <div id="chart_container" style={{ height: '50%' }} key={chartViewKey} />
        <div id="chart-tooltip" />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  chartData: state.dataAssetView.chartData,
  createdChartAsset: state.dataAssetView.createdChartAsset,
  chartAssetDetails: state.dataAssetView.chartAssetDetails,
  chartAssetUpdated: state.dataAssetView.chartAssetUpdated,
  chartAssetCreationStarted: state.dataAssetView.chartAssetCreationStarted,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getChartData,
      getChartAssetDetails,
      updateChartAsset,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(ChartView, styles));
