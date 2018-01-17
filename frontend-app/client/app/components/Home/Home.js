// Main website component
// Here we connect out all smaller components

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import Canvas from '../Canvas/Canvas';
import Timeline from '../Timeline/Timeline';
import CollapsibleLeftMenu from '../CollapsibleLeftMenu/CollapsibleLeftMenu';
import CollapsibleRightMenu from '../CollapsibleRightMenu/CollapsibleRightMenu';
import TopMenu from '../TopMenu/TopMenu';
import BottomMenu from '../BottomMenu/BottomMenu';
import CanvasMainArea from '../Canvas/CanvasMainArea';
import StaticLeftThinMenu from '../StaticLeftMenu/StaticLeftThinMenu';
import StaticLeftFatMenu from '../StaticLeftMenu/StaticLeftFatMenu';
import FooterBar from '../FooterBar/FooterBar';
import style from './home.styl';
import CustomDragLayer from '../../common/CustomDragLayer';
import { debounce } from '../../common/debounce';
import { sizesRecalc } from '../../common/sizesRecalc';
import { connect as reduxConnect } from 'react-redux';
import { collapsibleLeftMenuWidth, collapsibleRightMenuWidth } from '../../common/vars';
import { compressBlock } from '../Object/ObjectActions';
import { collapseMenus, toggleFullScreen } from '../Home/HomeActions';
import { switchSlide } from '../CollapsibleLeftMenu/CollapsibleLeftMenuActions';

class Home extends React.Component {
  componentDidMount() {
    // left and right collapsible menu dynamic widths
    sizesRecalc.adjust(
      this.props.collapsibleMenus.left ? collapsibleLeftMenuWidth : 0,
      this.props.collapsibleMenus.right ? collapsibleRightMenuWidth : 0
    );
    const resizeFn = debounce(() => {
      sizesRecalc.adjust(
          this.props.collapsibleMenus.left ? collapsibleLeftMenuWidth : 0,
          this.props.collapsibleMenus.right ? collapsibleRightMenuWidth : 0
        );
    }, 200);
    window.addEventListener('resize', resizeFn);
  }
  getSlideNumber() {
    const currentSlideIndex = this.props.leftMenuLayers.findIndex(s => s.active === true);
    if (currentSlideIndex > -1) {
      return currentSlideIndex + 1;
    }
    return '';
  }
  handleSlideSwitch(type) {
    const currentSlideIndex = this.props.leftMenuLayers.findIndex(s => s.active === true);
    const nextSlideIndex = currentSlideIndex + 1;
    const prevSlideIndex = currentSlideIndex - 1;
    if (type === 'next' && this.props.leftMenuLayers[nextSlideIndex]) {
      this.props.switchSlide(this.props.leftMenuLayers[nextSlideIndex].id);
    }
    if (type === 'prev' && this.props.leftMenuLayers[prevSlideIndex]) {
      this.props.switchSlide(this.props.leftMenuLayers[prevSlideIndex].id);
    }
    this.props.compressBlock();
  }
  handleExitFullScreen() {
    this.props.toggleFullScreen(false);
    sizesRecalc.adjust(
      this.props.collapsibleMenus.left ? collapsibleLeftMenuWidth : 0,
      this.props.collapsibleMenus.right ? collapsibleRightMenuWidth : 0
    );
  }
  handleLeftMenuClose() {
    if (this.props.collapsibleMenus.left) {
      this.props.collapseMenus({ left: true });
      sizesRecalc.adjust(
        collapsibleLeftMenuWidth,
        this.props.collapsibleMenus.right ? collapsibleRightMenuWidth : 0
      );
    }
  }

  render() {
    const {
      mainSizes,
      canvasSizes,
      collapsibleMenus,
      fullScreen,
      staticLeftMenuStretched,
      timelineContainerHeight,
    } = this.props;
    return (
      <div styleName="main-container">
        <StaticLeftThinMenu visible={!fullScreen && !staticLeftMenuStretched} />
        <StaticLeftFatMenu visible={!fullScreen && staticLeftMenuStretched} />
        <CollapsibleLeftMenu
          visible={!fullScreen && collapsibleMenus.left && !staticLeftMenuStretched}
        />
        <div styleName="canvas-timeline-container" onMouseEnter={() => this.handleLeftMenuClose()}>
          <TopMenu visible={!fullScreen} />
          <CanvasMainArea style={{ width: mainSizes.width, height: mainSizes.height }}>
            <Canvas style={{ width: canvasSizes.width, height: canvasSizes.height }} />
          </CanvasMainArea>
          <BottomMenu visible={!fullScreen} height={timelineContainerHeight}>
            <Timeline />
          </BottomMenu>
          <FooterBar visible={!fullScreen} />
        </div>
        <CollapsibleRightMenu visible={!fullScreen && collapsibleMenus.right} />
        <CustomDragLayer />
        <div styleName="slide-switcher" style={{ display: fullScreen ? 'block' : 'none' }}>
          <span>Slide: </span>
          <button type="button" onClick={() => this.handleSlideSwitch('prev')}>&lt;</button>
          <input type="text" value={this.getSlideNumber()} readOnly />
          <button type="button" onClick={() => this.handleSlideSwitch('next')}>&gt;</button>
        </div>
        <button
          type="button"
          styleName="exit-full-screen-button"
          style={{ display: fullScreen ? 'block' : 'none' }}
          onClick={() => this.handleExitFullScreen()}
        >
          Exit Full Screen
        </button>
      </div>
    );
  }
}

Home.propTypes = {
  mainSizes: React.PropTypes.object.isRequired,
  canvasSizes: React.PropTypes.object.isRequired,
  collapsibleMenus: React.PropTypes.object.isRequired,
  fullScreen: React.PropTypes.bool.isRequired,
  staticLeftMenuStretched: React.PropTypes.bool.isRequired,
  timelineContainerHeight: React.PropTypes.number.isRequired,
  toggleFullScreen: React.PropTypes.func.isRequired,
  leftMenuLayers: React.PropTypes.array.isRequired,
  switchSlide: React.PropTypes.func.isRequired,
  compressBlock: React.PropTypes.func.isRequired,
  collapseMenus: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  mainSizes: state.mainSizes,
  canvasSizes: state.canvasSizes,
  collapsibleMenus: state.collapsibleMenus,
  fullScreen: state.fullScreen,
  staticLeftMenuStretched: state.staticLeftMenuStretched,
  timelineContainerHeight: state.timelineContainerHeight,
  leftMenuLayers: state.leftMenuLayers,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleFullScreen,
  switchSlide,
  compressBlock,
  collapseMenus,
}, dispatch);

// we use react-css-modules for styling,
// we need to compose style object with the component
// it will appear in almost all components
export default reduxConnect(mapStateToProps, mapDispatchToProps)(cssModules(Home, style));
