
import React from 'react';
import cssModules from 'react-css-modules';
import style from './content.styl';

const DataStoriesList = (props) => {
  const datastories = props.datastoriesList.map((datastory, index) => (
    <div key={index}>
      {datastory.name}
      <div>
        {datastory.creator}
      </div>
    </div>)
  );
  return (
    <div styleName="datastory-item-container">
      {datastories}
    </div>
  );
};

DataStoriesList.propTypes = {
  datastoriesList: React.PropTypes.array.isRequired,
};

export default cssModules(DataStoriesList, style);
