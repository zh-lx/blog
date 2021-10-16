# React17 源码解析(开篇) —— 搭建调试环境

作为前端最优秀的开源框架之一，react 值得每一个前端开发者学习。今年花了很长的一段时间，反复理解品读了 react 的源码，感觉收获颇丰，趁着国庆假期打算<b>开始</b>写一系列 react v17 源码解析的文章和大家一起讨论学习。

通过源码的学习，你可以提升项目中排查 bug 的能力、更好的理解 react 的工作过程和工作模式、提升数据结构和算法设计的能力，以及最重要的：提升面试竞争力。

# 系列目录

本系列的源码解析的 react 版本是 [v17.0.2](https://github.com/facebook/react/tree/17.0.2)，将从 react 应用的入口开始讲解，涉及到一个较为完整的 react 依赖的绝大部分的主要功能和核心，大体的内容纲要如下：

- [jsx 和 React.createElement](https://juejin.cn/post/7014776739121496072/)
- ReactDOM.render
- fiber 架构
- concurrent mode
- render 和 commit 阶段
- reconciliation 和 diff 算法
- hooks 源码

<b>由于上面的章节并未完结，后续实际写的过程中可能略有调整，本篇章会随时更新，感兴趣的看官老爷建议收藏一下本章作为目录导航。</b>

# 搭建 react 源码调试环境

本系列章节除了源码的解析之外，也希望大家能够自己学会如何阅读源码，既然想要阅读源码，那么必然少不了对源码的调试，下面会讲解如何搭建一个 react 源码的调试环境。

## 创建项目

首先通过官方脚手架 create-react-app 创建一个 react 项目，在终端执行以下命令：

```
npx create-react-app debug-react
```

## 暴露 webpack 配置

我们后续想要对通过直接引入 react 源码替代 node_modules 中的 react 包，需要修改 webpack，在 debug-react 目录下执行以下命令暴露 webpack 配置：

```
cd ./debug-react
yarn eject
```

在 `Are you sure you want to eject? This action is permanent.` 这里选择 y 就可以，命令执行完毕后在新增的 config 文件夹下可以看到 webpack 的配置文件：

<div align=center>
<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6bfc59813fe34ac78aad5e391ff3da48~tplv-k3u1fbpfcp-watermark.image" height="400" />
</div>

## 引入 react 源码及修改 webpack

由于 node_modules 中的 react 包是打包好之后的文件，许多代码掺杂在一个文件中，不便于我们对源码进行调试。因此在 debug-react 的 src 目录下引入 react 的源码：

```
git clone https://github.com/facebook/react.git -b 17.0.2
```

并在刚刚引入的 `src/react` 目录下执行一下命令安装依赖：

```
yarn install
```

然后我们修改 webpack 的配置，使得在代码中引入的 react 等 npm 包的指向由 node_modules 改为刚刚引入的源码。在 `config/webpack.config.js` 下新增如下几个包的引用：

```diff
// ...
module.exports = {
    // ...
    resolve: {
        alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
        // Allows for better profiling with ReactDevTools
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        }),
        ...(modules.webpackAliases || {}),
+       'react': path.resolve(__dirname, '../src/react/packages/react'),
+       'react-dom': path.resolve(__dirname, '../src/react/packages/react-dom'),
+       'shared': path.resolve(__dirname, '../src/react/packages/shared'),
+       'react-reconciler': path.resolve(__dirname, '../src/react/packages/react-reconciler'),
      },
    }
}
```

## 修改环境变量

我们将 `__DEV__` 等环境变量默认启用，便于开发调试，修改 `config/env.js`：

```diff
// ...
function getClientEnvironment(publicUrl) {
  // ...
  const stringified = {
+   __DEV__: true,
+   __PROFILE__: true,
+   __UMD__: true,
+   __EXPERIMENTAL__: true,
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}
```

在 debug-react 的根目录下创建 `.eslintrc.json` 文件，内容如下：

```json
{
  "extends": "react-app",
  "globals": {
    "__DEV__": true,
    "__PROFILE__": true,
    "__UMD__": true,
    "__EXPERIMENTAL__": true
  }
}
```

## 解决一系列报错

上面的环境配置好之后，通过 `yarn start` 启动会出现一系列的报错问题，因为 react 中某些遍历是在打包时根据环境注入生成的，我们现在要直接调试源码，不进行 react 的打包，所以要解决这些报错。下面直接讲问题解决了。

### 添加 ReactFiberHostConfig 引用

<b>如下报错</b>

```
Attempted import error: 'afterActiveInstanceBlur' is not exported from './ReactFiberHostConfig'.
```

<b>解决方式</b>：

直接修改 `src/react/packages/react-reconciler/src/ReactFiberHostConfig.js` 的内容如下：

```diff
- import invariant from 'shared/invariant';
- invariant(false, 'This module must be shimmed by a specific renderer.');

+ export * from './forks/ReactFiberHostConfig.dom'
```

另外修改 `src/react/packages/shared/ReactSharedInternals.js`，直接从引入 ReactSharedInternals 并导出：

```diff
- import * as React from 'react';
- const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

+ import ReactSharedInternals from '../react/src/ReactSharedInternals';
```

### 修改 react 引用方式

<b>如下报错</b>

```
Attempted import error: 'react' does not contain a default export (imported actFiberHosts 'React').
```

<b>解决方式</b>：

修改 `src/index.js` 中 react 和 react-dom 的引入方式：

```diff
- import React from 'react';
- import ReactDOM from 'react-dom';
+ import * as React from 'react';
+ import * as ReactDOM from 'react-dom';
```

### 修改 inveriant

<b>如下报错</b>

```
Error: Internal React error: invariant() is meant to be replaced at compile time. There is no runtime version.
```

<b>解决方式</b>：

修改 `src/react/packages/shared/invariant.js` 的内容：

```diff
export default function invariant(condition, format, a, b, c, d, e, f) {
+ if (condition) {
+   return;
+ }
  throw new Error(
    'Internal React error: invariant() is meant to be replaced at compile ' +
      'time. There is no runtime version.',
  );
}
```

### 解决 eslint 报错

还剩下一堆有关 eslint 的报错，诸如：

```
Failed to load config "fbjs" to extend from.
```

<b>解决方式</b>：

eslint 报错的内容实在太多了，我这里直接简单粗暴的将 webpack 中 eslint 插件给关掉，修改 `src/config/webpack.config.js` 文件：

```diff
module.exports = {
  // ...
  plugins: [
    // ...
-   !disableESLintPlugin &&
-   new ESLintPlugin({
-   // Plugin options
-     extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
-     formatter: require.resolve('react-dev-utils/eslintFormatter'),
-       eslintPath: require.resolve('eslint'),
-     failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
-     context: paths.appSrc,
-     cache: true,
-     cacheLocation: path.resolve(
-       paths.appNodeModules,
-       '.cache/.eslintcache'
-     ),
-     // ESLint class options
-     cwd: paths.appPath,
-     resolvePluginsRelativeTo: __dirname,
-     baseConfig: {
-       extends: [require.resolve('eslint-config-react-app/base')],
-       rules: {
-          ...(!hasJsxRuntime && {
-          'react/react-in-jsx-scope': 'error',
-       }),
-     },
-   },
-   }),
  ]
}
```

# 总结

至此，我们的调试环境就搭建完成了，可以在 react 源码中通过 `debugger` 打断点或者 `console.log()` 输出日志进行愉快地调试了！

最后贴一下搭建的调试环境的 github 地址：[debug-react](https://github.com/zh-lx/study-code/tree/main/packages/react/debug-react)，不想自己搭建调试环境的话可以直接 clone 我搭好的环境使用。
