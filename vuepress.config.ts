import * as path from 'path';
module.exports = {
  title: '周立翔的博客',
  description: '前端及全栈学习心得与总结',
  theme: path.resolve(__dirname, './vuepress-theme-writing'),
  markdown: {
    extractHeaders: {
      level: [2, 3, 4, 5, 6],
    },
  },
  define: {
    HOME_INFO: {
      tes: 11,
    },
  },
};
