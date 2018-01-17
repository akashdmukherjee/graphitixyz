import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const PlotFieldSubMenu = props => {
  const { dataSource, onItemClick } = props;
  return (
    <ul styleName="PlotFieldSubMenu-list">
      {dataSource.map(data =>
        <li key={data.text} onClick={() => onItemClick(data)}>
          <h5 styleName={`text${data.active ? '-active' : data.delete ? '-del' : ''}`}>
            {data.text}
          </h5>
        </li>
      )}
    </ul>
  );
};

PlotFieldSubMenu.propTypes = {
  dataSource: PropTypes.arrayOf(PropTypes.object).isRequired,
  onItemClick: PropTypes.func,
};

PlotFieldSubMenu.defaultProps = {
  onItemClick: () => null,
};

export default cssModules(PlotFieldSubMenu, styles);
