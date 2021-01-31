const path = require('path');
const { merge } = require('webpack-merge');
const baseWebpackConfig = require('./webpack.config.base');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// @ts-ignore
module.exports = merge(baseWebpackConfig, {
  mode: 'production',
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    // @ts-ignore
    new MiniCssExtractPlugin({
      filename: '[name]-[contentHash:6].css',
    }),
    new CleanWebpackPlugin(),
  ],
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.resolve(__dirname, './src'),
        // @ts-ignore
        use: [{ loader: MiniCssExtractPlugin.loader }, 'css-loader'],
      },
      {
        test: /\.scss$/,
        include: path.resolve(__dirname, './src'),
        use: [
          // @ts-ignore
          { loader: MiniCssExtractPlugin.loader },
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.less$/,
        include: path.resolve(__dirname, './src'),
        use: [
          // @ts-ignore
          { loader: MiniCssExtractPlugin.loader },
          'css-loader',
          'postcss-loader',
          'less-loader',
        ],
      },
    ],
  },
});
