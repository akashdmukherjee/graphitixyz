import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory } from 'react-router';
import { Provider } from 'react-redux';
import { DELETE_ASSET_VIEW_STATE, DELETE_DISCOVERY_STATE } from './components/Actions';

import routes from './routes';
import store from './store';

function onRouteTransition(e) {
  // console.info('history:', e);
  const { pathname } = e;
  let type = '';
  // if it's in /asset then clear out dataDiscovery in store or vice versa
  if (pathname.match(/^\/asset.*/)) {
    type = DELETE_DISCOVERY_STATE;
  } else if (pathname.match(/^\/discovery/)) {
    type = DELETE_ASSET_VIEW_STATE;
  }
  store.dispatch({ type });
}

/**
 * here handle back button press
 * and clear all data of the previous route
 */
browserHistory.listen(onRouteTransition);

// Main app file We pass the Redux store here by using Provider component from
// Redux

ReactDOM.render(
  <Provider store={store}>
    <Router routes={routes} history={browserHistory} />
  </Provider>,
  document.getElementById('app')
);
