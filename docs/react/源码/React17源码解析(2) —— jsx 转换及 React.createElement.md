---
tag: ['react']
---

欢迎大家一起交流学习 react 源码，本系列目录导航请见：[React17 源码解析(开篇) —— 搭建 react 源码调试环境](https://juejin.cn/post/7014775797596553230/)

<hr />

从这一章开始，我们正式开始 react 源码的学习，本章包括内容如下:

> - react17 之前和之后 jsx 编译的不同
> - React.createElement 源码
> - React.Component 源码

# jsx 的转换

我们从 react 应用的入口开始对源码进行分析，创建一个简单的 hello, world 应用：

```js
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
export default class App extends Component {
  render() {
    return <div>hello, world</div>;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```

我们注意到，我们在 App 组件中直接写了 `return <div>hello, world</div>` 的 jsx 语句，那么 jsx 语法是如何被浏览器识别执行的呢？

另外我在第一次学习 react 的时候，就有一个疑惑： `import React, { Component } from 'react'` 这段代码中，`React` 似乎在代码中没有任何地方被用到，为什么要引入呢？

## 16.x 版本及之前

我们在 react16.8 版本的代码中，尝试将 `React` 的引用去掉：

```js
// import React, { Component } from 'react';
import { Component } from 'react'; // 去掉 React 的引用
import ReactDOM from 'react-dom';

export default class App extends Component {
  render() {
    return <div>hello, world</div>;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```

运行应用程序，发现会提示 `'React' must be in scope when using JSX` 的 error：

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6d5f4b95c9084a1da705b5d7f558a682~tplv-k3u1fbpfcp-watermark.image?" width="100%">

这是因为上述的类组件 render 中返回了 `<div>hello, world</div>` 的 jsx 语法，在 React16 版本及之前，应用程序通过 [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react/) 将 jsx 语法转换为 `React.createElement` 的 js 代码，因此需要显式将 React 引入，才能正常调用 createElement。我们可以在 [Babel REPL](https://babeljs.io/repl/#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&corejs=3.6&spec=false&loose=false&code_lz=MYewdgzgLgBApgGzgWzmWBeGAeAFgRgD4AJRBEAGhgHcQAnBAEwEJsB6AwgbgChRJY_KAEMAlmDh0YWRiGABXVOgB0AczhQAokiVQAQgE8AkowAUPGDADkdECChWeASl4AlOMOBQAIgHkAssp0aIySpogoaFBUQmISdC48QA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=react&prettier=false&targets=&version=7.15.6&externalPlugins=&assumptions=%7B%7D) 中看到 jsx 被 @babel/preset-react 编译后的结果：

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b3a0d70e990495db713c5c7df020a98~tplv-k3u1fbpfcp-watermark.image?" width="100%">

## 17.x 版本及之后

React17 版本之后，官方与 babel 进行了合作，直接通过将 `react/jsx-runtime` 对 jsx 语法进行了新的转换而不依赖 `React.createElement`，转换的结果便是可直接供 `ReactDOM.render` 使用的 ReactElement 对象。因此如果在 React17 版本后只是用 jsx 语法不使用其他的 react 提供的 api，可以不引入 `React`，应用程序依然能够正常运行。<br/>
React17 中 jsx 语法的编译结果如下：
<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a28da709dd9643058801d8b03fb5e355~tplv-k3u1fbpfcp-watermark.image?" width="100%">

更多有关于 React jsx 转换的内容可以去看官网了解：[介绍全新的 JSX 转换](https://zh-hans.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)，在这里就不再过多展开了。

# React.createElement 源码

虽然现在 react17 之后我们可以不再依赖 `React.createElement` 这个 api 了，但是实际场景中以及很多开源包中可能会有很多通过 `React.createElement` 手动创建元素的场景，所以还是推荐学习一下[React.createElement 源码](https://github.com/facebook/react/blob/17.0.2/packages/react/src/ReactElement.js)。

`React.createElement` 其接收三个或以上参数：

- type：要创建的 React 元素类型，可以是标签名称字符串，如 `'div'` 或者 `'span'` 等；也可以是 React 组件 类型(class 组件或者函数组件)；或者是 React fragment 类型。
- config：写在标签上的属性的集合，js 对象格式，若标签上未添加任何属性则为 null。
- children：从第三个参数开始后的参数为当前创建的 React 元素的子节点，每个参数的类型，若是当前元素节点的 textContent 则为字符串类型；否则为新的 React.createElement 创建的元素。

函数中会对参数进行一系列的解析，源码如下，对源码相关的理解都用注释进行了标记：

```js
export function createElement(type, config, children) {
  let propName;

  // 记录标签上的属性集合
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  // config 不为 null 时，说明标签上有属性，将属性添加到 props 中
  // 其中，key 和 ref 为 react 提供的特殊属性，不加入到 props 中，而是用 key 和 ref 单独记录
  if (config != null) {
    if (hasValidRef(config)) {
      // 有合法的 ref 时，则给 ref 赋值
      ref = config.ref;

      if (__DEV__) {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }
    if (hasValidKey(config)) {
      // 有合法的 key 时，则给 key 赋值
      key = '' + config.key;
    }

    // self 和 source 是开发环境下对代码在编译器中位置等信息进行记录，用于开发环境下调试
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // 将 config 中除 key、ref、__self、__source 之外的属性添加到 props 中
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // 将子节点添加到 props 的 children 属性上
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    // 共 3 个参数时表示只有一个子节点，直接将子节点赋值给 props 的 children 属性
    props.children = children;
  } else if (childrenLength > 1) {
    // 3 个以上参数时表示有多个子节点，将子节点 push 到一个数组中然后将数组赋值给 props 的 children
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    // 开发环境下冻结 childArray，防止被随意修改
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // 如果有 defaultProps，对其遍历并且将用户在标签上未对其手动设置属性添加进 props 中
  // 此处针对 class 组件类型
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  // key 和 ref 不挂载到 props 上
  // 开发环境下若想通过 props.key 或者 props.ref 获取则 warning
  if (__DEV__) {
    if (key || ref) {
      const displayName =
        typeof type === 'function'
          ? type.displayName || type.name || 'Unknown'
          : type;
      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }
      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  // 调用 ReactElement 并返回
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  );
}
```

由代码可知，`React.createElement` 做的事情主要有：

- 解析 config 参数中是否有合法的 key、ref、**source 和 **self 属性，若存在分别赋值给 key、ref、source 和 self；将剩余的属性解析挂载到 props 上
- 除 type 和 config 外后面的参数，挂载到 `props.children` 上
- 针对类组件，如果 type.defaultProps 存在，遍历 type.defaultProps 的属性，如果 props 不存在该属性，则添加到 props 上
- 将 type、key、ref、self、props 等信息，调用 `ReactElement` 函数创建虚拟 dom，`ReactElement` 主要是在开发环境下通过 `Object.defineProperty` 将 \_store、\_self、\_source 设置为不可枚举，提高 element 比较时的性能：

  ```js
  const ReactElement = function (type, key, ref, self, source, owner, props) {
    const element = {
      // 用于表示是否为 ReactElement
      $$typeof: REACT_ELEMENT_TYPE,

      // 用于创建真实 dom 的相关信息
      type: type,
      key: key,
      ref: ref,
      props: props,

      _owner: owner,
    };

    if (__DEV__) {
      element._store = {};

      // 开发环境下将 _store、_self、_source 设置为不可枚举，提高 element 的比较性能
      Object.defineProperty(element._store, 'validated', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false,
      });

      Object.defineProperty(element, '_self', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self,
      });

      Object.defineProperty(element, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source,
      });
      // 冻结 element 和 props，防止被手动修改
      if (Object.freeze) {
        Object.freeze(element.props);
        Object.freeze(element);
      }
    }

    return element;
  };
  ```

所以通过流程图总结一下 createElement 所做的事情如下：
<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d5195bfc57b2438a9e34eee55573b48e~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

# React.Component 源码

我们回到上述 hello,world 应用程序代码中，创建类组件时，我们继承了从 react 库中引入的 `Component`，我们再看一下[React.Component 源码](https://github.com/facebook/react/blob/17.0.2/packages/react/src/ReactBaseClasses.js)：

```js
function Component(props, context, updater) {
  // 接收 props，context，updater 进行初始化，挂载到 this 上
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  // updater 上挂载了 isMounted、enqueueForceUpdate、enqueueSetState 等触发器方法
  this.updater = updater || ReactNoopUpdateQueue;
}

// 原型链上挂载 isReactComponent，在 ReactDOM.render 时用于和函数组件做区分
Component.prototype.isReactComponent = {};

// 给类组件添加 `this.setState` 方法
Component.prototype.setState = function (partialState, callback) {
  // 验证参数是否合法
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null
  );
  // 添加至 enqueueSetState 队列
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

// 给类组件添加 `this.forceUpdate` 方法
Component.prototype.forceUpdate = function (callback) {
  // 添加至 enqueueForceUpdate 队列
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
```

从源码上可以得知，`React.Component` 主要做了以下几件事情：

- 将 props, context, updater 挂载到 this 上
- 在 Component 原型链上添加 isReactComponent 对象，用于标记类组件
- 在 Component 原型链上添加 `setState` 方法
- 在 Component 原型链上添加 `forceUpdate` 方法
  这样我们就理解了 react 类组件的 `super()` 作用，以及 `this.setState` 和 `this.forceUpdate` 的由来

# 总结

本章讲述了 jsx 在 react17 之前和之后的不同的转换，实际上 react17 之后 babel 的对 jsx 的转换就是比之前多了一步 `React.createElement` 的动作：
<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/19eedac5735143e4a9ffab251f136f6a~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

另外讲述了 `React.createElement` 和 `React.Component` 的内部实现是怎样的。通过 babel 及 `React.createElement`，将 jsx 转换为了浏览器能够识别的原生 js 语法，为 react 后续对状态改变、事件响应以及页面更新等奠定了基础。

后面的章节中，将探究 react 是如何一步步将状态等信息渲染为真实页面的。
