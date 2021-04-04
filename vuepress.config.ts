import * as path from 'path';
import * as routers from './routers/index';
module.exports = {
  // theme: 'zhlx',
  title: 'Zh-lx',
  description: 'Zh-lx 学习知识总结',
  themeConfig: {
    sidebar: routers,
    searchMaxSuggestions: true,
  },
  theme: path.resolve(__dirname, './theme'),
  // head,
};
