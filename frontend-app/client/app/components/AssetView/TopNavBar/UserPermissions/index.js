import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const UserPermissions = ({ label, users, style, onClick, onPlusIconClick }) => {
  const renderUsers = () => {
    const Users = [];
    const usersLength = users.length;
    for (let i = 0; i < (usersLength >= 3 ? 3 : usersLength); i++) {
      // console.info(users[i], i);
      const style = users[i].image ? users[i].image : 'user';
      Users.push(
        <div styleName={style} key={users[i].name}>
          {users[i].image ? null : users[i].name[0]}
        </div>
      );
    }

    Users.push(
      <div styleName="more-users" key={'more-users'}>
        <h5>{usersLength > 3 ? `+ ${usersLength - 3}` : null} {label}</h5>
      </div>
    );
    return Users;
  };

  return (
    <div styleName="user-permissions" style={style}>
      <div styleName="users">
        <div styleName="edit" onClick={onPlusIconClick}>
          <i className="icon-plus" />
        </div>
        {renderUsers()}
      </div>
    </div>
  );
};

export default cssModules(UserPermissions, styles);
