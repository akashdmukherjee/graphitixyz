// Collapsible Left Menu component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './collapsible-left-menu.styl';
import { connect as reduxConnect } from 'react-redux';
import {
  toggleMenuBlocksItems,
  toggleMenuPillsItems,
  toggleMenuLayersItems,
  callAddSlide,
} from './CollapsibleLeftMenuActions';
import SortableMenuArea from '../SortableMenu/SortableMenuArea';

const CollapsibleLeftMenu = (props) => {
  const {
    visible,
    leftMenu,
    leftMenuBlocks,
    leftMenuPills,
    leftMenuLayers,
  } = props;
  const handleToggleItems = (type, groupName) => {
    if (type === 'blocks') {
      props.toggleMenuBlocksItems(groupName);
    }
    if (type === 'pills') {
      props.toggleMenuPillsItems(groupName);
    }
    if (type === 'layers') {
      props.toggleMenuLayersItems(groupName);
    }
  };
  const leftMenuContent = (type) => {
    let arr;
    if (type === 'blocks') {
      arr = leftMenuBlocks;
    }
    if (type === 'pills') {
      arr = leftMenuPills;
    }
    if (type === 'layers') {
      arr = leftMenuLayers;
    }
    if (arr) {
      const leftMenuItems = arr.map((group, i) => (
        <div key={i}>
          <div
            styleName="left-menu-item-group"
            onClick={() => handleToggleItems(type, group.name)}
          >
            {group.name}
          </div>
          {group.visible ?
            <SortableMenuArea items={group[type]} groupName={group.name} type={type} /> : null}
        </div>
      ));
      return (
        <div>
          {leftMenuItems}
        </div>
      );
    }
    return null;
  };
  const handleAddNewSlide = (e) => {
    e.preventDefault();
    const name = e.currentTarget['slide-name'].value;
    if (name) {
      props.callAddSlide({
        name,
        active: true,
        visible: true,
        layers: [],
      });
      /* eslint-disable */
      e.currentTarget['slide-name'].value = '';
      /* eslint-enable */
    }
  };
  const slidesForm = (type) => {
    if (type === 'layers') {
      return (
        <div styleName="new-slide-form-container">
          <form onSubmit={handleAddNewSlide}>
            <input type="text" name="slide-name" placeholder="Slide name..." />
            <button type="submit">Add new slide</button>
          </form>
        </div>
      );
    }
    return null;
  };
  return (
    <div styleName="collapsible-left-menu" style={{ display: visible ? 'block' : 'none' }}>
      {leftMenuContent(leftMenu)}
      {slidesForm(leftMenu)}
    </div>
  );
};

CollapsibleLeftMenu.propTypes = {
  visible: React.PropTypes.bool.isRequired,
  leftMenu: React.PropTypes.string.isRequired,
  leftMenuBlocks: React.PropTypes.array.isRequired,
  leftMenuPills: React.PropTypes.array.isRequired,
  leftMenuLayers: React.PropTypes.array.isRequired,
  toggleMenuBlocksItems: React.PropTypes.func.isRequired,
  toggleMenuPillsItems: React.PropTypes.func.isRequired,
  toggleMenuLayersItems: React.PropTypes.func.isRequired,
  callAddSlide: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  leftMenu: state.leftMenu,
  leftMenuBlocks: state.leftMenuBlocks,
  leftMenuPills: state.leftMenuPills,
  leftMenuLayers: state.leftMenuLayers,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({
  toggleMenuBlocksItems,
  toggleMenuPillsItems,
  toggleMenuLayersItems,
  callAddSlide,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(CollapsibleLeftMenu, style)
);
