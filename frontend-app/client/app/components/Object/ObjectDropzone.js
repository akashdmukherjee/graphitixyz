// Collapsible Right Menu component

import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import style from './object.styl';
import { dndItemTypes } from '../../common/vars';
import { DropTarget as dropTarget } from 'react-dnd';
import { connect as reduxConnect } from 'react-redux';
import { callAddBlockDropzoneItem } from './ObjectActions';

const ItemTarget = {
  drop(props, monitor) {
    const item = monitor.getItem();
    // TODO we probably need different dndItemTypes for pills and blocks
    // for now conditional logic is here
    if (item.type === 'pills') {
      props.callAddBlockDropzoneItem(props.id, { name: item.id });
    }
  },
};

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
});

const ObjectDropzone = (props) => {
  const { connectDropTarget, isOver, blockDropzones, id } = props;
  const currentDropzoneItems = blockDropzones.find(d => d.id === id).items;
  return connectDropTarget(
    <div styleName="object-dropzone" style={{ backgroundColor: isOver ? '#cdcdcd' : '#ffffff' }}>
      {currentDropzoneItems.map((i, index) => <div key={index}>{i.name}</div>)}
    </div>
  );
};

const mapStateToProps = (state) => ({
  blockDropzones: state.blockDropzones,
});
const mapDispatchToProps = (dispatch) => bindActionCreators({
  callAddBlockDropzoneItem,
}, dispatch);

export default reduxConnect(mapStateToProps, mapDispatchToProps)(
  dropTarget(dndItemTypes.SORTABLEMENUITEM, ItemTarget, collect)(
    cssModules(ObjectDropzone, style)
  )
);
