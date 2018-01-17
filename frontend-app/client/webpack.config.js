const sGrid = require('s-grid');
const rupture = require('rupture');
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './app/App.js',
  ],
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: 'http://localhost:3000/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Graphiti XYZ',
      template: './index_template.ejs',
      inject: 'body',
      filename: 'index.html',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }),
    new CopyWebpackPlugin([
      {
        from: 'node_modules/monaco-editor/min/vs',
        to: 'vs',
      },
    ]),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loaders: ['react-hot', 'babel'],
      },
      {
        test: /\.css$/,
        loader: 'style!css?sourceMap',
      },
      {
        test: /\.styl$/,
        exclude: /(node_modules)/,
        loader:
          'style!css?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]__[hash:base64:5]!postcss!stylus-loader',
      },
      {
        test: /\.(png|jpg)$/,
        exclude: /(node_modules)/,
        loader: 'url-loader?name=images/[name].[ext]&limit=8192',
      },
    ],
  },
  resolve: {
    root: path.join(__dirname, '..', 'app'),
    extensions: ['', '.js', '.jsx', '.json', '.css', '.styl', '.png', '.jpg', '.jpeg', '.gif'],
  },
  stylus() {
    return [sGrid, rupture];
  },
  postcss() {
    return [autoprefixer];
  },
};
