import * as path from 'path';
import * as routers from '../routers/index';
module.exports = {
  home: path.resolve(__dirname, './layouts/Layout.vue'),
  alias: {
    '@': path.resolve(__dirname, './'),
    '@components': path.resolve(__dirname, './components'),
    '@assets': path.resolve(__dirname, './assets'),
    '@styles': path.resolve(__dirname, './styles'),
  },
  sideBar: routers,
  templateDev: path.resolve(__dirname, './templates/dev.html'),
  templateSSR: path.resolve(__dirname, './templates/ssr.html'),
  plugins: [['@vuepress/plugin-palette', { preset: 'sass' }]],
  navBar: [
    {
      text: 'docker',
      link: '/study/docker/docker-compose/docker-compose.md',
    },
  ],
};
