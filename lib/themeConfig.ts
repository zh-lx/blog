const sidebarRouter = require('./sidebarRouter');
module.exports = {
  sidebar: sidebarRouter,
  navbar: [
    // 嵌套 Group - 最大深度为 2
    {
      text: 'docker',
      children: [
        {
          text: 'docker学习',
          children: [
            '/study/docker/docker命令/build.md',
            '/study/docker/docker命令/create.md',
          ],
        },
      ],
    },
  ],
  logo: '/images/logo.png',
};
