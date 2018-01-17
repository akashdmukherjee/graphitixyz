import React from 'react';
import ReactDOM from 'react-dom';
import Menu from './Menu';
import SubMenus from './SubMenus';
import { WrappedComponent, TriggerComponent } from './HelperComponents';
import './menus.css';

class Menus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };

    this.onDOMClick = this.onDOMClick.bind(this);
    this.onClickedAway = this.onClickedAway.bind(this);
    this.toggleMenus = this.toggleMenus.bind(this);
  }

  componentDidMount() {
    this.element = ReactDOM.findDOMNode(this);
    window.addEventListener('click', this.onDOMClick);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDOMClick);
  }

  onDOMClick(event) {
    if (this.element !== event.target && !this.element.contains(event.target)) {
      this.onClickedAway();
    }
  }

  onClickedAway() {
    this.setState({ visible: false });
  }

  toggleMenus() {
    this.setState({ visible: !this.state.visible });
  }

  render() {
    const {
      list,
      children,
      wrapperStyle,
      menusWrapperStyle,
      style,
      label,
      className,
      triggerComponent,
    } = this.props;
    return (
      <div
        className={`NewAssetMenus-wrapper ${className}`}
        style={wrapperStyle}
      >
        <WrappedComponent
          toggleMenus={this.toggleMenus}
          component={triggerComponent}
          label={label}
        />
        <div
          className={`${this.state.visible ? 'show' : 'hide'}`}
          style={menusWrapperStyle}
        >
          <SubMenus list={list} style={style}>
            {children}
          </SubMenus>
        </div>
      </div>
    );
  }
}

Menus.propTypes = {
  list: React.PropTypes.bool,
  label: React.PropTypes.string,
  className: React.PropTypes.string,
  style: React.PropTypes.object,
  triggerComponent: React.PropTypes.func,
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.func,
    React.PropTypes.arrayOf(Menu),
  ]).isRequired,
};

Menus.defaultProps = {
  list: true,
  style: null,
  label: null,
  triggerComponent: TriggerComponent,
  className: '',
};

export default Menus;
