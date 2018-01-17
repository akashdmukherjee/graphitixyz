import React from 'react';
import Main from './Main';
import Home from './components/Home/Home';
import Content from './components/Content/Content';
import Login from './components/Login';
import AccountActivation from './components/Login/AccountActivation';
import { Route, IndexRoute } from 'react-router';
import DataDiscovery from './components/DataDiscovery';
import AssetView from './components/AssetView';
import Test from './components/Test';
import checkAuth from './checkAuth';

// Here we define all React Router routes
export default (
  <Route path="/" component={Main}>
    <IndexRoute component={Test} />
    <Route path="discovery" component={checkAuth(DataDiscovery)} />
    <Route path="asset/:assetId" component={checkAuth(AssetView)} />
    <Route path="login" component={Login} />
    <Route path="user">
      <Route path="reset/:id" component={AccountActivation} />
      <Route path="activate/:id" component={AccountActivation} />
    </Route>
    <Route path="home" component={Home} />
    <Route path="content" component={Content} />
  </Route>
);
