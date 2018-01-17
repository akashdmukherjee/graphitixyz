// Static Left Menu component

import React from 'react';
import cssModules from 'react-css-modules';
import style from './static-left-menu.styl';
import { connect as reduxConnect } from 'react-redux';
import { switchLeftMenu, toggleStaticLeftMenuStretched } from './StaticLeftMenuActions';
import { collapseMenus } from '../Home/HomeActions';
import { sizesRecalc } from '../../common/sizesRecalc';
import { collapsibleLeftMenuWidth, collapsibleRightMenuWidth } from '../../common/vars';

const StaticLeftFatMenu = (props) => {
  const {
    dispatchSwitchLeftMenu,
    visible,
    collapsibleMenus,
    dispatchCollapseMenus,
    toggleStaticLeftMenuStretched,
    staticLeftMenuStretched,
  } = props;
  const handleMenuSwitch = (type) => {
    console.log("SHOW THIN MENU ---- ");
    if (staticLeftMenuStretched.stretched) {
        console.log("SHOW THIN MENU");
        dispatchToggleStaticLeftMenuStretched(false);
    }
  };

  return (
    <div
      styleName="static-left-menu-fat"
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div styleName="static-left-menu-logo">
        <span>g</span>
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('search')}
      >
        <i className="fa fa-search"></i>
        search
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('pills')}
      >
        <i className="fa fa-database" aria-hidden="true"></i>
         data sources
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('blocks')}
      >
        <i className="fa fa-cube" aria-hidden="true"></i>
        materials
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-paperclip" aria-hidden="true"></i>
        supplements
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('layers')}
      >
        <i className="icon-layers"></i>
        layers
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-film" aria-hidden="true"></i>
        scenes
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-paint-brush" aria-hidden="true"></i>
        styling
      </div>
      <div
        styleName="menu-left-fat-static-button"
        onClick={() => handleMenuSwitch('layers')}
      >
        <i className="fa fa-hand-pointer-o" aria-hidden="true"></i>
        interactions
      </div>
    </div>
  );
};

StaticLeftFatMenu.propTypes = {
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

export default reduxConnect(mapStateToProps, mapDispatchToProps)(cssModules(StaticLeftFatMenu, style));
