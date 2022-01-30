---
desc: '本文将细节分析 koa 的源码，并基于其原理实现一个简易版的 koa。'
cover: 'https://image-1300099782.cos.ap-beijing.myqcloud.com/blog%2Fkoa.png'
tag: ['node', 'koa']
time: '2021-05-27'
---

# Koa 源码解读及实现一个简易版 Koa

## Koa 框架介绍

koa 是由 Express 原班人马打造的，致力于成为一个更小、更富有表现力、更健壮的 Web 框架。使用 koa 编写 web 应用，通过组合不同的 generator，可以免除重复繁琐的回调函数嵌套，并极大地提升错误处理的效率。koa 不在内核方法中绑定任何中间件，它仅仅提供了一个轻量优雅的函数库，使得编写 Web 应用变得得心应手。

### 特点

- 轻量、无捆绑
- 中间件架构
- 通过不同的 generator 以及 await/async 替代了回调
- 增强的错误处理
- 简单易用的 api

### 简单使用

Koa 对 node 服务进行了封装，并提供了简单易用的 API。假如我们想在请求 3000 端口时返回 `hello, node!` 的数据，使用原生 node 实现代码如下：

```js
const http = require('http');

const server = http.createServer((req, res) => {
  res.end('hello, node!');
});

server.listen(3000, () => {
  console.log('server is running on 3000...');
});
```

使用 Koa 实现如下：

```js
const Koa = require('koa');
const app = new Koa();

app.use((ctx, next) => {
  ctx.body = 'hello, node!';
});

app.listen(3000, () => {
  console.log('server is running on 3000...');
});
```

通过对比可以发现，koa 实现方式通过 `new Koa()` 创建了一个 koa 实例，实例上有 `use` 方法，`use` 的回调函数中接收 `ctx` 和 `next` 两个参数。就这简单的几点，基本就组成了 koa 的全部内容。

### 中间件和洋葱圈模型

中间件是 Koa 的核心，koa 通过 `use()` 去调用一系列的中间件，并通过 `next()` 将上下文交给下一个中间件去进行处理。当没有下一个 `next()` 可执行之后，再倒序执行每个 `use()` 回调函数中 `next` 之后的逻辑。

这就是 koa 的洋葱圈模型：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b5a3deece4df4464acbfab60883b843b~tplv-k3u1fbpfcp-watermark.image)

如下一段代码，在请求 `localhost:3000` 端口后 node 控制台打印顺序为: `1、3、5、6、4、2`：

```js
const Koa = require('koa');
const app = new Koa();

app.use((ctx, next) => {
  console.log(1);
  next();
  console.log(2);
});

app.use((ctx, next) => {
  console.log(3);
  next();
  console.log(4);
});

app.use((ctx, next) => {
  console.log(5);
  ctx.body = 'hello, node!';
  console.log(6);
});

app.listen(3000, () => {
  console.log('server is running on 3000...');
});
```

## Koa 源码结构

[Koa 源码](https://github.com/koajs/koa)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58566dcd3e5a4ef995662e44187f7d85~tplv-k3u1fbpfcp-watermark.image)
Koa 的核心文件一共有四个：`application.js`、`context.js`、`request.js`、`response.js`。所有的代码加起来不到 2000 行，十分的轻便，而且大量代码集中在 `request.js` 和 `response.js` 对于请求头和响应头的处理，核心代码只有几百行。

### application

`application.js` 是 koa 的入口文件，里面导出了 koa 的构造函数，构造函数中包含了 koa 的主要功能实现。

#### listen

application 构造函数首先通过 node 中 http 模块，实现了 `listen` 功能:

```js
listen(...args) {
    debug('listen');
    const server = http.createServer(this.callback());
    return server.listen(...args);
}
```

#### use

use 方法将接收到的中间件函数，全部添加到了 `this.middleware` 中，以便后面按顺序调用各个中间件。同时为了兼容 koa1 中的 use 使用，对于 generator 类型的中间件函数，会通过 `koa-convert` 库将其进行转换，以兼容 koa2 中的 koa 的递归调用。

```js
use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
    if (isGeneratorFunction(fn)) { // 兼容 koa1 的 use 用法
      deprecate('Support for generators will be removed in v3. ' +
                'See the documentation for examples of how to convert old middleware ' +
                'https://github.com/koajs/koa/blob/master/docs/migration.md');
      fn = convert(fn);
    }
    debug('use %s', fn._name || fn.name || '-');
    this.middleware.push(fn);
    return this;
}
```

#### callback

上面 listen 函数在服务启动时，`createServer` 函数会返回 callback 函数的执行结果。

在服务启动时，callback 函数做了中间件的合并，监听框架层的错误请求等功能。

然后返回了 `handleRequest` 的方法，它接收 req 和 res 两个参数，每次服务端收到请求时，会根据 node http 原生的 req 和 res，创建一个新的 koa 的上下文 ctx。

```js
 callback() {
    const fn = compose(this.middleware); // 合并中间件

    if (!this.listenerCount('error')) this.on('error', this.onerror); // 捕获框架层的错误

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res); // 创建上下文
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }
```

#### createContext

再来看 `createContext` 函数，一大串的赋值骚操作，我们细细解读一下:

1. 先通过 `Object.create()`，创建了新的从 `context.js`、`request.js`、`response.js` 引入的对象，防止引入的原始对象被污染。

2. 通过 `context.request = Object.create(this.request)` 和 `context.response = Object.create(this.response)` 将 request 和 response 对象挂载到了 context 对象上。这部分对应了 `context.js` 中 delegate 的委托部分(有关 delegate 可以见后面 koa 核心库部分的解读)，能让 ctx 直接通过 `ctx.xxx` 去访问到 `ctx.request.xxx` 和 `ctx.response.xxx`

3. 通过一系列的赋值操作，将原始的 http 请求的 res 和 req，以及 Koa 实例 app 等等分别挂载到了 context、request 和 response 对象中，以便于在 `context.js`、`request.js` 和`response.js` 中针对原始的请求、相应参数等做一些系列的处理访问，便于用户使用

```js
createContext(req, res) {
    // Object.create()创建
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};
    return context;
  }
```

最终这段代码执行后的关系图如下：
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4cc61ff5c932457d9430eb241e6fe8bd~tplv-k3u1fbpfcp-watermark.image)

#### handleRequest

`callback` 中执行完 `createContext` 后，会将创建好的 ctx 以及合并中间件后生成的顺序执行函数传给 `handleRequest` 并执行该函数。

handleRequest 中会通过 `onFinished` 这个方法监听 res，当 res 完成、关闭或者出错时，便会执行 onerror 回调。
之后返回中间件执行的结果，当中间件全部执行完之后，执行 respond 进行数据返回操作。

```js
handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    onFinished(res, onerror);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
}
```

### context

#### cookies

`context.js` 中通过 get 和 set 方法做了 cookie 的设置和读取操作。

#### delegate

`context.js` 中有大量的 delegate 操作，是通过 delegate，可以让 ctx 能够直接访问其上面 response 和 request 中的属性和方法，即可以通过 `ctx.xxx` 获取到 `ctx.request.xxx` 或 `ctx.response.xxx` 。

delegate 是通过 `delegates` 这个库实现的，通过 `proto.__defineGetter__` 和 `proto.__defineSetter__` 去代理对象下面节点的属性和方法等。(`proto.__defineGetter__` 和 `proto.__defineSetter__` 现已被 mdn 废弃，改用 `Object.defineProperty()`)

```js
delegate(proto, 'response')
  .method('attachment')
  .method('redirect')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');
// ...

delegate(proto, 'request').method('acceptsLanguages').getter('ip');
// ...
```

`context.js` 中导出了一个 `context` 对象，主要用来在中间件以及其它各部件之间传递信息的，同时 `context` 对象上挂载了 `request` 和 `response` 两大对象。

另外其还做了 cookie 的处理以及使用 [delegates](https://www.npmjs.com/package/delegates) 库对 request 和 response 对象上面的事件和方法进行了委托，便于用户使用。

### request

`request.js` 导出了 request 对象，通过 `get()` 和 `set()` 方法对请求头的参数如 header、url、href、method、path、query……做了处理，挂载到了 request 对象上，方便用户获取和设置。

### response

同 `request.js` ，通过 `get()` 和 `set()`对响应参数做了处理。

## koa-compose

在 `application.js` 中，通过 `compose` 将中间件进行了合并，这也是 koa 的一个核心实现。

先来看 `koa-compose` 的源码，实现非常简单，只有几十行：

```js
function compose(middleware) {
  // middleware 中间件函数数组, 数组中是一个个的中间件函数
  if (!Array.isArray(middleware))
    throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function')
      throw new TypeError('Middleware must be composed of functions!');
  }
  return function (context, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index)
        return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
```

compose 接收一个中间件函数的数组，返回了一个闭包函数，闭包中维护了一个 index 去记录当前调用的中间件。

里面创建了一个 dispatch 函数，`dispatch(i)` 会通过 `Promise.resolve()` 返回 middleware 中的第 i 项函数执行结果，即第 i + 1 个 `app.use()` 传入的函数。 `app.use()` 回调的第二个参数是 `next`，所以当 `app.use()` 中的代码执行到 `next()` 时，便会执行 `dispatch.bind(null, i + 1))`，即执行下一个 `app.use()` 的回调。

依次类推，便将一个个 `app.use()` 的回调给串联了起来，直至没有下一个 next，边会按顺序返回执行每个 `app.use()` 的 `next()` 后面的逻辑。最终通过 `Promise.resolve()` 返回第一个 `app.use()` 的执行结果。

## 实现一个简单的 Koa

下面我们尝试实现一个简易版的 koa：

### 封装 node 的 http 模块

按照本文开篇的最简单示例去实现，新建 `application.js`，内部创建一个 MyKoa 类，基于 node 的 http 模块，实现 listen 函数：

```js
// application.js
const http = require('http');

class MyKoa {
  listen(...args) {
    const server = http.createServer((req, res) => {
      res.end('mykoa');
    });
    server.listen(...args);
  }
}

module.exports = MyKoa;
```

### 实现 use 方法和简易 createContext

然后要实现 `app.use()` 方法，我们看到 `app.use()` 中内部有 ctx.body，所以我们还需要实现一个简单的 ctx 对象。

1. 创建一个 `context.js`，内部导出 `ctx` 对象，分别通过 get 和 set，实现可以获取和设置 `ctx.body` 的值：

```js
// context.js
module.exports = {
  get body() {
    return this._body;
  },

  set body(value) {
    this._body = value;
  },
};
```

2. 在 `application.js` 的 MyKoa 类中添加 use 和 createContext 方法，同时 `res.end` 返回 `ctx.body`：

```js
const http = require('http');
const _context = require('./context');

class MyKoa {
  listen(...args) {
    const server = http.createServer((req, res) => {
      const ctx = this.createContext(req, res);
      this.callback();
      res.end(ctx.body);
    });
    server.listen(...args);
  }

  use(callback) {
    this.callback = callback;
  }

  createContext(req, res) {
    const ctx = Object.assign(_context);
    return ctx;
  }
}

module.exports = MyKoa;
```

### 完善 createContext

我们要通过 ctx 去访问请求头以及设置响应头等相关信息，例如 `ctx.query`，`ctx.message` 等等，就要创建 `response.js` 和 `request.js` 对请求头和响应头做处理，将 request 和 response 对象挂载到 ctx 对象上，同时实现一个 delegate 函数让 ctx 能够访问 request 和 response 上面的属性和方法。

1. 实现简单的 request 和 response，request 中通过 get 方法，能够解析 `req.url` 中的参数，将其转换为一个对象返回。response 中，通过 get 和 set `message`，能够获取和设置 `res.statusMessage` 的值：

```js
// request.js
module.exports = {
  get query() {
    const arr = this.req.url.split('?');
    if (arr[1]) {
      const obj = {};
      arr[1].split('&').forEach((str) => {
        const param = str.split('=');
        obj[param[0]] = param[1];
      });
      return obj;
    }
    return {};
  },
};
```

```js
// response.js
module.exports = {
  get message() {
    return this.res.statusMessage || '';
  },

  set message(msg) {
    this.res.statusMessage = msg;
  },
};
```

2. 新建一个 `utils.js`，导出 delegate 方法，delegate 内部通过 `Object.defineProperty` ，让传入的对象 obj 能够在属性 property 改变时实时监听，例如 `delegate(ctx, 'request')` 当 request 对象值改变时，ctx 对 request 代理也能获取最新的值。

   然后实现简单的 getter 和 setter，通过一个 listen 函数，当使用 getter 或者 setter 时，将对应的键添加到 setters 和 getters 中，让 obj 访问对应键时代理到 proterty 对应的键值：

```js
// utils.js
module.exports.delegate = function Delegate(obj, property) {
  let setters = [];
  let getters = [];
  let listens = [];

  function listen(key) {
    Object.defineProperty(obj, key, {
      get() {
        return getters.includes(key) ? obj[property][key] : obj[key]; // 如果通过 getter 代理了，则返回对应 obj[property][key] 的值，否则返回 obj[key] 的值
      },
      set(val) {
        if (setters.includes(key)) {
          obj[property][key] = val; 如果通过 setter 代理了，则设置对应 obj[property][key] 的值，否则设置 obj[key] 的值
        } else {
          obj[key] = val;
        }
      },
    });
  }

  this.getter = function (key) {
    getters.push(key);
    if (!listens.includes(key)) { // 防止重复调用listen
      listen(key);
      listens.push(key);
    }
    return this;
  };

  this.setter = function (key) {
    setters.push(key);
    if (!listens.includes(key)) { // 防止重复调用listenf
      listen(key);
      listens.push(key);
    }
    return this;
  };
  return this;
};
```

3. 在 context 使用 delegate 对 request 和 response 进行代理：

```js
// context.js
const { delegate } = require('./utils');
const context = (module.exports = {
  get body() {
    return this._body;
  },

  set body(value) {
    this._body = value;
  },
});
delegate(context, 'request').getter('query');
delegate(context, 'response').getter('message').setter('message');
```

4. 完善 createContext 函数：

```js
// application.js
const http = require('http');
const _context = require('./context');
const _request = require('./request');
const _response = require('./response');

class MyKoa {
  // ...
  createContext(req, res) {
    const ctx = Object.assign(_context);
    const request = Object.assign(_request);
    const response = Object.assign(_response);
    ctx.request = request;
    ctx.response = response;
    ctx.req = request.req = req;
    ctx.res = response.res = res;
    return ctx;
  }
}

module.exports = MyKoa;
```

### 实现中间件和洋葱模型

到现在为止，只剩下实现 app.use() 中间件的功能了。

1. 按照前面 koa-compose 分析的思路，`在 utils.js` 中，实现 compose：

```js
// utils.js
module.exports.compose = (middleware) => {
  return (ctx, next) => {
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error('error'));
      index = i;
      const cb = middleware[i] || next;
      if (!cb) return Promise.resolve();
      try {
        return Promise.resolve(
          cb(ctx, function next() {
            return dispatch(i + 1);
          })
        );
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };
};
```

2. 在 app.js 中，初始化 `this.middleware` 的数组，`use()` 函数中将 callback 添加进数组：

```js
// ...
class MyKoa {
  constructor() {
    this.middleware = [];
  }
  // ...

  use(callback) {
    this.middleware.push(callback);
  }
  // ...
}

module.exports = MyKoa;
```

3. listen 方法 createServer 中，遇到请求时将中间件合并，中间件执行完毕后返回 res 结果：

```js
// ...
const { compose } = require('./utils');

class MyKoa {
  // ...
  listen(...args) {
    const server = http.createServer((req, res) => {
      const ctx = this.createContext(req, res);
      //
      const fn = compose(this.middleware);
      fn(ctx)
        .then(() => {
          // 全部中间件执行完毕后，返回相应信息
          res.end(ctx.body);
        })
        .catch((err) => {
          throw err;
        });
    });
    server.listen(...args);
  }
  // ...
}
module.exports = MyKoa;
```

### 测试

到这里就大功告成了，引入我们的 Mykoa 在如下服务中测试一下：

```js
const Koa = require('../my-koa/application');
const app = new Koa();

app.use((ctx, next) => {
  ctx.message = 'ok';
  console.log(1);
  next();
  console.log(2);
});

app.use((ctx, next) => {
  console.log(3);
  next();
  console.log(4);
});

app.use((ctx, next) => {
  console.log(5);
  next();
  console.log(6);
});

app.use((ctx, next) => {
  console.log(ctx.message);
  console.log(ctx.query);
  ctx.body = 'hello, myKoa';
});

app.listen(3000, () => {
  console.log('server is running on 3000...');
});
```

访问 `http://localhost:3000/api?name=zlx` 接口，返回数据为`hello, myKoa` 。

node 服务器控制台打印内容如下：

```js
1;
3;
5;
ok;
{
  name: 'zlx';
}
6;
4;
2;
```

说明我们实现的没有任何问题！

## 源码

最后附上源码实现地址：
https://github.com/zh-lx/study-code/tree/main/node/koa
