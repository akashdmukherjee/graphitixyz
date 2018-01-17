import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { Responsive, WidthProvider as widthProvider } from 'react-grid-layout';
import styles from './index.styl';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './index.css';
import ActionButton from './ActionButton';
// import Chart from './dummy/Chart';
// import ChartView from '../ChartView';
import Chart from './Chart';
import Text from './Text';
import SelectChartModal from './SelectChartModal';
import actionTypes from './newItemActionTypes';
import FileChooser from './Image/FileChooser';

const ResponsiveReactGridLayout = widthProvider(Responsive);
const propTypes = {
  apiData: PropTypes.object.isRequired,
};
const defaultProps = {};

const generateRandomId = () => Math.random().toString().slice(3, 10);

class DashboardView extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    /**
     * items => [
     *  {
     *    type: oneOf(actionTypes),
     *    dataGrid: this.getAppropriateDataGrid()
     *    assetId: String,
     *    id: String,
     *  }
     * ]
     */
    this.state = {
      items: [],
    };
    this.lastKnownGrid = {
      x: 0,
      y: 0,
      w: 4,
      h: 2,
    };
    this.selectChartModal = null;
  }

  getAppropriateDataGrid = () => {
    return this.lastKnownGrid;
  };

  handleActionItemClick = actionType => {
    if (actionType === actionTypes.CHART) {
      this.selectChartModal.show();
    } else if (actionType === actionTypes.IMAGE) {
      this.fileChooserModal.show();
    } else {
      this.addNewDashboardItem(actionType);
    }
  };

  addNewDashboardItem = actionType => {
    const items = this.state.items.slice(0);
    items.push({
      type: actionType,
      dataGrid: { ...this.getAppropriateDataGrid(), h: 1 },
      id: generateRandomId(),
    });
    this.setState({ items });
  };

  handleChartAssetSelection = data => {
    const items = this.state.items.slice(0);
    items.push({
      type: actionTypes.CHART,
      dataGrid: this.getAppropriateDataGrid(),
      assetId: data.assetId,
      id: generateRandomId(),
    });
    this.setState({ items });
  };

  handleContextMenuItemClick = (e, data) => {
    const items = this.state.items.slice(0).filter(item => item.id !== data.id);
    this.setState({ items });
  };

  setSeletChartModalRef = _ref => {
    if (!_ref) return;
    this.selectChartModal = _ref.getWrappedInstance();
  };

  setFileChooserModalRef = _ref => {
    this.fileChooserModal = _ref;
  };

  renderItems = () => {
    const { items } = this.state;
    return items.map(item => {
      if (item.type === actionTypes.CHART) {
        return (
          <div key={item.id} data-grid={item.dataGrid}>
            <Chart
              assetId={item.assetId}
              item={item}
              apiData={this.props.apiData}
              onContextMenuItemClick={this.handleContextMenuItemClick}
              onRightClick={this.handleRightClick}
            />
          </div>
        );
      } else if (item.type === actionTypes.TEXT) {
        return (
          <div key={item.id} data-grid={item.dataGrid}>
            <Text
              item={item}
              onContextMenuItemClick={this.handleContextMenuItemClick}
              onRightClick={this.handleRightClick}
            />
          </div>
        );
      }
      return null;
    });
  };

  render() {
    return (
      <ResponsiveReactGridLayout
        className="layout"
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        onLayoutChange={layout => console.info('onLayoutChange', layout)}
        onResizeStop={(layout, oldItem, newItem, placeholder, e, element) => {
          window.postMessage({ type: 'CHART_RESIZE', item: newItem }, '*');
        }}
      >
        {this.renderItems()}
        <ActionButton onClick={this.handleActionItemClick} />
        <SelectChartModal
          ref={this.setSeletChartModalRef}
          apiData={this.props.apiData}
          onClick={this.handleChartAssetSelection}
        />
        <FileChooser ref={this.setFileChooserModalRef} />
      </ResponsiveReactGridLayout>
    );
  }
}

export default cssModules(DashboardView, styles);
