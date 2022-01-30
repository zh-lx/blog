---
desc: '本文将介绍 SourceMap 的作用、简单工作原理以及 webpack 中不同 devtool 所构建的 SourceMap 有何区别，以及如何选择最合适的 devtool'
cover: 'https://img2.baidu.com/it/u=4161682823,2906342423&fm=253&fmt=auto&app=138&f=PNG?w=500&h=333'
tag: ['webpack']
time: '2021-05-07'
---

# 一文搞懂 SourceMap 以及 webpack devtool

本文将介绍 SourceMap 的作用、简单工作原理以及 webpack 中不同 devtool 所构建的 SourceMap 有何区别，以及如何选择最合适的 devtool，希望对大家有所帮助。

## 理解 SourceMap

### SourceMap 作用

随着各种打包工具的星期，为了提高前端项目的性能和不同浏览器上的兼容性，我们线上环境的代码一般都要经过如下等处理：

- 压缩混淆，减小体积
- 多个文件合并，减少 HTTP 请求数
- 将 es6+代码转换成浏览器能够识别的 es5 代码

经过如上的步骤之后，我们代码的性能和兼容性提高了，然后由于转换后的代码和源代码的不同，会导致我们的开发调试变得很困难，SourceMap 的诞生就是为了解决如上问题的。

简而言之，SourceMap 就是一个储存着代码位置信息的文件，转换后的代码的每一个位置，所对应的转换前的位置。有了它，点击浏览器的控制台报错信息时，可以直接显示出错源代码位置而不是转换后的代码。

用一个实例来加深理解，如下是一个简单的 `index.js` 文件，我们故意将最后一行 `console.log('hello world')` 错写成 `console.logo('hello world')`：

```js
const a = 1;
const b = 2;
console.log(a + b);
console.logo('hello world');
```

#### 无 SourceMap

我们将 `webpack.config.js` 的 devtool 选项配置为 `'none'`，打包上述的 `index.js` 文件：

```js
// ...
module.exports = {
  // ...
  mode: 'production',
  devtool: 'none',
  // ...
};
```

点击控制台出错代码如下，可以看到代码是压缩混淆之后的，我们难以追溯到出错的源代码：

![May-07-2021 09-10-55.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e3d2fa98e6c24eac897073d9d9004707~tplv-k3u1fbpfcp-watermark.image)

#### 有 SourceMap

将 `webpack.config.js` 的 devtool 选项配置由 `'none'` 改成 `source-map` 后，再次打包上面的 `index.js` 文件：

```js
// ...
module.exports = {
  // ...
  mode: 'production',
  devtool: 'source-map',
  // ...
};
```

点击控制台的报错，可以看到显示的是源代码，我们能够很清晰的定位到错误的行号，并且光标直接停留在错误代码所在的列：

![May-07-2021 09-08-40.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b70fa465584b4bf7854d05d5d07f81ba~tplv-k3u1fbpfcp-watermark.image)

通过如上对比，我们可以轻松的理解 SourceMap 带来的好处。那么 SourceMap 在浏览器上到底是如何工作的呢？

### SourceMap 工作原理

我们使用 webpack 打包并选择 devtool 为 `source-map` 后，每个打包后的 js 模块会有一个对应的.map 文件：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/65860eb97cf9461492d40bedda544448~tplv-k3u1fbpfcp-watermark.image)

打包出来的 `main.js.map`文件中，就是一个标准的 SourceMap 内容格式：

```json
{
  "version": 3,
  "sources": [
    "webpack:///webpack/bootstrap",
    "webpack:///./src/index.js",
    "webpack:///./src/add.js"
  ],
  "names": [
    // ...
    "p",
    "s",
    "console",
    "log",
    "a",
    "b",
    "add"
  ],
  "mappings": "aACE,IAAIA,EAAmB,GAGvB,SAASC,EAAoBC,GAG5B,GAAGF,EAAiBE,GACnB,OAAOF,EAAiBE,GAAUC,QAGnC,IAAIC,EAASJ,EAAiBE,GAAY,CACzCG,EAAGH,EACHI,GAAG,EACHH,QAAS,IAUV,OANAI,EAAQL,GAAUM,KAAKJ,EAAOD,QAASC,EAAQA,EAAOD,QAASF,GAG/DG,EAAOE,GAAI,EAGJF,EAAOD,QAKfF,EAAoBQ,EAAIF,EAGxBN,EAAoBS,EAAIV,EAGxBC,EAAoBU,EAAI,SAASR,EAASS,EAAMC,GAC3CZ,EAAoBa,EAAEX,EAASS,IAClCG,OAAOC,eAAeb,EAASS,EAAM,CAAEK,YAAY,EAAMC,IAAKL,KAKhEZ,EAAoBkB,EAAI,SAAShB,GACX,oBAAXiB,QAA0BA,OAAOC,aAC1CN,OAAOC,eAAeb,EAASiB,OAAOC,YAAa,CAAEC,MAAO,WAE7DP,OAAOC,eAAeb,EAAS,aAAc,CAAEmB,OAAO,KAQvDrB,EAAoBsB,EAAI,SAASD,EAAOE,GAEvC,GADU,EAAPA,IAAUF,EAAQrB,EAAoBqB,IAC/B,EAAPE,EAAU,OAAOF,EACpB,GAAW,EAAPE,GAA8B,iBAAVF,GAAsBA,GAASA,EAAMG,WAAY,OAAOH,EAChF,IAAII,EAAKX,OAAOY,OAAO,MAGvB,GAFA1B,EAAoBkB,EAAEO,GACtBX,OAAOC,eAAeU,EAAI,UAAW,CAAET,YAAY,EAAMK,MAAOA,IACtD,EAAPE,GAA4B,iBAATF,EAAmB,IAAI,IAAIM,KAAON,EAAOrB,EAAoBU,EAAEe,EAAIE,EAAK,SAASA,GAAO,OAAON,EAAMM,IAAQC,KAAK,KAAMD,IAC9I,OAAOF,GAIRzB,EAAoB6B,EAAI,SAAS1B,GAChC,IAAIS,EAAST,GAAUA,EAAOqB,WAC7B,WAAwB,OAAOrB,EAAgB,SAC/C,WAA8B,OAAOA,GAEtC,OADAH,EAAoBU,EAAEE,EAAQ,IAAKA,GAC5BA,GAIRZ,EAAoBa,EAAI,SAASiB,EAAQC,GAAY,OAAOjB,OAAOkB,UAAUC,eAAe1B,KAAKuB,EAAQC,IAGzG/B,EAAoBkC,EAAI,GAIjBlC,EAAoBA,EAAoBmC,EAAI,G,sCC/ErDC,QAAQC,ICHW,SAACC,EAAGC,GACrB,OAAOD,EAAIC,EDEDC,CAFF,EACA,IAEVJ,QAAQC,IAAI",
  "file": "main.js",
  "sourcesContent": [
    " \t// The module cache\n \tvar installedModules = {};\n\n \t// The require function\n \tfunction __webpack_require__(moduleId) {\n\n \t\t// Check if module is in cache\n \t\tif(installedModules[moduleId]) {\n \t\t\treturn installedModules[moduleId].exports;\n \t\t}\n \t\t// Create a new module (and put it into the cache)\n \t\tvar module = installedModules[moduleId] = {\n \t\t\ti: moduleId,\n \t\t\tl: false,\n \t\t\texports: {}\n \t\t};\n\n \t\t// Execute the module function\n \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n\n \t\t// Flag the module as loaded\n \t\tmodule.l = true;\n\n \t\t// Return the exports of the module\n \t\treturn module.exports;\n \t}\n\n\n \t// expose the modules object (__webpack_modules__)\n \t__webpack_require__.m = modules;\n\n \t// expose the module cache\n \t__webpack_require__.c = installedModules;\n\n \t// define getter function for harmony exports\n \t__webpack_require__.d = function(exports, name, getter) {\n \t\tif(!__webpack_require__.o(exports, name)) {\n \t\t\tObject.defineProperty(exports, name, { enumerable: true, get: getter });\n \t\t}\n \t};\n\n \t// define __esModule on exports\n \t__webpack_require__.r = function(exports) {\n \t\tif(typeof Symbol !== 'undefined' && Symbol.toStringTag) {\n \t\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });\n \t\t}\n \t\tObject.defineProperty(exports, '__esModule', { value: true });\n \t};\n\n \t// create a fake namespace object\n \t// mode & 1: value is a module id, require it\n \t// mode & 2: merge all properties of value into the ns\n \t// mode & 4: return value when already ns object\n \t// mode & 8|1: behave like require\n \t__webpack_require__.t = function(value, mode) {\n \t\tif(mode & 1) value = __webpack_require__(value);\n \t\tif(mode & 8) return value;\n \t\tif((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;\n \t\tvar ns = Object.create(null);\n \t\t__webpack_require__.r(ns);\n \t\tObject.defineProperty(ns, 'default', { enumerable: true, value: value });\n \t\tif(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));\n \t\treturn ns;\n \t};\n\n \t// getDefaultExport function for compatibility with non-harmony modules\n \t__webpack_require__.n = function(module) {\n \t\tvar getter = module && module.__esModule ?\n \t\t\tfunction getDefault() { return module['default']; } :\n \t\t\tfunction getModuleExports() { return module; };\n \t\t__webpack_require__.d(getter, 'a', getter);\n \t\treturn getter;\n \t};\n\n \t// Object.prototype.hasOwnProperty.call\n \t__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };\n\n \t// __webpack_public_path__\n \t__webpack_require__.p = \"\";\n\n\n \t// Load entry module and return exports\n \treturn __webpack_require__(__webpack_require__.s = 0);\n",
    "import { add } from './add';\nconst a = 1;\nconst b = 2;\nconsole.log(add(a, b));\nconsole.log('hello world');\n",
    "export const add = (a, b) => {\n  return a + b;\n};\n"
  ],
  "sourceRoot": ""
}
```

它包含以下内容：

- version: SourceMap 的版本，如今最新版本为 3
- sources: 源文件列表
- names: 源文件中的变量名
- mappings: 压缩混淆后的代码定位源代码的位置信息
- file: 该 Source Map 对应文件的名称
- sourcesContent: 源代码字符串列表，用于调试时展示源文件，列表每一项对应于 sources
- sourceRoot: 源文件根目录，这个值会加在每个源文件之前

`main.js` 文件的内容如下，里面含有 `//# sourceMappingURL=main.js.map` 这段内容：

```js
!(function (e) {
  var t = {};
  function n(r) {
    if (t[r]) return t[r].exports;
    var o = (t[r] = { i: r, l: !1, exports: {} });
    return e[r].call(o.exports, o, o.exports, n), (o.l = !0), o.exports;
  }
  (n.m = e),
    (n.c = t),
    (n.d = function (e, t, r) {
      n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: r });
    }),
    (n.r = function (e) {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(e, '__esModule', { value: !0 });
    }),
    (n.t = function (e, t) {
      if ((1 & t && (e = n(e)), 8 & t)) return e;
      if (4 & t && 'object' == typeof e && e && e.__esModule) return e;
      var r = Object.create(null);
      if (
        (n.r(r),
        Object.defineProperty(r, 'default', { enumerable: !0, value: e }),
        2 & t && 'string' != typeof e)
      )
        for (var o in e)
          n.d(
            r,
            o,
            function (t) {
              return e[t];
            }.bind(null, o)
          );
      return r;
    }),
    (n.n = function (e) {
      var t =
        e && e.__esModule
          ? function () {
              return e.default;
            }
          : function () {
              return e;
            };
      return n.d(t, 'a', t), t;
    }),
    (n.o = function (e, t) {
      return Object.prototype.hasOwnProperty.call(e, t);
    }),
    (n.p = ''),
    n((n.s = 0));
})([
  function (e, t) {
    console.log(3), console.log('hello world');
  },
]);
//# sourceMappingURL=main.js.map
```

浏览器在加载 `main.js` 时，通过 sourceMappingURL 加载对应的.map 文件，更加.map 文件的 SourceMap 内容中的 sources 字段，在浏览器的 Sources 中生成对应目录结构，之后再将 sourcesContent 中的内容对应填入上述生成的文件中，这样我们在调试时就可以将压缩混淆后的代码定位到对应的源代码位置。

如果选择 devtool 为`inline-source-map`，那么 sourceMappingURL 后面的内容则是以 base64 的形式内嵌的。

## webpack devtool 选项

更加 webpack 官网的文档显示，devtool 的可配置选项一共将近 30 个：
| devtool | performance | production | quality |
|------------------------------------------|--------------------------------|------------|----------------|
| (none) | build: fastest rebuild: fastest | yes | bundle |
| eval | build: fast rebuild: fastest | no | generated |
| eval-cheap-source-map | build: ok rebuild: fast | no | transformed |
| eval-cheap-module-source-map | build: slow rebuild: fast | no | original lines |
| eval-source-map | build: slowest rebuild: ok | no | original |
| cheap-source-map | build: ok rebuild: slow | no | transformed |
| cheap-module-source-map | build: slow rebuild: slow | no | original lines |
| source-map | build: slowest rebuild: slowest | yes | original |
| inline-cheap-source-map | build: ok rebuild: slow | no | transformed |
| inline-cheap-module-source-map | build: slow rebuild: slow | no | original lines |
| inline-source-map | build: slowest rebuild: slowest | no | original |
| eval-nosources-cheap-source-map | build: ok rebuild: fast | no | transformed |
| eval-nosources-cheap-module-source-map | build: slow rebuild: fast | no | original lines |
| eval-nosources-source-map | build: slowest rebuild: ok | no | original |
| inline-nosources-cheap-source-map | build: ok rebuild: slow | no | transformed |
| inline-nosources-cheap-module-source-map | build: slow rebuild: slow | no | original lines |
| inline-nosources-source-map | build: slowest rebuild: slowest | no | original |
| nosources-cheap-source-map | build: ok rebuild: slow | no | transformed |
| nosources-cheap-module-source-map | build: slow rebuild: slow | no | original lines |
| nosources-source-map | build: slowest rebuild: slowest | yes | original |
| hidden-nosources-cheap-source-map | build: ok rebuild: slow | no | transformed |
| hidden-nosources-cheap-module-source-map | build: slow rebuild: slow | no | original lines |
| hidden-nosources-source-map | build: slowest rebuild: slowest | yes | original |
| hidden-cheap-source-map | build: ok rebuild: slow | no | transformed |
| hidden-cheap-module-source-map | build: slow rebuild: slow | no | original lines |
| hidden-source-map | build: slowest rebuild: slowest | yes | original |

表格中我们配置不同的 devtool 选项，主要是为了达到不同的 quality 和 performance 目的

### quality 的理解

quality 描述了打包后我们在调试时能看到的源码内容：

- bundled: 模块未分离
- generated: 模块分离，未经 loader 处理的代码
- transformed: 模块分离，经 loader 处理过的代码
- original: 自己写的代码，定位精确到行、列
- original lines: 自己写的代码，定位只精确到行

### devtool 格式

devtool 的名称格式可以总结为，我们只需要记住以下每个选项的特点，就可以轻易理解所有的 devtool 选项了：

```
[inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map
```

#### inline-

将 SourceMap 内联到原始文件中，而不是创建一个单独的文件。

devtool 为 `source-map` 的情况下打包后，有一个.map 文件存储代码的映射关系：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5014bf5305e94198a22723ec07a8320f~tplv-k3u1fbpfcp-watermark.image)

devtool 为 `inline-source-map` 的情况下，映射关系会一同写到编译后的代码中：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f3e8c449702940629e1db73bb075e75c~tplv-k3u1fbpfcp-watermark.image)

#### hidden-

hidden 仍然会生成.map 文件，但是打包后的代码中没有 sourceMappingURL，也就是说请求代码时浏览器不会加载.map 文件，控制台中看不到源代码。这种一般用于错误收集等场景，出错时前端把出错的行列传给服务端，服务端根据行列以及.map 文件解析出出错的源码位置。

devtool 为 `source-map` 时，显示出错源代码位置：

![May-07-2021 09-08-40.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b70fa465584b4bf7854d05d5d07f81ba~tplv-k3u1fbpfcp-watermark.image)

devtool 为 `hidden-source-map` 时，只显示打包后的代码出错位置:

![May-07-2021 09-10-55.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e3d2fa98e6c24eac897073d9d9004707~tplv-k3u1fbpfcp-watermark.image)

#### eval-

eval- 会通过 `eval` 包裹每个模块打包后代码以及对应生成的 SourceMap，因为 `eval` 中为字符串形式，所以当源码变动的时候进行字符串处理会提升 rebuild 的速度。

但同样因为是 `eval` 包裹 js 代码，很容易被 XSS 攻击，存在很大的安全隐患。

另外，在现代浏览器中有两种编译模式：fast path 和 slow path。fast path 是编译那些稳定和可预测（stable and predictable）的代码。而明显的，eval 不可预测，所以将会使用 slow path。在旧的浏览器中，使用 eval 的性能会大幅下降。

综上，eval 我们一般只用于开发环境，不会用于打包线上环境的代码。

#### nosources-

使用这个关键字生成的 SourceMap 中不包含 sourcesContent 内容，因此调试时只能看到文件信息和行信息，无法看到源码。

![May-07-2021 09-06-48.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e9d770ea6669454d9ada28180b89141d~tplv-k3u1fbpfcp-watermark.image)

#### cheap-[module-]

使用 cheap 时，SourceMap 的代码定位只会定位到源码所在的行，不会定位至具体的列，所以构建速度有所提升。另外如果只用 cheap ，显示的是 loader 编译之后的源代码，加上 module 后会显示编译之前的源代码。

例如有如下代码：

```js
import { add } from './add';
const a = 1;
const b = 2;
console.log(add(a, b));
console.logo(111);
console.log('hello world');
```

使用 `source-map` 打包的结果，点击控制台的报错信息，可以看到直接定位到 loader 编译前的源代码，并且光标会定位到出错代码所在的列：

![May-07-2021 11-34-52.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/50dcd3525b954c2c9f64614e6d20463f~tplv-k3u1fbpfcp-watermark.image)

使用 `cheap-source-map` 打包，点击控制台的报错信息，是定位到了错误代码所在的行，但是光标并没有定位到错误代码所在的列。另外显示的源代码是经过了 loader 编译之后的代码，而不是原始的源代码：

![May-07-2021 11-37-39.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0af89f27a41f4ddda812801302716485~tplv-k3u1fbpfcp-watermark.image)

使用 `cheap-module-source-map` 打包，点击控制台的报错信息，可以看到显示的是 loader 编译前的源代码：

![May-07-2021 12-50-46.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bdc94c6dc01d4ebf8463802a14ed5862~tplv-k3u1fbpfcp-watermark.image)

## 如何选择 devtool

根据不同环境，我们需要选择不同的 devtool。

开发环境下，由于我们需要频繁的修改代码，更多的考虑的开发效率和调试效率，所以更多关注 performance 中 rebuild 的性能。

生产环境下，我们不必过多关注打包性能，主要考虑 quality 代码的保护性、出错的定位速度已经安全性等。

### production

线上环境官方推荐的 devtool 有 4 种：

- none
- source-map
- hidden-source-map
- nosources-source-map
  线上环境没有绝对的最优选择一说，根据自己业务需要去选择即可，很多项目也是选择除上述 4 种之外的 `cheap-module-source-map` 选项。

### development

开发环境选择就比较容易了，只需要考虑打包速度快、调试方便，官方推荐以下 4 种：

- eval
- eval-source-map
- eval-cheap-source-map
- eval-cheap-module-source-map
  大多数情况下我们选择 `eval-cheap-module-source-map` 即可。
