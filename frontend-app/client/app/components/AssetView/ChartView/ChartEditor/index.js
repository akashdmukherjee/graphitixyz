import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import Select from '../../../common/Select';
import configTypes from './configTypes';
import { getColumnNamesOfAnAsset, getDataAssets } from '../../Api';
import PlottedTags from './PlottedTags';
import DraggableColumnName from './DraggableColumnName';
import ColorEditor from './ColorEditor';
import Slider from '../../../common/Slider';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const propTypes = {
  apiData: PropTypes.object.isRequired,
  assignedColorCodes: PropTypes.object.isRequired,
  isNewAsset: PropTypes.bool.isRequired,
  columnNamesOfAnAsset: PropTypes.object,
  accessibleDataAssets: PropTypes.arrayOf(PropTypes.object),
  getColumnNamesOfAnAsset: PropTypes.func.isRequired,
  getDataAssets: PropTypes.func.isRequired,
  onConfigUpdated: PropTypes.func.isRequired,
  onColorsApplied: PropTypes.func.isRequired,
  onSourceDataSetSelection: PropTypes.func.isRequired,
  onAngleOrSizeChanged: PropTypes.func.isRequired,
};
const defaultProps = {
  accessibleDataAssets: [],
  columnNamesOfAnAsset: {},
};

const selectStyle = {
  width: '100%',
  backgroundColor: 'transparent',
};

const colorEditorStyle = {
  container: {
    width: 'auto',
  },
  popUpComponent: {
    width: 250,
    right: 0,
    top: 25,
    zIndex: 999,
  },
};

class ChartEditor extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const {
      apiData,
      accessibleDataAssets,
      columnNamesOfAnAsset,
      assignedColorCodes,
      chartConfigs,
      isNewAsset,
    } = props;
    this.state = {
      accessibleDataAssets,
      selectedDataAsset: null,
      chartConfigs,
      columnNamesOfAnAsset,
      assignedColorCodes,
      sliderValues: {
        size: [0.9],
        angle: [0.8],
      },
      chartEditorKey: generateRandomId(),
      isNewAsset,
    };
    this.data = apiData;
    this.chartConfigs = { ...chartConfigs };
  }

  componentDidMount() {
    this.props.getDataAssets(this.data);
    // this.props.onConfigUpdated(this.chartConfig);
  }

  componentWillReceiveProps(nextProps) {
    const {
      accessibleDataAssets,
      columnNamesOfAnAsset,
      assignedColorCodes,
      chartAssetDetails,
      createdChartAsset,
    } = nextProps;
    const object = {};
    if (accessibleDataAssets !== this.state.accessibleDataAssets) {
      const selectedDataAsset = accessibleDataAssets.length ? accessibleDataAssets[0] : null;
      if (!!selectedDataAsset === false) return;
      this.props.onSourceDataSetSelection({ id: selectedDataAsset.id });
      this.setState(
        {
          accessibleDataAssets,
          selectedDataAsset,
        },
        () => {
          this.callGetColumnNamesOfAnAsset(selectedDataAsset);
        }
      );
    }
    if (columnNamesOfAnAsset !== this.props.columnNamesOfAnAsset) {
      this.setState({ columnNamesOfAnAsset });
    }
    if (assignedColorCodes !== this.props.assignedColorCodes) {
      this.setState({ assignedColorCodes });
    }
    if (chartAssetDetails && chartAssetDetails !== this.props.chartAssetDetails) {
      const chartConfigs = this.sanitizeChartConfigs(chartAssetDetails.chartConfigs);
      // update SliderValues
      this.setState({
        chartConfigs,
        sliderValues: {
          size: [chartConfigs.barThickness],
          angle: [chartConfigs.holeSize],
        },
      });
      // TODO: check on this with Geetish
      this.props.onSourceDataSetSelection({ id: chartAssetDetails.relatedAssets.inflow[0].id });
      this.props.onConfigUpdated(chartConfigs, true);
    }
    // if this is a new asset then this asset is created
    // and disable source DataSet selection
    if (createdChartAsset !== this.props.createdChartAsset) {
      this.setState({ isNewAsset: false });
    }
  }

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

  createDefaultChartConfigs = () => {
    const chartConfigs = {};
    Object.keys(configTypes).forEach(configType => {
      chartConfigs[configType] = [];
    });
    chartConfigs.fragments = [];
    return chartConfigs;
  };

  callGetColumnNamesOfAnAsset = selectedDataAsset => {
    const newApiData = { ...this.data, assetId: selectedDataAsset.id };
    this.props.getColumnNamesOfAnAsset(newApiData);
  };

  handleOptionSelect = item => {
    this.callGetColumnNamesOfAnAsset(item);
    this.props.onSourceDataSetSelection(item);

    // on sourceDataAsset change
    // reset appropriate chart configs
    this.chartConfigs = this.createDefaultChartConfigs();
    this.setState({
      chartEditorKey: generateRandomId(),
    });
  };

  handleListUpdated = ({ list, configType }) => {
    this.chartConfigs[configType] = list;
    // console.info(this.chartConfig);
    const newChartConfig = { ...this.chartConfigs };
    newChartConfig.orgId = this.data.orgId;
    newChartConfig.fragments = newChartConfig.subject_groupers;
    this.props.onConfigUpdated(newChartConfig);
  };

  handleColorsApplied = assignedColors => {
    this.colorEditor.hide();
    this.props.onColorsApplied(assignedColors);
  };

  handleSliderValuesUpdated = (values, sliderName) => {
    const sliderValues = { ...this.state.sliderValues };
    sliderValues[sliderName] = values;
    // console.info(sliderValues, values);
    this.setState({ sliderValues });
    this.props.onAngleOrSizeChanged(values, sliderName);
  };

  render() {
    const {
      accessibleDataAssets,
      columnNamesOfAnAsset,
      assignedColorCodes,
      sliderValues,
      chartEditorKey,
      isNewAsset,
    } = this.state;
    return (
      <div styleName="ChartEditor">
        <div styleName="data-source">
          <div styleName="top">
            {isNewAsset ? null : <div styleName="disable-layer" />}
            <Select
              style={selectStyle}
              items={accessibleDataAssets}
              renderItemLabel={item => item.name}
              onOptionSelect={this.handleOptionSelect}
            />
          </div>
          <div styleName="sources">
            {Object.keys(columnNamesOfAnAsset).map(columnName =>
              <DraggableColumnName
                key={columnName}
                columnName={columnName}
                dataType={columnNamesOfAnAsset[columnName].toLowerCase()}
              />
            )}
          </div>
        </div>
        <div styleName="options">
          <div styleName="types">
            <div styleName="top" />
            <div styleName="middle">
              <h5 styleName="label vertical">Dimensions</h5>
            </div>
            <div styleName="bottom">
              <h5 styleName="label vertical">Metrics</h5>
            </div>
          </div>
          <div styleName="plot column">
            <div styleName="top">
              <h5 styleName="label">X Axis</h5>
            </div>
            <div styleName="middle">
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.x_groupers}
                configType={configTypes.x_groupers}
                onListUpdated={this.handleListUpdated}
              />
            </div>
            <div styleName="bottom">
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.x_metrics}
                configType={configTypes.x_metrics}
                onListUpdated={this.handleListUpdated}
              />
            </div>
          </div>
          <div styleName="plot column">
            <div styleName="top">
              <h5 styleName="label">Y Axis</h5>
            </div>
            <div styleName="middle">
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.y_groupers}
                configType={configTypes.y_groupers}
                onListUpdated={this.handleListUpdated}
              />
            </div>
            <div styleName="bottom">
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.y_metrics}
                configType={configTypes.y_metrics}
                onListUpdated={this.handleListUpdated}
              />
            </div>
          </div>
          <div styleName="plot column">
            <div styleName="top">
              <h5 styleName="label">Color</h5>
              <ColorEditor
                ref={_ref => {
                  this.colorEditor = _ref;
                }}
                newKey={chartEditorKey}
                assignedColorCodes={assignedColorCodes}
                styles={colorEditorStyle}
                onColorsApplied={this.handleColorsApplied}
              />
            </div>
            <div styleName="middle">
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.color_groupers}
                configType={configTypes.color_groupers}
                onListUpdated={this.handleListUpdated}
              />
            </div>
            <div styleName="bottom">
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.color_metrics}
                configType={configTypes.color_metrics}
                onListUpdated={this.handleListUpdated}
              />
            </div>
          </div>

          <div styleName="details">
            <div styleName="top">
              <h5 styleName="label">Fragments</h5>
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.subject_groupers}
                configType={configTypes.subject_groupers}
                onListUpdated={this.handleListUpdated}
              />
            </div>
            <div styleName="middle">
              <div styleName="Slider-label">
                <h5 styleName="label">Angle</h5>
                <div styleName="slider">
                  <Slider
                    newKey={chartEditorKey}
                    min={0}
                    max={1}
                    values={sliderValues.angle}
                    onSliderValuesUpdated={data =>
                      this.handleSliderValuesUpdated(data.values, 'angle')}
                  />
                </div>
              </div>
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.angle_metrics}
                configType={configTypes.angle_metrics}
                onListUpdated={this.handleListUpdated}
              />
            </div>
            <div styleName="bottom">
              <div styleName="Slider-label">
                <h5 styleName="label">Size</h5>
                <div styleName="slider">
                  <Slider
                    newKey={chartEditorKey}
                    min={0}
                    max={1}
                    values={sliderValues.size}
                    onSliderValuesUpdated={data =>
                      this.handleSliderValuesUpdated(data.values, 'size')}
                  />
                </div>
              </div>
              <PlottedTags
                newKey={chartEditorKey}
                list={this.chartConfigs.size_metrics}
                configType={configTypes.size_metrics}
                onListUpdated={this.handleListUpdated}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { columnNamesOfAnAsset, accessibleDataAssets, createdChartAsset } = state.dataAssetView;
  return {
    columnNamesOfAnAsset,
    accessibleDataAssets,
    createdChartAsset,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getColumnNamesOfAnAsset,
      getDataAssets,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(
  cssModules(ChartEditor, styles, { allowMultiple: true })
);
