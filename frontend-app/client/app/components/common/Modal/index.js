import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class Modal extends Component {
  static propTypes = {
    modalName: PropTypes.string,
    showHeader: PropTypes.bool,
    header: PropTypes.string,
    headerButtonText: PropTypes.string,
    children: PropTypes.any,
    open: PropTypes.bool,
    style: PropTypes.object,
    onClick: PropTypes.func,
    onModalMount: PropTypes.func,
    onClose: PropTypes.func,
    onHeaderButtonClick: PropTypes.func,
  };

  static defaultProps = {
    showHeader: true,
    open: false,
    style: {},
    onClick: () => null,
    onModalMount: () => null,
    onClose: () => null,
    onHeaderButtonClick: () => null,
  };

  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
      fieldsChanged: false,
    };
  }

  componentDidMount() {
    const { onModalMount } = this.props;
    onModalMount && onModalMount();
  }

  componentWillReceiveProps(nextProps) {
    const { open, fieldsChanged } = nextProps;
    const object = {};
    if (open !== this.props.open) {
      object.open = open;
    }
    if (fieldsChanged !== this.props.fieldsChanged) {
      object.fieldsChanged = fieldsChanged;
    }
    this.setState(object);
  }

  closeModal = e => {
    this.setState({ open: false });
    this.props.onClose();
  };

  render() {
    const {
      modalName,
      showHeader,
      header,
      style,
      headerButtonText,
      onHeaderButtonClick,
    } = this.props;

    return (
      <div
        styleName={this.state.open ? 'modal-show' : 'modal-hide'}
        style={style}
        onClick={e => {
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
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
            {showHeader
              ? <div styleName="content-header">
                  <h5>{header}</h5>
                  {headerButtonText
                    ? <button
                      styleName={
                          this.state.fieldsChanged
                            ? 'header-btn-active'
                            : 'header-btn-disabled'
                        }
                      onClick={onHeaderButtonClick}
                    >
                        {headerButtonText}
                      </button>
                    : null}
                </div>
              : null}
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default cssModules(Modal, styles);
