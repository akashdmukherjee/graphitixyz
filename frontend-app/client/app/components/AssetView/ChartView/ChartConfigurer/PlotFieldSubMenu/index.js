import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';
import ListWrapper from '../../../../common/ListWrapper';
const menus = [
  {
    text: 'RAW',
    active: false,
  },
  {
    text: 'MIN',
    active: false,
  },
  {
    text: 'MAX',
    active: false,
  },
  {
    text: 'COUNT',
    active: false,
  },
];

const PlotFieldSubMenu = props => {
  const { open, dataSource, onVisibilityChanged, onItemClick, style } = props;
  return (
    <ListWrapper
      open={open}
      style={{
        ...style,
        width: '150px',
      }}
      onVisibilityChanged={onVisibilityChanged}
    >
      <ul styleName="PlotFieldSubMenu-list">
        {dataSource.map(data => (
          <li key={data.text} onClick={() => onItemClick(data)}>
            <h5
              styleName={`text${data.active ? '-active' : data.delete ? '-del' : ''}`}
            >
              {data.text}
            </h5>
          </li>
        ))}
      </ul>
    </ListWrapper>
  );
};

PlotFieldSubMenu.propTypes = {
  dataSource: PropTypes.arrayOf(PropTypes.object),
  open: PropTypes.bool.isRequired,
  onVisibilityChanged: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
};

PlotFieldSubMenu.defaultProps = {
  dataSource: menus,
  onItemClick: () => null,
};

export default cssModules(PlotFieldSubMenu, styles);
