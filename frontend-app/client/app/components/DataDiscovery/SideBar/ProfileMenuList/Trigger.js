import React from 'react';
import PropTypes from 'prop-types';
import './trigger.css';
import profileTypes from '../../profileTypes';

const Trigger = ({ onClick, label, data }) => {
  return (
    <div className="profile-menu" onClick={onClick}>
      <div className="profile">
        <div className="user-pic">
          <i
            className={
              data.profileType === profileTypes.PERSONAL
                ? 'icon-user'
                : 'icon-grid'
            }
          />
        </div>
        <div className="user-detail">
          <h4>
            {data.profileType === profileTypes.PERSONAL
              ? data.memberName
              : data.name}
          </h4>
          {/* TODO: Fix this later, get companyName from back-end
          * instead of extracting from email
          */}
          <h5>{data.companyName && data.companyName.match(/@(.*)\./)[1]}</h5>
        </div>
        <span className="arrow-down"><i className="icon-arrow-down" /></span>
      </div>
    </div>
  );
};

export default Trigger;
