import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './index.styl';

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

const Dropdown = props => {
  const { dataSource, onItemClick } = props;
  return (
    <ul styleName="Dropdown-list">
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
  );
};

Dropdown.propTypes = {
  dataSource: PropTypes.arrayOf(PropTypes.object),
  open: PropTypes.bool.isRequired,
  onVisibilityChanged: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
};

Dropdown.defaultProps = {
  dataSource: menus,
  onItemClick: () => null,
};

export default cssModules(Dropdown, styles);
