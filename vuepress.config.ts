import * as path from 'path';
module.exports = {
  title: "Zlx's Blog",
  description: 'Zh-lx 学习知识总结',
  themeConfig: {
    searchMaxSuggestions: true,
  },
  theme: path.resolve(__dirname, './theme'),
  templateDev: path.resolve(__dirname, './theme/templates/dev.html'),
  templateSSR: path.resolve(__dirname, './theme/templates/ssr.html'),
  // head,
};
