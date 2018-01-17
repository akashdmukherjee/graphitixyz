import React, { Component } from 'react';
import './menu.css';
import './';

const Styles = {
  arrowRight: {
    position: 'absolute',
    color: '#777777',
    right: 5,
    top: '30%',
    width: 12,
    height: 12,
  },
};

class Menu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputDisabled: true,
      text: props.text,
    };
  }
  onEditIconClick = event => {
    // console.log(event.target);
    this.setState({ inputDisabled: false }, () => {
      this.menuInput.focus();
    });
    // event.nativeEvent.stopImmediatePropagation();
  };

  onInputChange = event => {
    this.setState({ text: event.target.value });
  };

  // This is to track if Enter key is pressed
  onKeyPress = event => {
    if (event.keyCode === 13) {
      this.menuInput.blur();
    }
  };

  updateField = () => {
    // Creating a new Object by merging 2 objects
    this.props.onMenuUpdate(
      Object.assign({}, this.props.data, { text: this.state.text })
    );
  };

  render() {
    const {
      link,
      onClick,
      children,
      text,
      style,
      data,
      seperator,
      textButton,
      editable,
      fileInput,
    } = this.props;
    const { inputDisabled } = this.state;
    let customStyle;
    if (seperator) {
      customStyle = Object.assign({}, style, {
        borderBottom: '1px solid rgb(224, 224, 224)',
      });
    }
    return (
      <li className={textButton ? 'Menu btn' : 'Menu'}>
        {!fileInput && !editable
          ? <a
            href={link}
            onClick={() => onClick(data || text)}
            className={textButton ? 'Menu-link-btn' : 'Menu-link'}
            style={customStyle}
          >
              {text}
            </a>
          : editable
              ? <span>
                  <input
                    disabled={inputDisabled}
                    ref={_ref => this.menuInput = _ref}
                    value={this.state.text}
                    onChange={this.onInputChange}
                    onKeyDown={this.onKeyPress}
                    onBlur={this.updateField}
                  />
                  <i
                    className="fa fa-pencil-square-o"
                    style={Styles.arrowRight}
                    onClick={this.onEditIconClick}
                  />
                </span>
              : <label className="Menu-file-input" htmlFor="csv-input">
                  {text}
                  <input type="file" name="csv-input" id="csv-input" />
                </label>}
        {children
          ? <i className="fa fa-caret-right" style={Styles.arrowRight} />
          : null}
        {children}
      </li>
    );
  }
}

Menu.propTypes = {
  link: React.PropTypes.string,
  text: React.PropTypes.string.isRequired,
  style: React.PropTypes.object,
  seperator: React.PropTypes.bool,
  fileInput: React.PropTypes.bool,
  textButton: React.PropTypes.bool,
  data: React.PropTypes.object,
  children: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object,
    React.PropTypes.func,
  ]),
  onClick: React.PropTypes.func,
};

Menu.defaultProps = {
  link: '#',
  seperator: false,
  fileInput: false,
  textButton: false,
  onClick: value => console.info(value),
  children: null,
  style: null,
};

export default Menu;
