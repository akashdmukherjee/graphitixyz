import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import './reactModal.css';
import DataAssetView from '../../DataAssetView';
import RightSideBar from '../../RightSideBar';
import injestionOperationTypes from '../../injestionOperationTypes';

const propTypes = {
  open: PropTypes.bool.isRequired,
  apiData: PropTypes.object.isRequired,
  callGetQueryData: PropTypes.func.isRequired,
  onAssetNameEntered: PropTypes.func.isRequired,
  sqlAssetId: PropTypes.string.isRequired,
};

class DataAssetViewModal extends Component {
  static propTypes = propTypes;
  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
      showFixedLayer: true,
      sqlAssetId: props.sqlAssetId,
    };
  }
  componentWillReceiveProps(nextProps) {
    const { open } = nextProps;
    if (open !== this.props.open) {
      this.setState({ open });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextState.open !== this.state.open ||
      nextState.showFixedLayer !== this.state.showFixedLayer
    ) {
      return true;
    }
    return false;
  }

  handleModalMount = () => {
    // this is just a hacky solution
    // check mapStateToProps of RightSideBar
    // input automotacilly loses focus after the last render
    setTimeout(() => {
      this.dataAssetViewModalRightSidebar.getWrappedInstance().makeAssetNameEditable();
    }, 1600);
  };

  handleAssetNameEntered = assetName => {
    // console.info(assetName);
    this.dataAssetViewModalRightSidebar.getWrappedInstance().makeAssetNameUneditable();
    this.setState({ showFixedLayer: false });
    this.props.onAssetNameEntered(assetName);
  };

  render() {
    const { open, showFixedLayer } = this.state;
    const { apiData } = this.props;
    return (
      <ReactModal
        onAfterOpen={this.handleModalMount}
        isOpen={open}
        overlayClassName="ReactModal__Overlay"
      >
        {showFixedLayer ? <div styleName="fixed-layer" /> : null}
        <div styleName="modal-content">
          <div styleName="DataAssetViewCreationModal-wrapper">
            <div styleName="content">
              <DataAssetView
                apiData={apiData}
                onSaveClick={this.handleSaveClick}
                onSwitchClick={this.handleSwitchClick}
              />
            </div>
            <RightSideBar
              ref={_ref => {
                this.dataAssetViewModalRightSidebar = _ref;
              }}
              onAssetNameEntered={this.handleAssetNameEntered}
              isNewAsset
              usingInModal
            />
          </div>
        </div>
      </ReactModal>
    );
  }
}

export default cssModules(DataAssetViewModal, styles, { allowMultiple: true });
