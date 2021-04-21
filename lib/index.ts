const { path } = require('@vuepress/utils');
const themeConfig = require('./themeConfig');
const themePlugins = {};
const {
  assignDefaultLocaleOptions,
  resolveActiveHeaderLinksPluginOptions,
  resolveContainerPluginOptions,
  resolveContainerPluginOptionsForDetails,
  resolveContainerPluginOptionsForCodeGroup,
  resolveContainerPluginOptionsForCodeGroupItem,
  resolveGitPluginOptions,
  resolveMediumZoomPluginOptions,
} = require('./node');

assignDefaultLocaleOptions(themeConfig);

module.exports = {
  layouts: path.resolve(__dirname, './layouts'),
  clientAppEnhanceFiles: path.resolve(__dirname, './clientAppEnhance.ts'),
  clientAppSetupFiles: path.resolve(__dirname, './clientAppSetup.ts'),
  extendsPageData: ({ filePathRelative }) => ({ filePathRelative }),
  alias: {
    '@': path.resolve(__dirname, './'),
  },
  plugins: [
    [
      '@vuepress/active-header-links',
      resolveActiveHeaderLinksPluginOptions(themePlugins),
    ],
    ['@vuepress/back-to-top'],
    [
      '@vuepress/container',
      resolveContainerPluginOptions(themePlugins, themeConfig, 'tip'),
    ],
    [
      '@vuepress/container',
      resolveContainerPluginOptions(themePlugins, themeConfig, 'warning'),
    ],
    [
      '@vuepress/container',
      resolveContainerPluginOptions(themePlugins, themeConfig, 'danger'),
    ],
    [
      '@vuepress/container',
      resolveContainerPluginOptionsForDetails(themePlugins),
    ],
    [
      '@vuepress/container',
      resolveContainerPluginOptionsForCodeGroup(themePlugins),
    ],
    [
      '@vuepress/container',
      resolveContainerPluginOptionsForCodeGroupItem(themePlugins),
    ],
    ['@vuepress/git', resolveGitPluginOptions(themePlugins, themeConfig)],
    ['@vuepress/medium-zoom', resolveMediumZoomPluginOptions(themePlugins)],
    ['@vuepress/nprogress'],
    ['@vuepress/palette', { preset: 'sass' }],
    ['@vuepress/prismjs'],
    [
      '@vuepress/theme-data',
      {
        themeData: themeConfig,
      },
    ],
  ],
};
