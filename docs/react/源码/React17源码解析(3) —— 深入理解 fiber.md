---
tag: ['react']
---

react16 版本之后引入了 fiber，整个架构层面的 调度、协调、diff 算法以及渲染等都与 fiber 密切相关。所以为了更好地讲解后面的内容，需要对 fiber 有个比较清晰的认知。本章将介绍以下内容：

> - 为什么需要 fiber
> - fiber 节点结构中的属性
> - fiber 树是如何构建与更新的

## 为什么需要 fiber

Lin Clark 在 [React Conf 2017](http://conf2017.reactjs.org/speakers/lin) 的演讲中，他通过漫画的形式，很好地讲述了 fiber 为何出现，下面我根据她的演讲，结合我自己的理解来谈一谈 fiber 出现的原因。

### fiber 之前

在 react15 及之前 fiber 未出现时，react 的一系列执行过程例如生命周期执行、虚拟 dom 的比较、dom 树的更新等都是同步的，一旦开始执行就不会中断，直到所有的工作流程全部结束为止。

要知道，react 所有的状态更新，都是从根组件开始的，当应用组件树比较庞大时，一旦状态开始变更，组件树层层递归开始更新，js 主线程就不得不停止其他工作。例如组件树一共有 1000 个组件需要更新，每个组件更新所需要的时间为 1s，那么在这 1s 内浏览器都无法做其他的事情，用户的点击输入等交互事件、页面动画等都不会得到响应，体验就会非常的差。

这种情况下，函数堆栈的调用就像下图一样，层级很深，很长时间不会返回：
<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8e6738e56dad4ecd935ba9ea40ef9ca6~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### fiber 之后

为了解决这一问题，react 引入了 fiber 这种数据结构，将更新渲染耗时长的大任务，分为许多的小片。每个小片的任务执行完成后，都先去执行其他高优先级的任务(例如用户点击输入事件、动画等)，这样 js 的主线程就不会被 react 独占，虽然任务执行的总时间不变，但是页面能够及时响应高优先级任务，显得不会卡顿了。

fiber 分片模式下，浏览器主线程能够定期被释放，保证了渲染的帧率，函数的堆栈调用如下（波谷表示执行分片任务，波峰表示执行其他高优先级任务）：
<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a96db90f08de4405a865b54c67e22e5f~tplv-k3u1fbpfcp-watermark.image?" width="100%" />
react 通过 fiber，为我们提供了一种跟踪、调度、暂停和中止工作的便捷方式，保证了页面的性能和流畅度。

## fiber 节点结构

fiber 是一种数据结构，每个 fiber 节点的内部，都保存了 dom 相关信息、fiber 树相关的引用、要更新时的副作用等，我们可以看一下[源码](https://github.com/facebook/react/blob/17.0.2/packages/react-reconciler/src/ReactInternalTypes.js)中的 fiber 结构：

```ts
// packages/react-reconciler/src/ReactInternalTypes.js

export type Fiber = {|
  // 作为静态数据结构，存储节点 dom 相关信息
  tag: WorkTag, // 组件的类型，取决于 react 的元素类型
  key: null | string,
  elementType: any, // 元素类型
  type: any, // 定义与此fiber关联的功能或类。对于组件，它指向构造函数；对于DOM元素，它指定HTML tag
  stateNode: any, // 真实 dom 节点

  // fiber 链表树相关
  return: Fiber | null, // 父 fiber
  child: Fiber | null, // 第一个子 fiber
  sibling: Fiber | null, // 下一个兄弟 fiber
  index: number, // 在父 fiber 下面的子 fiber 中的下标

  ref:
    | null
    | (((handle: mixed) => void) & {_stringRef: ?string, ...})
    | RefObject,

  // 工作单元，用于计算 state 和 props 渲染
  pendingProps: any, // 本次渲染需要使用的 props
  memoizedProps: any, // 上次渲染使用的 props
  updateQueue: mixed, // 用于状态更新、回调函数、DOM更新的队列
  memoizedState: any, // 上次渲染后的 state 状态
  dependencies: Dependencies | null, // contexts、events 等依赖

  mode: TypeOfMode,

  // 副作用相关
  flags: Flags, // 记录更新时当前 fiber 的副作用(删除、更新、替换等)状态
  subtreeFlags: Flags, // 当前子树的副作用状态
  deletions: Array<Fiber> | null, // 要删除的子 fiber
  nextEffect: Fiber | null, // 下一个有副作用的 fiber
  firstEffect: Fiber | null, // 指向第一个有副作用的 fiber
  lastEffect: Fiber | null, // 指向最后一个有副作用的 fiber

  // 优先级相关
  lanes: Lanes,
  childLanes: Lanes,

  alternate: Fiber | null, // 指向 workInProgress fiber 树中对应的节点

  actualDuration?: number,
  actualStartTime?: number,
  selfBaseDuration?: number,
  treeBaseDuration?: number,
  _debugID?: number,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
  _debugNeedsRemount?: boolean,
  _debugHookTypes?: Array<HookType> | null,
|};
```

### dom 相关属性

fiber 中和 dom 节点相关的信息主要关注 `tag`、`key`、`type` 和 `stateNode`。

#### tag

fiber 中 `tag` 属性的 ts 类型为 workType，用于标记不同的 react 组件类型，我们可以看一下[源码](https://github.com/facebook/react/blob/17.0.2/packages/react-reconciler/src/ReactWorkTags.js)中 workType 的枚举值：

```ts
// packages/react-reconciler/src/ReactWorkTags.js

export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const FundamentalComponent = 20;
export const ScopeComponent = 21;
export const Block = 22;
export const OffscreenComponent = 23;
export const LegacyHiddenComponent = 24;
```

在 react 协调时，beginWork 和 completeWork 等流程时，都会根据 `tag` 类型的不同，去执行不同的函数处理 fiber 节点。

#### key 和 type

`key` 和 `type` 两项用于 react diff 过程中确定 fiber 是否可以复用。

`key` 为用户定义的唯一值。`type` 定义与此 fiber 关联的功能或类。对于组件，它指向函数或者类本身；对于 DOM 元素，它指定 HTML tag。

#### stateNode

`stateNode`  用于记录当前  fiber  所对应的真实  dom  节点或者当前虚拟组件的实例，这么做的原因第一是为了实现  `Ref` ，第二是为了实现真实 dom  的跟踪。

### 链表树相关属性

我们看一下和 fiber 链表树构建相关的 `return`、`child` 和 `sibling` 几个字段：

- return：指向父 fiber，若没有父 fiber 则为 null
- child： 指向第一个子 fiber，若没有任何子 fiber 则为 null
- sibling：指向下一个兄弟 fiber，若没有下一个兄弟 fiber 则为 null
  通过这几个字段，各个 fiber 节点构成了 fiber 链表树结构：
  <img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dff49d5527094ed99d39f17618e9cbc1~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### 副作用相关属性

首先理解一下 react 中的副作用，举一个生活中比较通俗的例子：我们感冒了本来吃点药就没事了，但是吃了药发现身体过敏了，而这个“过敏”就是副作用。react 中，我们修改了 state、props、ref 等数据，除了数据改变之外，还会引起 dom 的变化，这种 render 阶段不能完成的工作，我们称之为副作用。

#### flags

react 中通过 flags 记录每个节点  diff  后需要变更的状态，例如 dom 的添加、替换、删除等等。我们可以看一下[源码](https://github.com/facebook/react/blob/17.0.2/packages/react-reconciler/src/ReactFiberFlags.js)中 Flags 枚举类型：

例如 `Deletion` 代表更新时要对 dom 进行删除，`Placement` 代表要进行添加或者替换等等。

```ts
// packages/react-reconciler/src/ReactFiberFlags.js

export type Flags = number;

export const NoFlags = /*                      */ 0b000000000000000000;
export const PerformedWork = /*                */ 0b000000000000000001;
export const Placement = /*                    */ 0b000000000000000010;
export const Update = /*                       */ 0b000000000000000100;
export const PlacementAndUpdate = /*           */ 0b000000000000000110;
export const Deletion = /*                     */ 0b000000000000001000;
export const ContentReset = /*                 */ 0b000000000000010000;
export const Callback = /*                     */ 0b000000000000100000;
export const DidCapture = /*                   */ 0b000000000001000000;
export const Ref = /*                          */ 0b000000000010000000;
export const Snapshot = /*                     */ 0b000000000100000000;
export const Passive = /*                      */ 0b000000001000000000;
export const PassiveUnmountPendingDev = /*     */ 0b000010000000000000;
export const Hydrating = /*                    */ 0b000000010000000000;
export const HydratingAndUpdate = /*           */ 0b000000010000000100;
export const LifecycleEffectMask = /*          */ 0b000000001110100100;
export const HostEffectMask = /*               */ 0b000000011111111111;
export const Incomplete = /*                   */ 0b000000100000000000;
export const ShouldCapture = /*                */ 0b000001000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b000100000000000000;
export const PassiveStatic = /*                */ 0b001000000000000000;
export const BeforeMutationMask = /*           */ 0b000000001100001010;
export const MutationMask = /*                 */ 0b000000010010011110;
export const LayoutMask = /*                   */ 0b000000000010100100;
export const PassiveMask = /*                  */ 0b000000001000001000;
export const StaticMask = /*                   */ 0b001000000000000000;
export const MountLayoutDev = /*               */ 0b010000000000000000;
export const MountPassiveDev = /*              */ 0b100000000000000000;
```

#### Effect List

在 render 阶段时，react 会采用深度优先遍历，对 fiber 树进行遍历，把每一个有副作用的 fiber 筛选出来，最后构建生成一个只带副作用的 Effect list 链表。和该链表相关的字段有 `firstEffect`、`nextEffect` 和 `lastEffect`：

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/65f08488cf6642618e218938419b3bd0~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

`firstEffect` 指向第一个有副作用的 fiber 节点，`lastEffect` 指向最后一个有副作用的节点，中间的节点全部通过 `nextEffect` 链接，最终形成 Effect 链表。

在 commit 阶段，React 拿到 Effect list 链表中的数据后，根据每一个 fiber 节点的 flags 类型，对相应的 DOM 进行更改。

### 其他

其他需要重点关注一下的属性还有 `lane` 和 `alternate`。

#### lane

`lane` 代表 react 要执行的 fiber 任务的优先级，通过这个字段，render 阶段 react 确定应该优先将哪些任务提交到 commit 阶段去执行。

我们看一下[源码](https://github.com/facebook/react/blob/17.0.2/packages/react-reconciler/src/ReactFiberLane.js)中 `lane` 的枚举值：

```ts
// packages/react-reconciler/src/ReactFiberLane.js

InputDiscreteHydrationLane: Lane = /*                   */ 0b0000000000000000000000000000100;
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;
const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000100000;
const InputContinuousLanes: Lanes = /*                  */ 0b0000000000000000000000011000000;
export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000100000000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;
const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000001000000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;
const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;
export const SomeRetryLane: Lanes = /*                  */ 0b0000010000000000000000000000000;
export const SelectiveHydrationLane: Lane = /*          */ 0b0000100000000000000000000000000;
const NonIdleLanes = /*                                 */ 0b0000111111111111111111111111111;
export const IdleHydrationLane: Lane = /*               */ 0b0001000000000000000000000000000;
const IdleLanes: Lanes = /*                             */ 0b0110000000000000000000000000000;
export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;
```

同 Flags 的枚举值一样，Lanes 也是用 31 位的二进制数表示，表示了 31 条赛道，位数越小的赛道，代表的优先级越高。

例如 `InputDiscreteHydrationLane`、`InputDiscreteLanes`、`InputContinuousHydrationLane` 等用户交互引起的更新的优先级较高，`DefaultLanes` 这种请求数据引起更新的优先级中等，而 `OffscreenLane`、`IdleLanes` 这种优先级较低。

优先级越低的任务，在 render 阶段越容易被打断，commit 执行的时机越靠后。

#### alternate

当 react 的状态发生更新时，当前页面所对应的 fiber 树称为 <b>current Fiber</b>，同时 react 会根据新的状态构建一颗新的 fiber 树，称为 <b>workInProgress Fiber</b>。current Fiber 中每个 fiber 节点通过 `alternate` 字段，指向 workInProgress Fiber 中对应的 fiber 节点。同样 workInProgress Fiber 中的 fiber
节点的 `alternate` 字段也会指向 current Fiber 中对应的 fiber 节点。

## fiber 树的构建与更新

下面我们结合源码，来看一下实际工作过程中 fiber 树的构建与更新过程。

### mount 过程

react 首次 mount 开始执行时，以 `ReactDOM.render` 为入口函数，会经过如下一系列的函数调用：`ReactDOM.render` ——> `legacyRenderSubtreeIntoContainer` ——> `legacyCreateRootFromDOMContainer` ——> `createLegacyRoot` ——> `ReactDOMBlockingRoot` ——> `ReactDOMRoot` ——> `createRootImpl` ——> `createContainer` ——> `createFiberRoot` ——> `createHostRootFiber` ——> `createFiber`

在 `createFiber` 函数中，调用 `FiberNode` 构造函数，创建了 rootFiber，它是 react 应用的根 fiber：

```ts
// packages/react-reconciler/src/ReactFiber.old.js

const createFiber = function (
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode
): Fiber {
  return new FiberNode(tag, pendingProps, key, mode);
};
```

在 `createFiberRoot` 函数中，调用 `FiberRootNode` 构造函数，创建了 fiberRoot，它指向真实根 dom 节点。

```ts
// packages/react-reconciler/src/ReactFiberRoot.old.js

export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
```

另外 `createFiberRoot` 函数中，还让 rootFiber 的 `stateNode` 字段指向了 fiberRoot，fiberRoot 的 `current` 字段指向了 rootFiber。从而一颗最原始的 fiber 树根节点就创建完成了：

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9dca24f545db45f4a00335e68767420e~tplv-k3u1fbpfcp-watermark.image?" width="40%" />

上面的 rootFiber 和 fiberRoot 创建完成后，react 就会根据 jsx 的内容去创建详细的 dom 树了，例如有如下的 jsx：

```html
<div id="root">
  <div id="a1">
    <div id="b1">
      <div id="c1">
        <div id="d1"></div>
        <div id="d2"></div>
        <div id="d3"></div>
      </div>
      <div id="c2"></div>
    </div>
  </div>
</div>
```

react 对于 fiber 结构的创建和更新，都是采用深度优先遍历，从 rootFiber(此处对应 id 为 root 的节点)开始，首先创建 child a1，然后发现 a1 有子节点 b1，继续对 b1 进行遍历，b1 有子节点 c1，再去创建 c1 的子节点 d1、d2、d3，直至发现 d1、d2、d3 都没有子节点来了，再回去创建 c2.

上面的过程，每个节点开始创建时，执行 `beginWork` 流程，直至该节点的所有子孙节点都创建(更新)完成后，执行 `completeWork` 流程，过程的图示如下：
<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3fb11e0759914dbc9563637fbb17c199~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### update 过程

update 时，react 会根据新的 jsx 内容创建新的 workInProgress fiber，还是通过深度优先遍历，对发生改变的 fiber 打上不同的 `flags` 副作用标签，并通过 `firstEffect`、`nextEffect` 等字段形成 Effect List 链表。

例如上面的 jsx 结构，发生了如下的更新：

```diff
<div id="root">
  <div id="a1">
    <div id="b1">
      <div id="c1">
        <div id="d1"></div>
-       <div id="d2"></div>
-       <div id="d3"></div>
      </div>
-     <div id="c2"></div>
+     <div id="c2">new content</div>
    </div>
  </div>
</div>
```

react 会根据新的 jsx 解析后的内容，调用 `createWorkInProgress` 函数创建 workInProgress fiber，对其标记副作用：

```js
// packages/react-reconciler/src/ReactFiber.old.js

export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // 区分 mount 还是 update
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    if (__DEV__) {
      workInProgress._debugID = current._debugID;
      workInProgress._debugSource = current._debugSource;
      workInProgress._debugOwner = current._debugOwner;
      workInProgress._debugHookTypes = current._debugHookTypes;
    }

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;

    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;

    if (enableProfilerTimer) {
      workInProgress.actualDuration = 0;
      workInProgress.actualStartTime = -1;
    }
  }

  // 重置所有的副作用
  workInProgress.flags = current.flags & StaticMask;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // 克隆依赖
  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext,
        };

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  if (enableProfilerTimer) {
    workInProgress.selfBaseDuration = current.selfBaseDuration;
    workInProgress.treeBaseDuration = current.treeBaseDuration;
  }

  if (__DEV__) {
    workInProgress._debugNeedsRemount = current._debugNeedsRemount;
    switch (workInProgress.tag) {
      case IndeterminateComponent:
      case FunctionComponent:
      case SimpleMemoComponent:
        workInProgress.type = resolveFunctionForHotReloading(current.type);
        break;
      case ClassComponent:
        workInProgress.type = resolveClassForHotReloading(current.type);
        break;
      case ForwardRef:
        workInProgress.type = resolveForwardRefForHotReloading(current.type);
        break;
      default:
        break;
    }
  }

  return workInProgress;
}
```

最终生成的 workInProgress fiber 图示如下：
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a11b119f8a447ffb514dda715eef78f~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

然后如上面所说，current fiber 和 workInProgress fiber 中对应的 alternate 会相互指向，然后 workInProgress fiber 完全创建完成后，fiberRoot 的 `current` 字段的指向会从 current fiber 中的 rootFiber 改为 workInProgress fiber 中的 rootFiber：

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5402ddc2fca140a9b52d9e5938c079f0~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

## 总结

本章讲解了 fiber 出现的主要原因、fiber 节点中主要的属性以及 fiber 树是如何构建与更新的。

理解了 fiber 之后，我们后面的章节就会对[React17 源码解析(1) —— 源码目录及 react 架构](https://juejin.cn/post/7015853155367780383)中的 react 更新过程展开更加详细的讲解，例如 render 过程是如何对任务优先级划分的、如何中断和恢复任务的、diff 过程是如何执行的，commit 阶段是如何渲染页面的等等。欢迎关注本专栏以便及时查看后面更新的章节。
