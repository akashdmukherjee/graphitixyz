import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class Select extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    style: PropTypes.object,
    renderItemLabel: PropTypes.func,
    onOptionSelect: PropTypes.func,
  };

  static defaultProps = {
    style: {},
    onOptionSelect: () => null,
    renderItemLabel: item => item.text,
  };

  constructor(props) {
    super(props);
    const selectItems = this.constructSelectItems(props.items);
    this.state = {
      open: false,
      selectedItem: selectItems[0],
      items: selectItems,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { items } = nextProps;
    if (items !== this.props.items) {
      const selectItems = this.constructSelectItems(items);
      this.setState({ items: selectItems, selectedItem: selectItems[0] });
    }
  }

  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this);
    window.addEventListener('click', this.onDOMClick);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  constructSelectItems = items => {
    const itemsSlice = items.slice(0);
    return itemsSlice.map(item => ({
      ...item,
      selected: false,
    }));
  };

  onDOMClick = event => {
    if (this.element !== event.target && !this.element.contains(event.target)) {
      this.onClickedAway();
    }
  };

  onClickedAway = () => {
    this.setState({ open: false });
  };

  onSelectorClick = e => {
    this.setState({ open: !this.state.open });
    e.nativeEvent.stopImmediatePropagation();
  };

  onOptionSelect = item => {
    this.props.onOptionSelect(item);
    this.setState({
      selectedItem: item,
      open: false,
    });
  };

  render() {
    const { open, selectedItem, items } = this.state;
    const { renderItemLabel, style } = this.props;

    if (!items || !items.length) {
      return null;
    }

    return (
      <div styleName="Select-wrapper" style={style}>
        <div styleName="selector" onClick={this.onSelectorClick}>
          <h5>
            {renderItemLabel(selectedItem)}
          </h5>
          <i className="icon-arrow-down" />
        </div>
        <ul styleName={open ? 'options-show' : 'options-hide'}>
          {items.map((item, index) =>
            <li
              key={item.text}
              styleName="option"
              onClick={() => this.onOptionSelect({ ...item, index })}
            >
              {renderItemLabel(item)}
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default cssModules(Select, styles);
