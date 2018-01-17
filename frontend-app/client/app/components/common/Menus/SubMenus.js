import React from 'react';
import Menu from './Menu';
import './menus.css';

const SubMenus = (props) => {
  const {
    list,
    children,
    style,
    className,
  } = props;
  let MenuList = (
    <ul
      className={`Menus ${className}`}
      style={style}
    >
      {children}
    </ul>
  );

  if (!list) {
    MenuList = (
      <div
        className={`Menus ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }
  return MenuList;
};


SubMenus.propTypes = {
  list: React.PropTypes.bool,
  label: React.PropTypes.string,
  style: React.PropTypes.object,
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.func,
    React.PropTypes.arrayOf(Menu),
  ]).isRequired,
};

SubMenus.defaultProps = {
  list: true,
  style: null,
  label: null,
};

export default SubMenus;
