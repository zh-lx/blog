const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const baseWebpackConfig = require('./webpack.config.base');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const portfinder = require('portfinder'); // 端口被占用

// @ts-ignore
const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      // @ts-ignore
      {
        test: /\.css$/,
        include: path.resolve(__dirname, './src'),
        use: ['style-loader', 'css-loader'],
      },
      // @ts-ignore
      {
        test: /\.scss$/,
        include: path.resolve(__dirname, './src'),
        use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      // @ts-ignore
      {
        test: /\.less$/,
        include: path.resolve(__dirname, './src'),
        use: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader'],
      },
    ],
  },
  devServer: {
    port: 8080,
    host: 'localhost',
    open: true, // 自动打开浏览器
    proxy: {
      '/api': {
        target: 'http://localhots:8888',
      },
    },
    hot: true,
    compress: true,
  },
});

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = 8080;
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err);
    } else {
      devWebpackConfig.devServer.port = port;
    }
    resolve(devWebpackConfig);
  });
});
