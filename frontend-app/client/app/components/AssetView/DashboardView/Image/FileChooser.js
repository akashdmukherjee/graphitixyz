import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import cssModules from 'react-css-modules';
import styles from './fileChooser.styl';

const modalStyle = {
  content: {
    width: '50%',
    height: '30%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
};

class FileChooser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  show = () => {
    this.setState({ open: true });
  };

  hide = () => {
    this.setState({ open: false });
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const { open } = this.state;
    return (
      <ReactModal isOpen={open} style={modalStyle}>
        <div styleName="close" onClick={this.hide}>
          <i className="fa fa-times" />
          <span>esc</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              border: '1px solid #f26450',
              borderRadius: 3,
            }}
          >
            <label
              htmlFor="files"
              style={{
                textAlign: 'center',
                color: '#f26450',
                padding: '10px 15px',
                cursor: 'pointer',
                display: 'block',
              }}
            >
              Upload Image
            </label>
            <input id="files" style={{ display: 'none' }} type="file" />
          </div>
        </div>
      </ReactModal>
    );
  }
}

export default cssModules(FileChooser, styles);
