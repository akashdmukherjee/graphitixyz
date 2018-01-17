import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './styledItemWithContextMenu.styl';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const style = {
  backgroundColor: '#fff',
  boxShadow: '0 1px 9px 1px rgba(0,0,0,.12), 0 1px 3px 0px hsla(0,0%,88%,.25)',
  borderRadius: 3,
  padding: 3,
  cursor: 'grab',
  position: 'relative',
  ...fullWidthHeight,
};

class StyledItemWithContextMenu extends Component {
  static propTypes = propTypes;
  constructor(props) {
    super(props);
    this.state = {
      showContextMenu: false,
    };
  }

  componentDidMount() {
    window.addEventListener('mousedown', this.handleContextMenuClose);
    window.addEventListener('click', this.handleContextMenuClose);
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.handleContextMenuClose);
    window.addEventListener('click', this.handleContextMenuClose);
  }

  handleContextMenuClose = e => {
    const { target } = e;
    if (this.itemWrapper && this.itemWrapper !== target && !this.itemWrapper.contains(target)) {
      this.setState({ showContextMenu: false });
    }
  };

  handleRightClick = e => {
    e.preventDefault();
    e.stopPropagation();
    const targetRect = findDOMNode(e.target).getBoundingClientRect();
    const { top, left } = targetRect;
    const { clientX, clientY } = e;
    this.setState({ top: clientY - top, left: clientX - left + 30, showContextMenu: true });
    // console.info(targetRect, { pageX, pageY, clientX, clientY });
  };

  handleContextMenuClick = (e, data) => {
    this.setState({ showContextMenu: false });
    this.props.onContextMenuItemClick(e, data);
  };

  setRef = _ref => {
    this.itemWrapper = _ref;
  };

  render() {
    const { children, item } = this.props;
    const { showContextMenu, top, left } = this.state;
    return (
      <div style={style} key={item.id} onContextMenu={this.handleRightClick} ref={this.setRef}>
        {children}
        <ul
          styleName="ContextMenu"
          style={{
            display: showContextMenu ? 'block' : 'none',
            top,
            left,
          }}
        >
          <li styleName="item" onClick={e => this.handleContextMenuClick(e, item)}>
            <i className="fa fa-trash-o" /> Delete
          </li>
        </ul>
      </div>
    );
  }
}

const propTypes = {
  children: PropTypes.any.isRequired,
  item: PropTypes.object.isRequired,
  onContextMenuItemClick: PropTypes.func.isRequired,
  onRightClick: PropTypes.func.isRequired,
};

export default cssModules(StyledItemWithContextMenu, styles);
