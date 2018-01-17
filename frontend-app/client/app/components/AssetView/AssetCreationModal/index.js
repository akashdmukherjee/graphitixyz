import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import './reactModal.css';
import SQLAssetView from '../SQLAssetView';
import Timeline from '../../common/Timeline';

const sourceOptions = {
  GRAPHITI: 'GRAPHITI',
  EXTERNAL: 'EXTERNAL',
};

const propTypes = {
  assetId: PropTypes.string.isRequired,
  apiData: PropTypes.object.isRequired,
  isNewAsset: PropTypes.string.isRequired,
  uploadAssetFile: PropTypes.func.isRequired,
  onSaveClick: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
};

class AssetCreationModal extends Component {
  static propTypes = propTypes;
  constructor(props) {
    super(props);
    this.state = {
      open: true,
      activeCheckPointIndex: 0,
      fileButtonClicked: false,
      showFixedLayer: true,
    };
  }

  handleFileSelect = e => {
    const { onFileSelect } = this.props;
    onFileSelect(e);
    this.setState({ open: false });
  };

  handleSaveClick = data => {
    const { onSaveClick } = this.props;
    onSaveClick(data);
    this.setState({ open: false });
  };

  handleFileClick = () => {
    this.setState({ fileButtonClicked: true });
  };

  handleSwitchClick = () => {
    this.setState({ showFixedLayer: false });
  };

  handleSourceSelection = selectedOption => {
    if (selectedOption === sourceOptions.GRAPHITI) {
      this.handleSwitchClick();
    }
  };

  render() {
    const { open, showFixedLayer, activeCheckPointIndex } = this.state;
    const { styles, onSaveClick, ...restProps } = this.props;
    return (
      <ReactModal isOpen={open} overlayClassName="ReactModal__Overlay">
        <div styleName="modal-content">
          <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}>
            <Timeline
              checkPoints={[
                { text: 'Select Source Type' },
                { text: 'Connection' },
                { text: 'Create SQL' },
              ]}
              width={800}
              activeCheckPointIndex={activeCheckPointIndex}
            />
          </div>
          <div styleName="AssetCreationModal-wrapper">
            {activeCheckPointIndex === 1 && showFixedLayer ? <div styleName="fixed-layer" /> : null}
            {activeCheckPointIndex === 0 ? this.renderSourceSelector() : null}
            {activeCheckPointIndex === 1
              ? <SQLAssetView
                {...restProps}
                usingInModal
                onSourceSelection={this.handleSourceSelection}
                onSaveClick={this.handleSaveClick}
                onSwitchClick={this.handleSwitchClick}
              />
              : null}
          </div>
        </div>
      </ReactModal>
    );
  }

  renderSourceSelector() {
    const { fileButtonClicked } = this.state;
    return (
      <div styleName="SourceSelector">
        {fileButtonClicked
          ? <div styleName="upload-btns">
              <div styleName="upload-btn" onClick={this.handleFileClick}>
                <label htmlFor="csv-input" styleName="uploader">
                  <input
                    type="file"
                    name="csv-input"
                    id="csv-input"
                    onChange={this.handleFileSelect}
                  />
                </label>
                <div styleName="image csv" />
                <h5 styleName="btn-text">CSV</h5>
              </div>
              <div styleName="upload-btn" onClick={this.handleFileClick}>
                <div styleName="image xls" />
                <h5 styleName="btn-text">XLS</h5>
              </div>
              <div styleName="upload-btn" onClick={this.handleFileClick}>
                <div styleName="image drive" />
                <h5 styleName="btn-text">GOOGLE SPREADSHEET</h5>
              </div>
            </div>
          : <div styleName="selector-btns">
              <div styleName="btn" onClick={() => this.setState({ activeCheckPointIndex: 1 })}>
                <div styleName="image sql" />
                <h5 styleName="btn-text">SQL</h5>
              </div>
              <div styleName="btn" onClick={this.handleFileClick}>
                <div styleName="image file" />
                <h5 styleName="btn-text">FILES</h5>
              </div>
            </div>}
      </div>
    );
  }
}

export default cssModules(AssetCreationModal, styles, { allowMultiple: true });
