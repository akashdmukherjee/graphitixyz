import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import './reactModal.css';
import Button from '../../../common/Button';

const modalStyle = {
  content: {
    // top: '40%',
    // left: '20%',
    width: '50%',
    height: '30%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
};

const propTypes = {
  open: PropTypes.bool.isRequired,
  apiData: PropTypes.object.isRequired,
  callGetQueryData: PropTypes.func.isRequired,
  onAssetNameEntered: PropTypes.func.isRequired,
  sqlAssetId: PropTypes.string.isRequired,
  createdDataSet: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

class DataAssetCreationModal extends Component {
  static propTypes = propTypes;

  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
      sqlAssetId: props.sqlAssetId,
      createdDataSet: props.createdDataSet,
      isAssetCreating: false,
    };
    this.assetName = '';
  }

  componentWillReceiveProps(nextProps) {
    const { open, createdDataSet } = nextProps;
    if (open !== this.props.open) {
      this.setState({ open });
    }
    if (createdDataSet !== this.props.createdDataSet) {
      this.setState({ createdDataSet, isAssetCreating: false });
    }
  }

  handleAssetNameEntered = () => {
    // console.info(assetName);
    this.setState({ isAssetCreating: true });
    this.props.onAssetNameEntered(this.assetName);
  };

  handleInputChange = ({ target }) => {
    this.assetName = target.value;
  };

  closeModal = () => {
    this.setState({ open: false });
    this.props.onClose();
  };

  showModal = () => {
    this.setState({ open: true });
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const { open, createdDataSet, isAssetCreating } = this.state;
    return (
      <ReactModal
        style={modalStyle}
        onAfterOpen={this.handleModalMount}
        isOpen={open}
        overlayClassName="ReactModal__Overlay"
      >
        <div styleName="close" onClick={this.closeModal}>
          <i className="fa fa-times" />
          <span>esc</span>
        </div>
        <div styleName="modal-content">
          <div styleName="inputs">
            <input
              type="text"
              name="dataSetName"
              styleName="dataSetName"
              placeholder="Enter DataSet asset name"
              onBlur={this.handleInputChange}
              onChange={this.handleInputChange}
            />
            <Button text="Save" styleClassName="btn-fav" onClick={this.handleAssetNameEntered} />
            <div styleName="msg">
              {createdDataSet.dataSetAssetId
                ? <h5 styleName="status">
                    Your DataSet has been created.{' '}
                    <a
                      target="_blank"
                      href={`${window.location.origin}/asset/${createdDataSet.dataSetAssetId}`}
                    >
                      View/Edit DataSet
                    </a>
                  </h5>
                : null}
              {isAssetCreating ? <h5 styleName="status">Creating DataSet...</h5> : null}
            </div>
          </div>
        </div>
      </ReactModal>
    );
  }
}

export default cssModules(DataAssetCreationModal, styles, { allowMultiple: true });
