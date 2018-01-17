import React from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import { updateObjectItem } from '../../../common/reduxHelpers';

class DropdownMenu extends React.Component {
  constructor(props) {
    super(props);

    const menus = this.props.menus.map((menu, id) => ({
      id,
      label: menu,
      active: id === 0,
    }));
    this.state = {
      expand: false,
      selectedItem: menus && menus.length ? menus[0] : null,
      menus,
    };

    this.onlabelClick = this.onlabelClick.bind(this);
    this.onMenuItemSelect = this.onMenuItemSelect.bind(this);
  }

  onlabelClick() {
    this.setState({ expand: !this.state.expand });
  }

  onMenuItemSelect(item) {
    const { onItemSelect } = this.props;
    const menus = this.state.menus.map(menu => {
      if (menu.active) {
        return { ...menu, active: false };
      }
      return menu;
    });
    onItemSelect(item);
    this.setState({
      selectedItem: item,
      expand: false,
      menus: updateObjectItem(menus, item),
    });
  }

  render() {
    const {
      label,
      inputType,
      inputName,
      inputValue,
      onTextChange,
      onInputFocus,
    } = this.props;
    const { menus, selectedItem, expand } = this.state;
    let selectedMenu;
    if (selectedItem && selectedItem.label) {
      selectedMenu = selectedItem.label;
    }
    return (
      <div styleName="dropdown-menu-wrapper">
        <h5>{label}</h5>
        {inputType
          ? <input
            type="text"
            placeholder="Search Authors"
            styleName="input-text"
            name={inputName}
            value={inputValue}
            onChange={onTextChange}
            onFocus={onInputFocus}
          />
          : <h3 onClick={this.onlabelClick}>
              {selectedMenu} <i className="fa fa-angle-down" />
            </h3>}

        <ul
          styleName="dropdown-menu-list"
          style={{ display: this.state.expand ? 'block' : 'none' }}
        >
          {menus.map((menu, id) => (
            <li
              key={`dropdown-menu-item-${id}`}
              styleName={
                menu.active ? 'dropdown-menu-item-active' : 'dropdown-menu-item'
              }
              onClick={() =>
                this.onMenuItemSelect({
                  id,
                  label: menu.label,
                  active: !menu.active,
                })}
            >
              {menu.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

DropdownMenu.propTypes = {
  menus: React.PropTypes.arrayOf(React.PropTypes.string),
  label: React.PropTypes.string.isRequired,
  placeholder: React.PropTypes.string,
  inputType: React.PropTypes.bool,
  inputName: React.PropTypes.string,
  inputValue: React.PropTypes.string,
  onInputFocus: React.PropTypes.func,
  onTextChange: React.PropTypes.func,
};

DropdownMenu.defaultProps = {
  placeholder: null,
  inputType: true,
  menus: [],
  onInputFocus: () => {},
};

export default cssModules(DropdownMenu, styles);
