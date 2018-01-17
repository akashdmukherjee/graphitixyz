import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import styles from './index.styl';
import PlottedTags from './PlottedTags';
import Tag from '../../../common/Tag';
import PlotFieldSelector from './PlotFieldSelector';
import update from 'immutability-helper';

const generateRandomId = () => Math.random().toString().slice(3, 10);

const verticalDraggableLabels = {
  xAxis: 'X Axis',
  yAxis: 'Y Axis',
  color: 'Color',
  size: 'Size',
};

const visualTypes = {
  POSITION: 'POSITION',
  LENGTH: 'LENGTH',
};

const inputNames = {
  granularityInput: 'granularityInput',
  xAxisInput: 'xAxisInput',
  yAxisInput: 'yAxisInput',
  colorInput: 'colorInput',
  sizeInput: 'sizeInput',
};

const configTypes = {
  xAxis: 'xAxis',
  yAxis: 'yAxis',
  color: 'color',
  size: 'size',
  granularity: 'granularity',
};

const aggregations = {
  RAW: 'RAW',
  COUNT: 'COUNT',
  SUM: 'SUM',
  MIN: 'MIN',
  MAX: 'MAX',
  AVG: 'AVG',
};

const dataTypes = {
  string: 'string',
  date: 'date',
  timestamp: 'timestamp',
  integer: 'integer',
  decimal: 'decimal',
};

const tagStyle = {
  tagWrapper: {
    position: 'relative',
    margin: 0,
    marginRight: 10,
    padding: '1px 8px',
  },
  label: {
    fontSize: 11,
    lineHeight: 2.1,
  },
  close: {
    position: 'absolute',
    right: 9,
    top: 3,
  },
};

/**
 * format for selected field
 * types: dimension, metric
 * number => metric
 */

const propTypes = {
  apiData: PropTypes.object.isRequired,
  columnNamesOfAnAsset: PropTypes.object,
  getColumnNamesOfAnAsset: PropTypes.func.isRequired,
};

const defaultProps = {
  columnNamesOfAnAsset: null,
};

class ChartConfigurer extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    const { apiData, assetId } = props;
    this.state = {
      currentVisual: visualTypes.LENGTH,
      list: {
        xAxis: [],
        yAxis: [],
        color: [],
        size: [],
        granularity: [],
      },
      searchText: undefined,
      activeInputShowingDropdown: null,
    };
    this.data = {
      ...apiData,
      assetId,
    };
  }

  componentDidMount() {
    const { getColumnNamesOfAnAsset } = this.props;
    getColumnNamesOfAnAsset({ ...this.data });
  }

  componentWillReceiveProps(nextProps) {
    const { columnNamesOfAnAsset } = nextProps;
    if (columnNamesOfAnAsset !== this.props.columnNamesOfAnAsset) {
      this.setState({ columnNamesOfAnAsset });
    }
  }

  onInputChange = e => {
    const { value } = e.target;
    this.setState({ searchText: value });
  };

  onInputFocus = e => {
    const { name } = e.target;
    this.setState({ searchText: '', activeInputShowingDropdown: name });
  };

  onInputBlur = () => {
    this.setState({ searchText: null, activeInputShowingDropdown: null });
  };

  onPlotFieldItemSelect = (data, configType) => {
    const { list } = this.state;
    // console.info('onPlotFieldItemSelect', data, configType);
    // apply some rules on a selected field
    const plottedTagObject = {
      ...data,
      id: generateRandomId(),
      sqlFunction: null,
    };
    const dataType = plottedTagObject.dataType.toLowerCase();
    // if startsWith `id` or endsWith `_id` apply COUNT function
    if (plottedTagObject.columnName.match(/(^id|_id)$/)) {
      plottedTagObject.sqlFunction = aggregations.COUNT;
    } else if (dataType === dataTypes.integer || dataType === dataTypes.decimal) {
      plottedTagObject.sqlFunction = aggregations.SUM;
    } else if (
      dataType === dataTypes.string ||
      dataTypes.date === dataType ||
      dataTypes.timestamp === dataType
    ) {
      plottedTagObject.sqlFunction = aggregations.RAW;
    }
    this.setState({
      list: update(list, {
        [configType]: { $push: [plottedTagObject] },
      }),
      searchText: undefined,
      activeInputShowingDropdown: null,
    });
  };

  onListUpdated = (updatedList, configType) => {
    const { list } = this.state;
    this.setState({
      list: update(list, {
        [configType]: { $set: updatedList },
      }),
    });
  };

  render() {
    const {
      currentVisual,
      searchText,
      activeInputShowingDropdown,
      list,
      columnNamesOfAnAsset,
    } = this.state;

    return (
      <div styleName="ChartConfigurer-wrapper">
        <div styleName="configurers">
          <div styleName="vertical-draggable">
            <div styleName="label">
              <h5>
                {verticalDraggableLabels.xAxis}
              </h5>
              <div styleName="action-icon swap" />
            </div>
            <div
              styleName="field-input"
              onClick={e => {
                // catch the onDOMClick handler of ListWrapper
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <input
                type="text"
                placeholder="Add to X"
                name={inputNames.xAxisInput}
                onChange={this.onInputChange}
                onFocus={this.onInputFocus}
              />
              {columnNamesOfAnAsset
                ? <PlotFieldSelector
                  searchText={searchText}
                  open={activeInputShowingDropdown === inputNames.xAxisInput}
                  columnNamesOfAnAsset={columnNamesOfAnAsset}
                  onItemSelect={data => this.onPlotFieldItemSelect(data, configTypes.xAxis)}
                />
                : null}
            </div>
            <PlottedTags
              list={list.xAxis}
              onListUpdated={updatedList => this.onListUpdated(updatedList, configTypes.xAxis)}
            />
          </div>
          <div styleName="vertical-draggable">
            <div styleName="label">
              <h5>
                {verticalDraggableLabels.yAxis}
              </h5>
              <div styleName="action-icon swap" />
            </div>
            <div
              styleName="field-input"
              onClick={e => {
                // catch the onDOMClick handler of ListWrapper
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <input
                type="text"
                placeholder="Add to Y"
                name={inputNames.yAxisInput}
                onChange={this.onInputChange}
                onFocus={this.onInputFocus}
              />
              {columnNamesOfAnAsset
                ? <PlotFieldSelector
                  searchText={searchText}
                  open={activeInputShowingDropdown === inputNames.yAxisInput}
                  columnNamesOfAnAsset={columnNamesOfAnAsset}
                  onItemSelect={data => this.onPlotFieldItemSelect(data, configTypes.yAxis)}
                />
                : null}
            </div>
            <PlottedTags
              list={list.yAxis}
              onListUpdated={updatedList => this.onListUpdated(updatedList, configTypes.yAxis)}
            />
          </div>
          <div styleName="vertical-draggable">
            <div styleName="label">
              <h5>
                {verticalDraggableLabels.color}
              </h5>
              <div styleName="action-icon color" />
            </div>
            <div
              styleName="field-input"
              onClick={e => {
                // catch the onDOMClick handler of ListWrapper
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <input
                type="text"
                placeholder="Add to Color"
                name={inputNames.colorInput}
                onChange={this.onInputChange}
                onFocus={this.onInputFocus}
              />
              {columnNamesOfAnAsset
                ? <PlotFieldSelector
                  searchText={searchText}
                  open={activeInputShowingDropdown === inputNames.colorInput}
                  columnNamesOfAnAsset={columnNamesOfAnAsset}
                  onItemSelect={data => this.onPlotFieldItemSelect(data, configTypes.color)}
                />
                : null}
            </div>
            <PlottedTags
              list={list.color}
              onListUpdated={updatedList => this.onListUpdated(updatedList, configTypes.color)}
            />
          </div>
          <div styleName="vertical-draggable">
            <div styleName="label">
              <h5>
                {verticalDraggableLabels.size}
              </h5>
              <div styleName="action-icon size" />
            </div>
            <div
              styleName="field-input"
              onClick={e => {
                // catch the onDOMClick handler of ListWrapper
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <input
                type="text"
                placeholder="Add to Size"
                name={inputNames.sizeInput}
                onChange={this.onInputChange}
                onFocus={this.onInputFocus}
              />
              {columnNamesOfAnAsset
                ? <PlotFieldSelector
                  searchText={searchText}
                  open={activeInputShowingDropdown === inputNames.sizeInput}
                  columnNamesOfAnAsset={columnNamesOfAnAsset}
                  onItemSelect={data => this.onPlotFieldItemSelect(data, configTypes.size)}
                />
                : null}
            </div>
            <PlottedTags
              list={list.size}
              onListUpdated={updatedList => this.onListUpdated(updatedList, configTypes.size)}
            />
          </div>
        </div>
        {this.renderGranularityPanel()}
      </div>
    );
  }

  renderPlotFieldInput() {
    const { columnNamesOfAnAsset, searchText, activeInputShowingDropdown } = this.state;
    return (
      <div
        styleName="input-wrapper"
        onClick={e => {
          // catch the onDOMClick handler of ListWrapper
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        <input
          type="text"
          name={inputNames.granularityInput}
          placeholder="Plot fields"
          onChange={this.onInputChange}
          onFocus={this.onInputFocus}
        />
        {columnNamesOfAnAsset
          ? <PlotFieldSelector
            searchText={searchText}
            open={activeInputShowingDropdown === inputNames.granularityInput}
            columnNamesOfAnAsset={columnNamesOfAnAsset}
            onItemSelect={data => this.onPlotFieldItemSelect(data, configTypes.granularity)}
          />
          : null}
      </div>
    );
  }

  renderGranularityPanel() {
    const { list } = this.state;
    let Tags = [];

    // GRANULARITY is applied only on dimensions
    // sqlFunction === RAW
    Object.keys(list).forEach(configType => {
      Tags = [
        ...Tags,
        ...list[configType]
          .filter(tagData => tagData.sqlFunction === aggregations.RAW)
          .map(tagData => <Tag style={tagStyle} label={tagData.columnName} gptRed />),
      ];
    });
    if (Tags.length === 0) return null;
    return (
      <div styleName="visual-configurer">
        <div styleName="representation">
          <div styleName="label">GRANULARITY</div>
          <div styleName="granular-input">
            <div styleName="granular-tags">
              {Tags}
            </div>
            {this.renderPlotFieldInput()}
          </div>
        </div>
      </div>
    );
  }

  renderVisualConfigurer() {
    const { currentVisual } = this.state;

    let visualTypePositionStylename = '';
    let visualTypeLengthStylename = '';
    if (currentVisual === visualTypes.POSITION) {
      visualTypePositionStylename = 'active';
    } else {
      visualTypeLengthStylename = 'active';
    }
    return (
      <div styleName="visual-configurer">
        <div styleName="representation">
          <div styleName="label">VISUAL REPRESENTATION</div>
          <div styleName="action-btns">
            <div styleName="visual">
              <div
                styleName={`image-btn ${visualTypeLengthStylename}`}
                data-tip
                data-for="image-length"
                onClick={() => this.setState({ currentVisual: visualTypes.LENGTH })}
              >
                <div styleName={`image length ${visualTypeLengthStylename}`} />
                <ReactTooltip id="image-length" type="dark" effect="solid" multiline>
                  <div style={{ textAlign: 'center' }}>Length</div>
                </ReactTooltip>
              </div>
              <div
                styleName={`image-btn ${visualTypePositionStylename}`}
                data-tip
                data-for="image-position"
                onClick={() => this.setState({ currentVisual: visualTypes.POSITION })}
              >
                <div styleName={`image position ${visualTypePositionStylename}`} />
                <ReactTooltip id="image-position" type="dark" effect="solid" multiline>
                  <div style={{ textAlign: 'center' }}>Position</div>
                </ReactTooltip>
              </div>
            </div>
            <button styleName="swap-btn">
              Swap Axes <i className="fa fa-exchange" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default cssModules(ChartConfigurer, styles, { allowMultiple: true });
