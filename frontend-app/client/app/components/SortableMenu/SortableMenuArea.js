// Collapsible Right Menu component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './sortable-menu.styl';
import SortableMenuItem from './SortableMenuItem';
import update from 'react/lib/update';
import { connect as reduxConnect } from 'react-redux';
import {
  reorderMenuBlocks,
  reorderMenuPills,
  reorderMenuLayers,
} from '../CollapsibleLeftMenu/CollapsibleLeftMenuActions';
import { changeObject } from '../Object/ObjectActions';

const SortableMenuArea = (props) => {
  const {
    groupName,
    items,
    type,
  } = props;
  const moveMenuItem = (dragIndex, hoverIndex) => {
    const dragMenuItem = items[dragIndex];
    const itemAfter = update(items, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragMenuItem],
      ],
    });
    // TODO maybe unify somehow - reducers level
    if (type === 'blocks') {
      props.reorderMenuBlocks(groupName, itemAfter);
    }
    if (type === 'pills') {
      props.reorderMenuPills(groupName, itemAfter);
    }
    if (type === 'layers') {
      props.reorderMenuLayers(groupName, itemAfter);
      itemAfter.forEach((item, index) => {
        props.changeObject({ id: item.name, zIndex: (index + 1) * 10 });
      });
    }
  };
  return (
    <div styleName="sortable-menu-item">
      {props.items.map((i, indx) => (
        <SortableMenuItem
          key={i.name}
          index={indx}
          name={i.name}
          moveMenuItem={moveMenuItem}
          groupName={groupName}
          type={type}
        />
      ))}
    </div>
  );
};

SortableMenuArea.propTypes = {
  items: React.PropTypes.array,
  groupName: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  changeObject: React.PropTypes.func.isRequired,
  reorderMenuBlocks: React.PropTypes.func.isRequired,
  reorderMenuPills: React.PropTypes.func.isRequired,
  reorderMenuLayers: React.PropTypes.func.isRequired,
  objAttrs: React.PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
  objAttrs: state.object,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  reorderMenuBlocks,
  reorderMenuPills,
  reorderMenuLayers,
  changeObject,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  cssModules(SortableMenuArea, style)
);
