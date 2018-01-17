// Static Top Menu component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './top-menu.styl';
import { connect as reduxConnect } from 'react-redux';
import { compressBlock } from '../Object/ObjectActions';
import {
  collapseMenus,
  toggleViewRatio,
  toggleFullScreen,
  callDevResetData,
} from '../Home/HomeActions';
import { switchSlide } from '../CollapsibleLeftMenu/CollapsibleLeftMenuActions';
import { sizesRecalc } from '../../common/sizesRecalc';
import { collapsibleLeftMenuWidth, collapsibleRightMenuWidth } from '../../common/vars';
import GridStepSwitcher from '../GridStepSwitcher/GridStepSwitcher';

const TopMenu = (props) => {
  const {
    collapsibleMenus,
    visible,
    leftMenuLayers,
  } = props;
  const handleToggleLeftMenu = () => {
    let leftState;
    if (collapsibleMenus.left) {
      props.collapseMenus({ left: false });
      leftState = 0;
    } else {
      props.collapseMenus({ left: true });
      leftState = collapsibleLeftMenuWidth;
    }
    sizesRecalc.adjust(
      leftState,
      collapsibleMenus.right ? collapsibleRightMenuWidth : 0
    );
  };
  // const handleToggleRightMenu = () => {
  //   let rightState;
  //   if (collapsibleMenus.right) {
  //     props.collapseMenus({ right: false });
  //     rightState = 0;
  //   } else {
  //     props.collapseMenus({ right: true });
  //     rightState = collapsibleRightMenuWidth;
  //   }
  //   sizesRecalc.adjust(
  //     collapsibleMenus.left ? collapsibleLeftMenuWidth : 0,
  //     rightState
  //   );
  // };
  const handleViewRatio = (viewRatio) => {
    props.toggleViewRatio(viewRatio);
    sizesRecalc.adjust(
      collapsibleMenus.left ? collapsibleLeftMenuWidth : 0,
      collapsibleMenus.right ? collapsibleRightMenuWidth : 0
    );
  };
  const handleToggleFullScreen = () => {
    props.toggleFullScreen(true);
    sizesRecalc.adjust(0, 0);
  };
  const getSlideNumber = () => {
    const currentSlideIndex = leftMenuLayers.findIndex(s => s.active === true);
    if (currentSlideIndex > -1) {
      return currentSlideIndex + 1;
    }
    return '';
  };
  const handleSlideSwitch = (type) => {
    const currentSlideIndex = leftMenuLayers.findIndex(s => s.active === true);
    const nextSlideIndex = currentSlideIndex + 1;
    const prevSlideIndex = currentSlideIndex - 1;
    if (type === 'next' && leftMenuLayers[nextSlideIndex]) {
      props.switchSlide(leftMenuLayers[nextSlideIndex]._id);
    }
    if (type === 'prev' && leftMenuLayers[prevSlideIndex]) {
      props.switchSlide(leftMenuLayers[prevSlideIndex]._id);
    }
    props.compressBlock();
  };
  // only for development
  const handleResetData = () => {
    props.callDevResetData();
  };
  return (
    <div styleName="static-top-menu" style={{ display: visible ? 'flex' : 'none' }}>
      <div styleName="menu-column">
        <button styleName="menu-button" onClick={handleToggleLeftMenu}>
          <i className={collapsibleMenus.left ? 'icon-arrow-left' : 'icon-arrow-right'}></i>
        </button>
        <div styleName="slide-switcher">
          <button
            type="button"
            styleName="menu-button"
            onClick={() => handleSlideSwitch('prev')}
          >
            <i className="icon-arrow-left-circle"></i>
          </button>
          <span>{getSlideNumber()}</span>
          <button
            type="button"
            styleName="menu-button"
            onClick={() => handleSlideSwitch('next')}
          >
            <i className="icon-arrow-right-circle"></i>
          </button>
        </div>
        <GridStepSwitcher />
      </div>
      <div styleName="menu-column text-center">
        <button styleName="menu-button" onClick={() => (handleViewRatio('16/9'))}>
          <i className="fa fa-desktop"></i>
        </button>
        <button styleName="menu-button" onClick={() => (handleViewRatio('11/6'))}>
          <i className="fa fa-tablet"></i>
        </button>
        <button styleName="menu-button" onClick={() => (handleViewRatio('5/8'))}>
          <i className="fa fa-mobile"></i>
        </button>
      </div>
      <div styleName="menu-column text-right">
        <button onClick={handleResetData} type="button" styleName="menu-button">
          <i className="icon-trash"></i>
        </button>
        <button styleName="menu-button" onClick={handleToggleFullScreen}>
          <i className="icon-size-fullscreen"></i>
        </button>
        {/*
          <button styleName="menu-button" onClick={handleToggleRightMenu}>
            <i className={collapsibleMenus.right ? 'icon-arrow-right' : 'icon-arrow-left'}></i>
          </button>
        */}
      </div>
    </div>
  );
};

TopMenu.propTypes = {
  visible: React.PropTypes.bool.isRequired,
  collapsibleMenus: React.PropTypes.object.isRequired,
  collapseMenus: React.PropTypes.func.isRequired,
  toggleViewRatio: React.PropTypes.func.isRequired,
  toggleFullScreen: React.PropTypes.func.isRequired,
  leftMenuLayers: React.PropTypes.array.isRequired,
  switchSlide: React.PropTypes.func.isRequired,
  compressBlock: React.PropTypes.func.isRequired,
  callDevResetData: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  collapsibleMenus: state.collapsibleMenus,
  leftMenuLayers: state.leftMenuLayers,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  collapseMenus,
  toggleViewRatio,
  toggleFullScreen,
  switchSlide,
  compressBlock,
  callDevResetData,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(TopMenu, style, { allowMultiple: true })
);
