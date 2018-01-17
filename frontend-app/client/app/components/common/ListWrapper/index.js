/**
 * ListWrapper defines the structure and common behaviour
 * of a pop up List
 */
import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const caretPositions = {
  left: 'left',
  right: 'right',
  middle: 'middle',
};

class ListWrapper extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    children: PropTypes.any.isRequired,
    showCaret: PropTypes.bool,
    caretPosition: PropTypes.oneOf([
      caretPositions.left,
      caretPositions.right,
      caretPositions.middle,
    ]),
    style: PropTypes.object,
    onVisibilityChanged: PropTypes.func,
  };

  static defaultProps = {
    open: false,
    style: {},
    showCaret: true,
    caretPosition: 'right',
    onVisibilityChanged: () => null,
  };

  constructor(props) {
    super(props);
    const { open } = props;
    this.state = {
      open,
    };
  }

  componentDidMount() {
    window.addEventListener('click', this.onDOMClick);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  onDOMClick = event => {
    const { target } = event;
    if (
      this.listWrapper &&
      this.state.open &&
      this.listWrapper !== target &&
      !this.listWrapper.contains(target)
    ) {
      // on clicked away
      this.setState({ open: false }, () => {
        // tell the parent that visibility has changed
        this.props.onVisibilityChanged({ open: false });
      });
    }
  };

  open = () => {
    this.setState({ open: true });
  };

  hide = () => {
    this.setState({ open: false });
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const { style, caretPosition, children, showCaret } = this.props;
    const { open } = this.state;
    const caret = showCaret ? 'caret' : '';
    return (
      <div
        styleName={`ListWrapper${open ? '-open' : '-close'} ${caret} caret-${caretPosition}`}
        style={style}
        ref={_ref => {
          this.listWrapper = _ref;
        }}
      >
        {children}
      </div>
    );
  }
}

export default cssModules(ListWrapper, styles, { allowMultiple: true });
