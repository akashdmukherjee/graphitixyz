import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import styles from './index.styl';

const UserPermissions = ({ label, users, showPlus, style, onClick }) => {
  const renderUsers = () => {
    const Users = [];
    const usersLength = users.length;
    for (let i = 0; i < (usersLength >= 3 ? 3 : usersLength); i++) {
      // console.info(users[i], i);
      const imgstyle = users[i].image ? users[i].image : 'user';
      Users.push(
        <div styleName={imgstyle} style={style.user}>
          {users[i].image ? null : users[i].name[0]}
        </div>
      );
    }

    if (usersLength > 3) {
      Users.push(
        <div styleName="more-users">
          <h5 style={style.moreLabel}>+{usersLength - 3} {label}</h5>
        </div>
      );
    }
    return Users;
  };

  return (
    <div styleName="user-permissions" style={style.wrapper}>
      <div styleName="users">
        {showPlus
          ? <div styleName="edit" style={style.user}>
              <i className="icon-plus" />
            </div>
          : null}
        {renderUsers()}
      </div>
    </div>
  );
};

export default cssModules(UserPermissions, styles);
