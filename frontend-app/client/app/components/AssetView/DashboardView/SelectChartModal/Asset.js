import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './asset.styl';

const Asset = ({ data, onClick }) => {
  return (
    <div styleName="asset" onClick={() => onClick(data)}>
      <h5>
        <span>Asset Name:</span> {data.assetName}
      </h5>
      <h5>
        <span>Created By:</span> {data.createdBy_name}
      </h5>
    </div>
  );
};

Asset.propTypes = {
  data: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default cssModules(Asset, styles);
