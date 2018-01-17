import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const propTypes = {
  dataSource: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  ),
  name: PropTypes.string.isRequired,
  focused: PropTypes.bool,
  text: PropTypes.string,
  filterAlgorithm: PropTypes.func,
  transformLabel: PropTypes.func,
  onChangeText: PropTypes.func,
  onUserSelect: PropTypes.func,
  onItemSelect: PropTypes.func,
};

const defaultProps = {
  dataSource: [],
  focused: false,
  text: '',
  onChangeText: () => null,
  onUserSelect: () => null,
  filterAlgorithm: null,
  onItemSelect: () => null,
  transformLabel: () => null,
};

class SearchableInput extends React.Component {
  static propTypes = propTypes;
  static defaultProps = defaultProps;

  constructor(props) {
    super(props);
    this.state = {
      inputWidth: 15,
      inputValue: '',
      menuListPositionTop: null,
      dataSource: props.dataSource,
    };
  }

  componentDidMount() {
    const { name, focused } = this.props;
    if (focused) {
      this.refs[name].focus();
    }
  }

  componentWillReceiveProps(nextProps) {
    const { dataSource } = nextProps;
    if (dataSource !== this.props.dataSource) {
      this.setState({ dataSource });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { focused } = this.state;
    const { name } = this.props;
    if (focused) {
      this.refs[name].focus();
    }
  }

  handleChangeText = event => {
    const targetValue = event.target.value;
    const inputNode = ReactDOM.findDOMNode(this.refs[event.target.name]);
    const inputPosition = inputNode.getBoundingClientRect();
    const menuListPositionTop = inputPosition.top + inputPosition.height;
    const { inputValue, inputWidth } = this.state;
    const object = {
      inputWidth,
      inputValue: targetValue,
      menuListPositionTop,
    };
    if (inputValue !== targetValue && targetValue.length) {
      object.inputWidth = (targetValue.length + 1) * 8;
    }
    this.setState(object);
    this.props.onChangeText(event);
  };

  handleItemSelect = (name, user) => {
    const { onUserSelect } = this.props;
    this.refs[name].focus();
    this.setState({ inputValue: '' });
    onUserSelect(name, user);
  };

  renderFilteredList = () => {
    const {
      text,
      onUserSelect,
      name,
      filterAlgorithm,
      onItemSelect,
      transformLabel,
    } = this.props;
    const { menuListPositionTop, dataSource } = this.state;

    let filteredData;

    if (filterAlgorithm) {
      filteredData = dataSource.filter(data => filterAlgorithm(data, text));
    } else {
      filteredData = dataSource.filter(
        data =>
          data.name.toLowerCase().indexOf(text.trim().toLowerCase()) !== -1 ||
          // Get domain for org
          // replace it so that we can search only on username
          data.email
            .replace(/@graphiti.xyz/i, '')
            .toLowerCase()
            .indexOf(text.trim().toLowerCase()) !== -1
      );
    }

    let style = {};
    if (menuListPositionTop) {
      style = {
        top: menuListPositionTop,
      };
    }
    // TODO: for now make this backward compatible
    // this is referred in TeamManagement Autocomplete
    if (filteredData.length && !filterAlgorithm) {
      return (
        <ul styleName={text.length ? 'show-list' : 'hide-list'} style={style}>
          {filteredData.map(user => (
            <li
              key={user.email}
              onClick={() => this.handleItemSelect(name, user)}
            >
              <h5 styleName="username">{user.name}</h5>
              <h5 styleName="email">{user.email}</h5>
            </li>
          ))}
        </ul>
      );
    }
    if (filteredData.length) {
      return (
        <ul styleName={text.length ? 'show-list' : 'hide-list'} style={style}>
          {filteredData.map(data => {
            const dataText =
              transformLabel(data) ||
              data.name ||
              data.text ||
              data.label ||
              data;
            return (
              <li key={dataText} onClick={() => onItemSelect(name, data)}>
                <h5 styleName="text">{dataText}</h5>
              </li>
            );
          })}
        </ul>
      );
    }
    return null;
  };

  render() {
    const { name } = this.props;
    const { inputWidth, inputValue } = this.state;

    return (
      <div styleName="SearchableInput-wrapper">
        <input
          value={inputValue}
          name={name}
          ref={name}
          onChange={this.handleChangeText}
          style={{
            width: inputWidth,
          }}
        />
        {this.renderFilteredList()}
      </div>
    );
  }
}

export default cssModules(SearchableInput, styles);
