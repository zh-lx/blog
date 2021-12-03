---
theme: smartblue
highlight: a11y-dark
---

欢迎大家一起交流学习 react 源码，本系列导航请见：[React17 源码解析(开篇) —— 搭建 react 源码调试环境](https://juejin.cn/post/7014775797596553230/)

<hr />

要学习 react 源码，首先要对 react 的源码和整个架构有个大体的了解，这样学起来会事半功倍。本章将介绍一下 react 的源码和架构。

# 源码目录

react 的源码目录如下，主要有三个文件夹：

- fixtures：一些测试 demo，方便 react 编码时的测试
- packages：react 的主要源码内容
- script：和 react 打包、编译、本地开发相关的命令
  我们要探究的源码内容，都存放在 packages 文件夹下:

```
📦react
 ┣ 📂fixtures
 ┣ 📂packages
 ┃ ┣ 📂create-subscription
 ┃ ┣ 📂dom-event-testing-library
 ┃ ┣ 📂eslint-plugin-react-hooks
 ┃ ┣ 📂jest-mock-scheduler
 ┃ ┣ 📂jest-react
 ┃ ┣ 📂react
 ┃ ┣ 📂react-art
 ┃ ┣ 📂react-cache
 ┃ ┣ 📂react-client
 ┃ ┣ 📂react-debug-tools
 ┃ ┣ 📂react-devtools
 ┃ ┣ 📂react-devtools-core
 ┃ ┣ 📂react-devtools-extensions
 ┃ ┣ 📂react-devtools-inline
 ┃ ┣ 📂react-devtools-scheduling-profiler
 ┃ ┣ 📂react-devtools-shares
 ┃ ┣ 📂react-devtools-shell
 ┃ ┣ 📂react-dom
 ┃ ┣ 📂react-fetch
 ┃ ┣ 📂react-interactions
 ┃ ┣ 📂react-is
 ┃ ┣ 📂react-native-renderer
 ┃ ┣ 📂react-noop-renderer
 ┃ ┣ 📂react-reconciler
 ┃ ┣ 📂react-refresh
 ┃ ┣ 📂react-server
 ┃ ┣ 📂react-test-renderer
 ┃ ┣ 📂react-transport-dom-relay
 ┃ ┣ 📂react-transport-dom-webpack
 ┃ ┣ 📂scheduler
 ┃ ┣ 📂shared
 ┃ ┗ 📂use-subscription
 ┗ 📂scripts
```

根据 packages 下面各个部分的功能，我将其划分为了几个模块：

## 核心 api

react 的核心 api 都位于 `packages/react` 文件夹下，包括 `createElement`、`memo`、`context` 以及 hooks 等，凡是通过 react 包引入的 api，都位于此文件夹下。

## 调度和协调

调度和协调是 react16 fiber 出现后的核心功能，和他们相关的包如下：

- scheduler：对任务进行调度，根据优先级排序
- react-conciler：diff 算法相关，对 fiber 进行副作用标记

## 渲染

和渲染相关的内容包括以下几个目录：

- react-art：canvas、svg 等内容的渲染
- react-dom：浏览器环境下的渲染，也是我们本系列中主要涉及讲解的渲染的包
- react-native-renderer：用于原生环境渲染相关
- react-noop-renderer：用于调试环境的渲染

## 辅助包

- shared：定义了 react 的公共方法和变量
- react-is：react 中的类型判断

## 其他

其他的包和本次 react 源码探究的关联不是很多，所以不过多介绍了。

# react 架构

了解了 react 源码目录之后，我们再来对 react 架构有个大体的认识，了解 react 是如何在变量更改时，页面发生更新渲染的。

react 为了保证页面能够流畅渲染，react16 之后的更新过程分为 render 和 commit 两个阶段。render 阶段包括 Scheduler(调度器) 和 Reconciler(协调器)，commit 阶段包括 Renderer(渲染器)：

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d958db1f965f44ce9bd4897717334ddd~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

## 触发更新

触发更新的方式主要有以下几种：`ReactDOM.render`(包括首次渲染)、`setState`、`forUpdate`、hooks 中的 `useState` 以及 ref 的改变等引起的。

## scheduler

当首次渲染或者组件状态发生更新等情况时，此时页面就要发生渲染了。scheduler 过程会对诸多的任务进行优先级排序，让浏览器的每一帧优先执行高优先级的任务（例如动画、用户点击输入事件等），从而防止 react 的更新任务太大影响到用户交互，保证了页面的流畅性。

## reconciler

reconciler 过程中，会开始根据优先级执行更新任务。这一过程主要是根据最新状态构建新的 fiber 树，与之前的 fiber 树进行 diff 对比，对 fiber 节点标记不同的副作用，对应渲染过程中真实 dom 的增删改。（这里不了解 fiber 和 diff 的话没关系，后面会讲到，主要是对 react 的流程有个大致概念）

## commit

在 render 阶段中，最终会生成一个 effectList 数组，记录了页面真实 dom 的新增、删除和替换等以及一些事件响应，commit 会根据 effectList 对真实的页面进行更新，从而实现页面的改变。

以上大体就是 react 更新过程中的架构，具体的细节讲解会在后面的章节中详细讲述，欢迎关注本专栏。
