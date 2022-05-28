import * as path from 'path';
module.exports = {
  title: '前端技术分享',
  description:
    '欢迎来到周立翔的小窝，这里记录我个人学习过程中的感悟和小结，与诸君共勉',
  theme: path.resolve(__dirname, './vuepress-theme-writing'),
  themeConfig: {
    logo: '/images/logo.png',
    repo: 'zh-lx/blog',
    alias: {
      HomeFooter: path.resolve(__dirname, './home-footer/index.vue'),
    },
  },
  markdown: {
    extractHeaders: {
      level: [1, 2, 3, 4, 5, 6],
    },
  },
  define: {
    SITE_INFO: {
      title: '周立翔的小窝',
      description:
        '欢迎来到周立翔的小窝，这里记录我个人学习过程中的感悟和小结，与诸君共勉',
      // type: 'docs',
    },
    AUTHOR_INFO: {
      name: '周立翔',
      avatar: '/images/avatar.jpg',
      introduction: 'a geek developer',
    },
    CONTACT_INFO: {
      juejin: 'https://juejin.cn/user/650530414137534',
      github: 'https://github.com/zh-lx',
      qq: '1134558955',
      wechat: 'zhoulx1688888',
      // email: '1134558955@qq.com',
      // csdn: '',
      // zhihu: 'https://www.zhihu.com/people/zhou-li-xiang-66-91',
    },
    // HOME_ITEMS: [
    //   {
    //     title: 'Out of the box',
    //     text: 'Elegant default configrations and convention routing assist developers to get started as simple as possible, that focus all attentions on developing libraries & writting docs',
    //   },
    //   {
    //     title: 'For developing libraries',
    //     text: 'Rich Markdown extensions are not limited to rendering component demos, making component documents not only easy to write and manage, but also beautiful and easy to use',
    //   },
    //   {
    //     title: 'Theme system',
    //     text: 'Progressive custom theme capabilities, ranging from expanding your own Markdown tags to customizing complete theme packages, are up to you',
    //   },
    // ],
  },
};
