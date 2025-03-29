const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    popup: './src/popup/index.js',
    background: './src/background/index.js',
    content: './src/content/index.js',
    injected: './src/injected/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public/manifest.json', to: '' },
        { from: 'public/icons', to: 'icons' }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  }
};