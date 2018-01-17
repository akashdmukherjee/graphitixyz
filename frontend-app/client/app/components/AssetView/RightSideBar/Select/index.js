import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class Select extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      selectedItem: props.items
        ? props.items.filter(item => item.selected)[0]
        : [],
    };
  }

  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this);
    window.addEventListener('click', this.onDOMClick);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  onDOMClick = event => {
    if (this.element !== event.target && !this.element.contains(event.target)) {
      this.onClickedAway();
    }
  };

  onClickedAway = () => {
    this.setState({ open: false });
  };

  onSelectorClick = () => {
    this.setState({ open: !this.state.open });
  };

  onOptionSelect = item => {
    if (this.state.selectedItem.text !== item.text) {
      this.props.onOptionSelect(item);
    }
    this.setState({
      selectedItem: item,
      open: false,
    });
  };

  render() {
    const { items } = this.props;
    const { open, selectedItem } = this.state;

    if (!items || !items.length) {
      return null;
    }

    return (
      <div styleName="Select-wrapper">
        <div styleName="selector" onClick={this.onSelectorClick}>
          <h5>{selectedItem.text}</h5>
          <i className="icon-arrow-down" />
        </div>
        <ul styleName={open ? 'options-show' : 'options-hide'}>
          {items.map(item => (
            <li styleName="option" onClick={() => this.onOptionSelect(item)}>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default cssModules(Select, styles);
