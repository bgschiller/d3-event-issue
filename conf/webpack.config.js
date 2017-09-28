const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const loaders = require("./loaders.js");

const sourceFolder = path.resolve(__dirname, "../src");
const outputFolder = path.resolve(__dirname, "../dist");
const templateIndex = path.resolve(__dirname, "../src/index.html");


module.exports = {
  devtool: "eval",
  entry: {
    'setD3Event': [ "webpack-dev-server/client?http://localhost:3000", sourceFolder + '/index.js' ],
    'setD3SelectionEvent': [ "webpack-dev-server/client?http://localhost:3000", sourceFolder + '/selectionIndex.js' ],
  },
  output: {
    path: outputFolder,
    filename: "[name].js",
    publicPath: "/"
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject : true,
      template : templateIndex,
      chunks: ['setD3Event'],
      filename: outputFolder + '/setD3Event.html',
    }),
    new HtmlWebpackPlugin({
      inject : true,
      template : templateIndex,
      chunks: ['setD3SelectionEvent'],
      filename: outputFolder + '/setD3SelectionEvent.html',
    }),
    new HtmlWebpackPlugin({
      inject : true,
      template : path.resolve(__dirname, "../src/cdn-d3.html"),
      chunks: [],
      filename: outputFolder + '/cdn-d3.html',
    })
  ],
  module: {loaders},
  externals: ['child_process', 'fs', {
    xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}'
  }],
};
