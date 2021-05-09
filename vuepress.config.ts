import * as path from 'path';
module.exports = {
  title: "zh-lx's blog",
  description: 'zh-lx学习知识总结',
  theme: path.resolve(__dirname, './vuepress-theme-writing'),
  markdown: {
    extractHeaders: {
      level: [2, 3, 4, 5, 6],
    },
  },
};
