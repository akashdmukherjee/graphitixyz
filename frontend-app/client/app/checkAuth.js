import React from 'react';
import { withRouter } from 'react-router';
import { userServiceHost } from './serviceHosts';
import axios from 'axios';

const url = `${userServiceHost}/gytryu`;

const checkAuth = Component => {
  class RouterAuthComponent extends React.Component {
    componentWillMount() {
      this.checkAuth();
    }

    checkAuth() {
      /**
       * if authentication is successful, do nothing, render the component as it is
       * else catch the error and redirect to login page
       */
      axios
        .get(url, {
          headers: {
            'graphiti-tid': Math.random(),
          },
        })
        .catch(error => {
          /*
          * redirect the page to /login?redirect={path}
          */
          const { location, router } = this.props;
          const redirectPath = `/login?redirect=${location.pathname}${location.search}`;
          router.push(redirectPath);
        });
    }

    render() {
      return <Component {...this.props} />;
    }
  }
  return withRouter(RouterAuthComponent);
};

export default checkAuth;
