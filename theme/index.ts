import * as path from 'path';
import * as routers from '../routers/index';
import * as logo from '@assets/logo.png';
module.exports = {
  home: path.resolve(__dirname, './layouts/Layout.vue'),
  logo: logo,
  alias: {
    '@': path.resolve(__dirname, './'),
    '@components': path.resolve(__dirname, './components'),
    '@assets': path.resolve(__dirname, './assets'),
  },
  sideBar: routers,
  templateDev: path.resolve(__dirname, './templates/dev.html'),
  templateSSR: path.resolve(__dirname, './templates/ssr.html'),
};
