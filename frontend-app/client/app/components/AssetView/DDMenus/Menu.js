import React from 'react';
import './menu.css';

const Styles = {
  arrowRight: {
    position: 'absolute',
    right: 10,
    top: '12%',
    fontSize: 24,
    color: '#5d5d5d',
  },
};

const Menu = (props) => {
  const {
    link,
    onClick,
    children,
    text,
    style,
  } = props;
  return (
    <li className="Menu">
      <a
        href={link}
        onClick={() => onClick(text)}
        className="Menu-link"
        style={style}
      >
        {text}
      </a>
      {children ? <i className="fa fa-caret-right" style={Styles.arrowRight} /> : null}
      {children}
    </li>
  );
};

Menu.propTypes = {
  link: React.PropTypes.string,
  text: React.PropTypes.string.isRequired,
  style: React.PropTypes.object,
  children: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object,
    React.PropTypes.func,
  ]),
  onClick: React.PropTypes.func,
};

Menu.defaultProps = {
  link: '#',
  onClick: value => console.info(value),
  children: null,
  style: null,
};

export default Menu;
