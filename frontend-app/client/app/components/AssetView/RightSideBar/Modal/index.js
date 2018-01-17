import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class Modal extends Component {
  static propTypes = {
    modalName: PropTypes.string,
    onClick: PropTypes.func,
    onClose: PropTypes.func,
    header: PropTypes.string,
    children: PropTypes.any,
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      fieldsChanged: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { open } = nextProps;
    if (open !== null || open !== undefined) {
      this.setState({ open });
    }
  }

  closeModal = () => {
    this.setState({ open: false });
    this.props.onClose();
  };

  render() {
    const { modalName, header } = this.props;

    return (
      <div styleName={this.state.open ? 'modal-show' : 'modal-hide'}>
        <div styleName="header">
          <h5 styleName="modal-name">
            <i className="fa fa-code" /> {modalName}
          </h5>
          <div styleName="close" onClick={this.closeModal}>
            <i className="fa fa-times" />
            <span>esc</span>
          </div>
        </div>
        <div styleName="container">
          <div styleName="content">
            <div styleName="content-header">
              <h5>{header}</h5>
            </div>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default cssModules(Modal, styles);
