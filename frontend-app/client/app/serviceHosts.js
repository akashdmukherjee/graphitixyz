// config.js
// This file stores all environment related variables

const commonHosts = {
  dev: 'localhost',
  staging: 'staging',
  prod: 'prod',
};

const serviceHosts = {
  userService: {
    host: commonHosts.dev,
    port: '8080',
  },
  connectorService: {
    host: commonHosts.dev,
    port: '8090',
  },
  searchService: {
    host: commonHosts.dev,
    port: '8096',
  },
  assetService: {
    host: commonHosts.dev,
    port: '9090',
  },
};

export const userServiceHost = `http://${serviceHosts.userService.host}:${serviceHosts.userService.port}/ext`;
export const connectorServiceHost = `http://${serviceHosts.connectorService.host}:${serviceHosts.connectorService.port}/api/ext`;
export const searchServiceHost = `http://${serviceHosts.searchService.host}:${serviceHosts.searchService.port}/api/ext`;
export const assetServiceHost = `http://${serviceHosts.assetService.host}:${serviceHosts.assetService.port}/ext`;
