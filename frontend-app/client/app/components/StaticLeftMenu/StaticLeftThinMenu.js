// Static Left Menu component

import React from 'react';
import cssModules from 'react-css-modules';
import style from './static-left-menu.styl';
import { connect as reduxConnect } from 'react-redux';
import { switchLeftMenu, toggleStaticLeftMenuStretched } from './StaticLeftMenuActions';
import { collapseMenus } from '../Home/HomeActions';
import { sizesRecalc } from '../../common/sizesRecalc';
import { collapsibleLeftMenuWidth, collapsibleRightMenuWidth } from '../../common/vars';

const StaticLeftThinMenu = (props) => {
  const {
    dispatchSwitchLeftMenu,
    visible,
    collapsibleMenus,
    toggleStaticLeftMenuStretched,
    staticLeftMenuStretched,
    dispatchCollapseMenus,
    dispatchToggleStaticLeftMenuStretched,
  } = props;
  const handleMenuSwitch = (type) => {

    if (!collapsibleMenus.left) {
      dispatchCollapseMenus({ left: true });
      sizesRecalc.adjust(
        collapsibleLeftMenuWidth,
        collapsibleMenus.right ? collapsibleRightMenuWidth : 0
      );
    }
    dispatchSwitchLeftMenu(type);
  };
  const handleMenuHover = (type) => {
    if (!staticLeftMenuStretched) {
        //dispatchToggleStaticLeftMenuStretched(true);
    }

  };

  return (
    <div
      styleName="static-left-menu"
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div styleName="static-left-menu-logo">
        <span>g</span>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('search')}
        onMouseOver={() => handleMenuSwitch('search')}
      >
        <i className="fa fa-search"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('pills')}
        onMouseOver={() => handleMenuSwitch('pills')}
      >
        <i className="fa fa-database" aria-hidden="true"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('blocks')}
        onMouseOver={() => handleMenuSwitch('blocks')}
      >
        <i className="fa fa-cube" aria-hidden="true"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('layers')}
        onMouseOver={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-paperclip" aria-hidden="true"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('layers')}
        onMouseOver={() => handleMenuSwitch('layers')}
      >
        <i className="icon-layers"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('layers')}
        onMouseOver={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-film" aria-hidden="true"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('layers')}
        onMouseOver={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-paint-brush" aria-hidden="true"></i>
      </div>
      <div
        styleName="menu-left-static-button"
        onMouseOver={() => handleMenuHover('layers')}
        onMouseOver={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-hand-pointer-o" aria-hidden="true"></i>
      </div>
    </div>
  );
};

StaticLeftThinMenu.propTypes = {
  dispatchSwitchLeftMenu: React.PropTypes.func.isRequired,
  dispatchCollapseMenus: React.PropTypes.func.isRequired,
  visible: React.PropTypes.bool.isRequired,
  collapsibleMenus: React.PropTypes.object.isRequired,
  staticLeftMenuStretched: React.PropTypes.bool.isRequired,
  dispatchToggleStaticLeftMenuStretched: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  collapsibleMenus: state.collapsibleMenus,
  staticLeftMenuStretched: state.staticLeftMenuStretched,
});
const mapDispatchToProps = (dispatch) => ({
  dispatchSwitchLeftMenu: (activeMenu) => dispatch(switchLeftMenu(activeMenu)),
  dispatchCollapseMenus: (menus) => dispatch(collapseMenus(menus)),
  dispatchToggleStaticLeftMenuStretched: (staticLeftMenuStretched) => dispatch(toggleStaticLeftMenuStretched(staticLeftMenuStretched)),
});

export default reduxConnect(mapStateToProps, mapDispatchToProps)(cssModules(StaticLeftThinMenu, style));
