const webpack = require('webpack');
const config = require('./webpack.config.js');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const productionPlugin = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production'),
  },
});

const cssExtractPlugin = new ExtractTextPlugin('styles.css');

config.devtool = 'cheap-module-source-map';
config.output.publicPath = '/';
config.output.pathinfo = false;
config.entry = ['./app/App.js'];
config.plugins.unshift(productionPlugin);
config.plugins.push(cssExtractPlugin);

config.module.loaders = [
  {
    test: /\.js$/,
    exclude: /(node_modules)/,
    loaders: ['babel'],
  },
  {
    test: /\.css$/,
    loader: 'style!css',
  },
  {
    test: /\.styl$/,
    exclude: /(node_modules)/,
    loader: ExtractTextPlugin.extract(
      'style',
      'css?modules&importLoaders=1&localIdentName=[hash:base64:8]!postcss!stylus-loader'
    ),
  },
  {
    test: /\.(png|jpg)$/,
    exclude: /(node_modules)/,
    loader: 'url-loader?name=images/[name].[ext]&limit=8192',
  },
];

// console.info(config);

module.exports = config;
