import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import cssModules from 'react-css-modules';
import styles from './index.styl';

class SearchableInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputWidth: 15,
      inputValue: null,
      menuListPositionTop: null,
    };
  }

  onChangeText = event => {
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

  renderFilteredList = () => {
    const {
      dataSource,
      onChangeText,
      text,
      onUserSelect,
      name,
      focused,
    } = this.props;
    const { menuListPositionTop } = this.state;

    const filteredData = dataSource.filter(
      data =>
        data.name.toLowerCase().indexOf(text.trim().toLowerCase()) !== -1 ||
        // Get domain for org
        // replace it so that we can search only on username
        data.email
          .replace(/@graphiti.xyz/i, '')
          .toLowerCase()
          .indexOf(text.trim().toLowerCase()) !== -1
    );

    let style = {};
    if (menuListPositionTop) {
      style = {
        top: menuListPositionTop,
      };
    }

    if (filteredData.length) {
      return (
        <ul styleName={text.length ? 'show-list' : 'hide-list'} style={style}>
          {filteredData.map(user => (
            <li
              key={user.email || user.name}
              onClick={() => onUserSelect(name, user)}
            >
              <h5 styleName="username">{user.name}</h5>
              <h5 styleName="email">{user.email}</h5>
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };

  render() {
    const {
      dataSource,
      onChangeText,
      text,
      onUserSelect,
      name,
      focused,
    } = this.props;
    const { inputWidth } = this.state;

    if (focused) {
      this.refs[name].focus();
    }

    return (
      <div styleName="SearchableInput-wrapper">
        <input
          value={text}
          name={name}
          ref={name}
          onChange={this.onChangeText}
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
