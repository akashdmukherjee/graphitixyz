import React from 'react';
import PropTypes from 'prop-types';
import { DragSource as dragSource } from 'react-dnd';
import Field from '../../../../common/Field';
import * as Types from '../draggableItemTypes';
import iconNames from '../iconNames';

const draggableColumnNameSource = {
  beginDrag(props) {
    console.info('DraggableColumnName beginDrag', props);
    return {
      ...props,
    };
  },
};

const DraggableColumnName = props => {
  const { connectDragSource, columnName, dataType } = props;
  return connectDragSource(
    <div>
      <Field
        text={columnName}
        data={{
          columnName,
          dataType,
        }}
        hasDropdown={false}
        rightIcon={false}
        style={{
          field: {
            cursor: 'pointer',
          },
        }}
        transformLeftIconName={() => iconNames[dataType]}
      />
    </div>
  );
};

export default dragSource(Types.PLOTTED_TAG, draggableColumnNameSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))(DraggableColumnName);
