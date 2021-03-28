const path = require('path');
const routers = require('../routers/index');
module.exports = {
  title: 'Zh-lx Home',
  description: 'Zh-lx 学习知识总结',
  // configureWebpack: {
  //   resolve: {
  //     alias: {
  //       docker: path.resolve(__dirname, '../docker'),
  //     },
  //   },
  // },
  themeConfig: {
    sidebar: routers,
  },
};
