import React from 'react';
import { findDOMNode } from 'react-dom';
import { connect as reduxConnect } from 'react-redux';
import { bindActionCreators } from 'redux';
import relatedAssets from '../Charts/relatedAssets';
import { getRelatedAssetsData } from '../Api';
import './treeDiagram.css';
class TreeDiagram extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      key: this.generateKey(),
      assetDetails: this.props.assetDetails,
      width: 0,
      height: 0,
    };
    this.relatedAssetsData = null;
  }

  componentDidMount() {
    const { assetDetails } = this.state;
    if (assetDetails && assetDetails.id) {
      this.callGetRelatedAssetsData(assetDetails.id);
    }

    // call dimensions calculation at last
    // after all of the rendering is done properly
    setTimeout(() => {
      const { width, height } = findDOMNode(this.svg).getBoundingClientRect();
      // console.info(width, height);
      this.setState({ width, height }, () => {
        if (this.relatedAssetsData) {
          this.reRenderTreeDiagram(this.relatedAssetsData);
        }
      });
    }, 0);
  }

  componentWillReceiveProps(nextProps) {
    const { relatedAssetsData, assetDetails } = nextProps;
    const { width, height } = this.state;
    if (relatedAssetsData !== this.props.relatedAssetsData) {
      this.relatedAssetsData = relatedAssetsData;
      if (width && height) {
        this.reRenderTreeDiagram(relatedAssetsData);
      }
    }
    if (assetDetails !== this.props.assetDetails) {
      const { id } = assetDetails;
      this.callGetRelatedAssetsData(id);
      // this.setState({ assetDetails });
    }
  }

  generateKey = () => {
    return Math.random().toString(16).slice(3, 10);
  };

  reRenderTreeDiagram(relatedAssetsData) {
    const { width, height } = this.state;
    // TODO: Improve the forceUpdate Logic
    this.setState(
      {
        key: this.generateKey(),
      },
      () => {
        const dom = findDOMNode(this.svg);
        relatedAssets(dom, {
          width,
          height,
          relatedAssetsData,
          onAssetNodeClick: this.onAssetNodeClick,
        });
      }
    );
  }

  callGetRelatedAssetsData = assetId => {
    const { apiData } = this.props;
    const data = {
      ...apiData,
      assetId,
    };
    // console.info(this.props, apiData, data);
    this.props.getRelatedAssetsData(data);
  };

  onAssetNodeClick = data => {
    this.callGetRelatedAssetsData(data.id);
  };

  render() {
    return (
      <div
        ref={_ref => {
          this.svg = _ref;
        }}
        id="related-assets"
        key={this.state.key}
        style={{
          transition: 'all 3s ease',
          width: '100%',
          height: '100%',
        }}
      />
    );
  }
}

TreeDiagram.propTypes = {
  title: React.PropTypes.string,
  treeData: React.PropTypes.array,
};

const mapStateToProps = state => {
  // console.info(state);
  return {
    assetDetails: state.dataAssetView.assetDetails,
    relatedAssetsData: state.dataAssetView.relatedAssetsData,
    assetId: state.dataAssetView.assetId,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getRelatedAssetsData,
    },
    dispatch
  );
export default reduxConnect(mapStateToProps, mapDispatchToProps)(TreeDiagram);
