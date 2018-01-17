import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import ReactModal from 'react-modal';
import { searchTextInSolr } from '../../../DataDiscovery/Api';
import Asset from './Asset';
import styles from './index.styl';
import './index.css';

const modalStyle = {
  content: {
    // top: '40%',
    // left: '20%',
    width: '50%',
    height: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
};

class SelectChartModal extends Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      chartAssets: props.chartAssets,
    };
  }

  componentDidMount() {
    this.getAllChartAssets();
  }

  componentWillReceiveProps(nextProps) {
    const { chartAssets } = nextProps;
    if (chartAssets !== this.props.chartAssets) {
      this.setState({ chartAssets });
    }
  }

  getAllChartAssets = () => {
    const urlParams = {
      query: 'assetType:CHART',
    };
    const apiData = {
      ...this.props.apiData,
      urlParams,
    };
    this.props.searchTextInSolr(apiData);
  };

  show = () => {
    this.setState({ open: true });
  };

  hide = () => {
    this.setState({ open: false });
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  handleAssetClick = data => {
    this.hide();
    this.props.onClick(data);
  };

  handleInputChange = ({ target }) => {
    const { value } = target;
    let chartAssets = [];
    if (!!value) {
      chartAssets = this.props.chartAssets
        .slice(0)
        .filter(asset => asset.assetName.toLowerCase().indexOf(value.toLowerCase()) === 0);
    } else {
      chartAssets = this.props.chartAssets;
    }
    this.setState({ chartAssets });
  };

  renderChartsList = () => {
    const { chartAssets } = this.state;
    return chartAssets.map(asset => <Asset data={asset} onClick={this.handleAssetClick} />);
  };

  render() {
    const { open } = this.state;
    return (
      <ReactModal style={modalStyle} isOpen={open} overlayClassName="ReactModal__Overlay">
        <div styleName="charts-list">
          <input
            type="text"
            styleName="input"
            name="search-input"
            placeholder="Search Chart Assets by name..."
            onChange={this.handleInputChange}
          />
          {this.renderChartsList()}
        </div>
      </ReactModal>
    );
  }
}

const propTypes = {
  apiData: PropTypes.object.isRequired,
  chartAssets: PropTypes.object,
  searchTextInSolr: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  chartModalRef: PropTypes.func.isRequired,
};
const defaultProps = {
  chartAssets: [],
};

const mapStateToProps = state => {
  const searchResult = state.dataDiscovery.searchResult;
  return {
    chartAssets: (searchResult && searchResult.assets) || [],
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      searchTextInSolr,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(
  cssModules(SelectChartModal, styles)
);
