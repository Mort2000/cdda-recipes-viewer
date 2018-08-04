const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const distPath = path.resolve(__dirname, 'dist');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: distPath,
    filename: '[name].[hash].bundle.js',
    chunkFilename: '[name].[hash].chunk.js',
    sourceMapFilename: '[name].[hash].bundle.js.map',
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: './src/index.html',
    }),
    new CleanWebpackPlugin(distPath),
  ],
};
