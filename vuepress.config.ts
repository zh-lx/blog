import * as path from 'path';
import { webpackBundler } from '@vuepress/bundler-webpack';
import { defineUserConfig } from '@vuepress/cli';
import WriteTheme from './vuepress-theme-writing/src/node';

export default defineUserConfig({
  title: '前端技术分享',
  description:
    '欢迎来到周立翔的小窝，这里记录我个人学习过程中的感悟和小结，与诸君共勉',
  theme: WriteTheme({
    logo: '/images/logo.png',
    repo: 'zh-lx/blog',
    sidebarDepth: 6,
  }),
  alias: {
    HomeFooter: path.resolve(__dirname, './home-footer/index.vue'),
  },
  define: {
    $Site: {
      title: '周立翔的小窝',
      description:
        '欢迎来到周立翔的小窝，这里记录我个人学习过程中的感悟和小结，与诸君共勉',
      // type: 'docs',
    },
    $Author: {
      name: '周立翔',
      avatar: '/images/avatar.jpg',
      introduction: 'a geek developer',
    },
    $Contact: {
      juejin: 'https://juejin.cn/user/650530414137534',
      github: 'https://github.com/zh-lx',
      qq: '1134558955',
      wechat: 'zhoulx1688888',
      // email: '1134558955@qq.com',
      // csdn: '',
      // zhihu: 'https://www.zhihu.com/people/zhou-li-xiang-66-91',
    },
  },
});
