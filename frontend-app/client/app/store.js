// Here we need to configure our Redux store
// It is created from a combination of many different reducers
// mainReducer is defined in reducers.js file

import { createStore, applyMiddleware, compose } from 'redux';
import mainReducer from './mainReducer';
import thunk from 'redux-thunk';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(mainReducer, composeEnhancers(applyMiddleware(thunk)));

export default store;
