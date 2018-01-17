import React from 'react';
import PropTypes from 'prop-types';
import Asset from './Asset';

const TabContent = ({ dataSource, ...passProps }) =>
  <div>
    {dataSource.map(asset => <Asset {...passProps} key={asset.id} {...asset} />)}
  </div>;

TabContent.propTypes = {
  dataSource: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TabContent;
