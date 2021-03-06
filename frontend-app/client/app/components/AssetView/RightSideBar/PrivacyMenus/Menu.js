import React from 'react';
import './menu.css';

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

const Menu = (props) => {
  const {
    onClick,
    children,
    iconName,
    text,
    subtext,
    style,
    seperator,
  } = props;
  let customStyle;
  if (seperator) {
    customStyle = Object.assign({}, style, { borderBottom: '1px solid rgb(224, 224, 224)' });
  }
  return (
    <li className="PrivacyMenu">
      <div className="icons">
        <span><i className="fa fa-check"></i></span>
        <span className="type"><i className={`fa ${iconName}`}></i></span>
      </div>
      <div className="description">
        <h5 className="text">{text}</h5>
        <h5 className="subtext">{subtext}</h5>
      </div>
    </li>
  );
};

Menu.propTypes = {
  link: React.PropTypes.string,
  text: React.PropTypes.string.isRequired,
  style: React.PropTypes.object,
  seperator: React.PropTypes.bool,
  fileInput: React.PropTypes.bool,
  textButton: React.PropTypes.bool,
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
