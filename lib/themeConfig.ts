const sidebarRouter = require('./sidebarRouter');
module.exports = {
  sidebar: sidebarRouter,
  navbar: [
    // 嵌套 Group - 最大深度为 2
    {
      text: '框架',
      children: [
        {
          text: 'react',
          link: '/react/其他/判断组件是否卸载.md',
        },
        {
          text: 'vue',
          children: [
            {
              text: 'vue2',
              link: '/vue2/通信方式.md',
            },
          ],
        },
      ],
    },
  ],
  logo: '/images/logo.png',
};
