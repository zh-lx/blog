import * as path from 'path';
module.exports = {
  title: '周立翔的博客',
  description: '前端及全栈学习心得与总结',
  theme: path.resolve(__dirname, './vuepress-theme-writing'),
  themeConfig: {
    logo: '/images/logo.png',
    repo: 'zh-lx/blog',
    alias: {
      HomeFooter: path.resolve(__dirname, './home-footer/index.vue'),
    },
  },
  define: {
    SITE_INFO: {
      title: '十里香飘',
      description: '欲望以提高热忱，毅力以磨平高山',
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
