"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTheme = void 0;
const utils_1 = require("@vuepress/utils");
const node_1 = require("./node");
__exportStar(require("./node"), exports);
__exportStar(require("./types"), exports);
const defaultTheme = ({ themePlugins = {}, ...localeOptions }) => {
    node_1.assignDefaultLocaleOptions(localeOptions);
    return {
        name: '@vuepress/theme-default',
        layouts: utils_1.path.resolve(__dirname, './layouts'),
        clientAppEnhanceFiles: utils_1.path.resolve(__dirname, './clientAppEnhance.js'),
        clientAppSetupFiles: utils_1.path.resolve(__dirname, './clientAppSetup.js'),
        // use the relative file path to generate edit link
        extendsPageData: ({ filePathRelative }) => ({ filePathRelative }),
        plugins: [
            [
                '@vuepress/active-header-links',
                node_1.resolveActiveHeaderLinksPluginOptions(themePlugins),
            ],
            ['@vuepress/back-to-top', themePlugins.backToTop !== false],
            [
                '@vuepress/container',
                node_1.resolveContainerPluginOptions(themePlugins, localeOptions, 'tip'),
            ],
            [
                '@vuepress/container',
                node_1.resolveContainerPluginOptions(themePlugins, localeOptions, 'warning'),
            ],
            [
                '@vuepress/container',
                node_1.resolveContainerPluginOptions(themePlugins, localeOptions, 'danger'),
            ],
            [
                '@vuepress/container',
                node_1.resolveContainerPluginOptionsForDetails(themePlugins),
            ],
            [
                '@vuepress/container',
                node_1.resolveContainerPluginOptionsForCodeGroup(themePlugins),
            ],
            [
                '@vuepress/container',
                node_1.resolveContainerPluginOptionsForCodeGroupItem(themePlugins),
            ],
            ['@vuepress/git', node_1.resolveGitPluginOptions(themePlugins, localeOptions)],
            ['@vuepress/medium-zoom', node_1.resolveMediumZoomPluginOptions(themePlugins)],
            ['@vuepress/nprogress', themePlugins.nprogress !== false],
            ['@vuepress/palette', { preset: 'sass' }],
            ['@vuepress/prismjs', themePlugins.prismjs !== false],
            ['@vuepress/theme-data', { themeData: localeOptions }],
        ],
    };
};
exports.defaultTheme = defaultTheme;
exports.default = exports.defaultTheme;
