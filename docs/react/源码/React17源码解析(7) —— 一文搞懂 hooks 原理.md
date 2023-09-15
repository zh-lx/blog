---
desc: '本章将讲解 react hooks ，理解 hooks 的设计思想和工作过程，以及探究常用 hooks 的源码。'
cover: 'https://github.com/zh-lx/blog/assets/73059627/aa66652c-e6b2-40b4-b763-c9b1616b68a4'
tag: ['react']
time: '2021-10-21'
---

欢迎大家一起交流学习 react 源码，本系列导航请见：[React17 源码解析(开篇) —— 搭建 react 源码调试环境](https://juejin.cn/post/7014775797596553230/)

<hr />

本文将讲解 hooks 的执行过程以及常用的 hooks 的源码。

## hooks 相关数据结构

要理解 hooks 的执行过程，首先想要大家对 hooks 相关的数据结构有所了解，便于后面大家顺畅地阅读代码。

### Hook

每一个 hooks 方法都会生成一个类型为 Hook 的对象，用来存储一些信息，前面提到过函数组件 fiber 中的 memoizedState 会存储 hooks 链表，每个链表结点的结构就是 Hook。

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

export type Hook = {|
  memoizedState: any, // 上次渲染时所用的 state
  baseState: any, // 已处理的 update 计算出的 state
  baseQueue: Update<any, any> | null, // 未处理的 update 队列（一般是上一轮渲染未完成的 update）
  queue: UpdateQueue<any, any> | null, // 当前出发的 update 队列
  next: Hook | null, // 指向下一个 hook，形成链表结构
|};
```

举个例子，我们通过函数组件使用了两个 `useState` hooks：

```ts
const [name, setName] = useState('小科比');
const [age, setAge] = useState(23);
```

则实际的 Hook 结构如下：

```ts
{
  memoizedState: '小科比',
  baseState: '小科比',
  baseQueue: null,
  queue: null,
  next: {
    memoizedState: 23,
    baseState: 23,
    baseQueue: null,
    queue: null,
  },
};
```

不同的 hooks 方法，memoizedState 存储的内容不同，常用的 hooks memoizedState 存储的内容如下：

- useState: state
- useEffect: effect 对象
- useMemo/useCallback: [callback, deps]
- useRef: { current: xxx }

### Update & UpdateQueue

Update 和 UpdateQueue 是存储 `useState` 的 state 及 `useReducer` 的 reducer 相关内容的数据结构。

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

type Update<S, A> = {|
  lane: Lane, // 优先级
  // reducer 对应要执行的 action
  action: A,
  // 触发 dispatch 时的 reducer
  eagerReducer: ((S, A) => S) | null,
  // 触发 dispatch 是的 state
  eagerState: S | null,
  // 下一个要执行的 Update
  next: Update<S, A>,
  // react 的优先级权重
  priority?: ReactPriorityLevel,
|};

type UpdateQueue<S, A> = {|
  // 当前要触发的 update
  pending: Update<S, A> | null,
  // 存放 dispatchAction.bind() 的值
  dispatch: (A => mixed) | null,
  // 上一次 render 的 reducer
  lastRenderedReducer: ((S, A) => S) | null,
  // 上一次 render 的 state
  lastRenderedState: S | null,
|};
```

每次调用 `setState` 或者 `useReducer` 的 dispatch 时，都会生成一个 Update 类型的对象，并将其添加到 UpdateQueue 队列中。

例如，在如下的函数组件中:

```ts
const [name, setName] = useState('小科比');
setName('大科比');
```

当我们点击 input 按钮时，执行了 `setName()`，此时对应的 hook 结构如下：

```ts
{
  memoizedState: '小科比',
  baseState: '小科比',
  baseQueue: null,
  queue: {
    pending: {
      lane: 1,
      action: '大科比',
      eagerState: '大科比',
      // ...
    },
    lastRenderedState: '小科比',
    // ...
  },
  next: null,
};
```

最后 react 会遍历 UpdateQueue 中的每个 Update 去进行更新。

### Effect

Effect 结构是和 `useEffect` 等 hooks 相关的，我们看一下它的结构：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

export type Effect = {|
  tag: HookFlags, // 标记是否有 effect 需要执行
  create: () => (() => void) | void, // 回调函数
  destroy: (() => void) | void, // 销毁时触发的回调
  deps: Array<mixed> | null, // 依赖的数组
  next: Effect, // 下一个要执行的 Effect
|};
```

当我们的函数组件中使用了如下的 `useEffect` 时：

```ts
useEffect(() => {
  console.log('hello');
  return () => {
    console.log('bye');
  };
}, []);
```

对应的 Hook 如下：

```ts
{
  memoizedState: {
    create: () => { console.log('hello') },
    destroy: () => { console.log('bye') },
    deps: [],
    // ...
  },
  baseState: null,
  baseQueue: null,
  queue: null,
  next: null,
}
```

## 执行过程

下面我们探索一下 hooks 在 react 中具体的执行流程。

### 引入 hooks

我们以一个简单的 hooks 写法的 react 应用程序为例去寻找 hooks 源码:

```ts
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <input
        type="button"
        value="增加"
        onClick={() => {
          setCount(count + 1);
        }}
      />
    </div>
  );
}
```

根据引入的 `useState` api，我们找到 react hooks 的入口文件：

```ts
// packages/react/src/ReactHooks.js

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  // ...
  return dispatcher;
}

export function useState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

// ...
```

根据上面的源码我们可以知道，所有的 hooks api 都是挂载在 `resolveDispatcher` 中返回的 dispatcher 对象上面的，也就是挂载在 `ReactCurrentDispatcher.current` 上面，那么我们再继续去看一下 `ReactCurrentDispatcher` 是什么：

```ts
// packages/react/src/ReactCurrentDispatcher.js

import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';

const ReactCurrentDispatcher = {
  current: (null: null | Dispatcher),
};

export default ReactCurrentDispatcher;
```

到这里我们的线索就断了，`ReactCurrentDispatcher` 上只有一个 current 用于挂在 hooks，但是 hooks 的详细源码以及 `ReactCurrentDispatcher` 的具体内容我们并没有找到在哪里，所以我们只能另寻出路，从 react 的执行过程去入手。

### 函数组件更新过程

我们的 hooks 都是在函数组件中使用的，所以让我们去看一下 render 过程关于函数组件的更新。render 过程中的调度是从 `beginWork` 开始的，来到 `beginWork` 的源码后我们可以发现，针对函数组件的渲染和更新，使用了 `updateFunctionComponent` 函数：

```ts
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // ...
  switch (workInProgress.tag) {
    // ...
    case FunctionComponent: {
      // ...
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes
      );
    }
    // ...
  }
  // ...
}
```

那我们在继续看一下 `updateFunctionComponent` 函数的源码，里面调用了 `renderWithHooks` 函数，这便是函数组件更新和渲染过程执行的入口：

```ts
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps: any,
  renderLanes
) {
  // ...

  nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    context,
    renderLanes
  );

  // ...
}
```

### renderWithHooks

费劲千辛万苦，我们终于来到了函数组件更新过程的执行入口 —— `renderWithHooks` 函数的源码：

```ts
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  renderLanes = nextRenderLanes;
  // currentlyRenderingFiber 指向当前所执行的fiber
  currentlyRenderingFiber = workInProgress;

  // 置空 workInProgress fiber 中的 memoizedState 和 updateQueue
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // ...
  // 根据是否首次渲染，分别将 HooksDispatcherOnMount 和 HooksDispatcherOnUpdate 赋值给 ReactCurrentDispatcher.current
  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  // 执行函数组件的构造函数
  let children = Component(props, secondArg);

  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // didScheduleRenderPhaseUpdateDuringThisPass 为 true 说明发生了 re-render，会再次执行 render
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      // ...
      ReactCurrentDispatcher.current = __DEV__
        ? HooksDispatcherOnRerenderInDEV
        : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // ...
  // 函数执行结束后，关闭 hooks 入口
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  // ...当前 fiber 的任务执行结束，重置全局变量

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  didScheduleRenderPhaseUpdate = false;

  // ...

  return children;
}
```

`renderWithHooks` 函数中首先会将 workInProgress fiber 树的 memoizedState（前面[深入理解 fiber](https://juejin.cn/post/7016512949330116645) 一文中提到过，memoizedState 记录了当前页面的 state，在函数组件中，它以链表的形式记录了 hooks 信息） 和 updateQueue 置为 null，在接下来的函数组件执行过程中，会把新的 hooks 信息挂载到这两个属性上，然后在 commit 阶段，会将根据 current fiber 树构建当前的 workInProgress fiber 树，并保存 hooks 信息，用于替换真实的 DOM 元素节点。

然后会通过 current 上是否有 memoizedState，判断组件是否首次渲染，从而分别将 HooksDispatcherOnMount 和 HooksDispatcherOnUpdate 赋值给 `ReactCurrentDispatcher.current`。

接下来执行 `Component()` 来调用函数组件的构造函数，组件的 hooks 会被依次执行，并将 hooks 的信息保存到 workInProgress fiber 上（待会儿会细讲执行过程），然后将返回的 jsx 信息保存到 children 上。

最后会重置一些变量，并返回函数组件执行后的 jsx。

### 不同阶段更新 Hook

现在我们终于找到了 `ReactCurrentDispatcher.current` 的定义，首次渲染时，会将 `HooksDispatcherOnMount` 赋值给 `ReactCurrentDispatcher.current`，更新时，会将 `HooksDispatcherOnUpdate` 赋值给 `ReactCurrentDispatcher.current`， dispatcher 上面挂在了各种 hooks：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

const HooksDispatcherOnMount: Dispatcher = {
  readContext,

  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useMutableSource: mountMutableSource,
  useOpaqueIdentifier: mountOpaqueIdentifier,

  unstable_isNewReconciler: enableNewReconciler,
};

const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,

  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useMutableSource: updateMutableSource,
  useOpaqueIdentifier: updateOpaqueIdentifier,

  unstable_isNewReconciler: enableNewReconciler,
};
```

首次渲染时，`HooksDispatcherOnMount` 上挂载的 hook 都是 mountXXX，而更新时 `HooksDispatcherOnMount` 上挂在的 hook 都是 updateXXX。所有 mount 阶段的 hook 中，都会执行 `mountWorkInProgressHook` 这个函数，而所有 update 阶段的 hook 中，都会执行 `updateWorkInProgressHook` 这个函数。下面我们来看下这两个函数分别做了什么。

#### mountWorkInProgressHook

每个 hooks 方法中，都需要有一个 Hook 结构来存储相关信息。`mountWorkInProgressHook` 中，会初始化创建一个 fiber，然后将其挂载到 workInProgress fiber 的 memoizedState 所指向的 hooks 链表上，以便于下次 update 的时候取出该 Hook：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

  if (workInProgressHook === null) {
    // 若当前 workInProgressHook 为 null，将此 hook 作为 memoizedState 的头结点
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 若不为 null，将 hook 挂载到链表最后
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

#### updateWorkInProgressHook

`updateWorkInProgressHook` 的作用主要是取出 current fiber 中的 hooks 链表中对应的 hook 节点，挂载到 workInProgress fiber 上的 hooks 链表：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function updateWorkInProgressHook(): Hook {
  let nextCurrentHook: null | Hook;

  // 迭代 current fiber 链表
  if (currentHook === null) {
    // 若 current 为 null，从 currentlyRenderingFiber.alternate 取 current
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // 否则从 current fiber 中取下一个 hook
    nextCurrentHook = currentHook.next;
  }

  // 迭代 workInProgress fiber 链表
  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    // workInProgressHook 说明是首次创建
    nextWorkInProgressHook 为 null = currentlyRenderingFiber.memoizedState;
  } else {
    // 取下一个 workInProgress Hook
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // 只有 re-render 的情况下，nextWorkInProgressHook 不为 null，因为在之前的 render 过程中已经创建过 workInProgress hook了
    // 此时复用
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else {
    // 正常情况下，currentlyRenderingFiber.memoizedState 为 null，需要到从 current fiber 中克隆一个新的创建

    invariant(
      nextCurrentHook !== null,
      'Rendered more hooks than during the previous render.',
    );
    currentHook = nextCurrentHook;

    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    if (workInProgressHook === null) {
      // 若 workInProgressHook 为 null，作为首节点赋值给 memoizedState
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // 将 workInProgressHook 添加到链表尾
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }

  return workInProgressHook;
}
```

我们详细理解一下上述代码，前面我们提到过 `renderWithHooks` 函数中会执行如下代码： `workInProgress.memoizedState = null`，所以在执行上述函数时，正常来说 `currentlyRenderingFiber.memoizedState` 为 null，需要从 current fiber 对应的节点中取 clone 对应的 hook，再挂载到 workInProgress fiber 的 memoizedState 链表上；re-render 的情况下，由于已经创建过了 hooks，会复用已有的 workInProgress fiber 的 memoizedState。

这里正好提到，为什么 hook 不能用在条件语句中，因为如果前后两次渲染的条件判断不一致时，会导致 current fiber 和 workInProgress fiber 的 hooks 链表结点无法对齐。

### 总结

所以我们总结一下 `renderWithHooks` 这个函数，它所做的事情如下：
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ba2098cb979b4676a91b9eeb634101e5~tplv-k3u1fbpfcp-watermark.image?" width="60%">

## hooks 源码

前面 hooks 的执行入口我们都找到了，现在我们看一下常用的一些 hooks 源码。

### useState & useReducer

这里会把 useState 和 useReducer 放在一起来说，因为 useState 相当于一个简化版的 useReducer。

#### 用法

useState 的简单用法如下：

```ts
const [count, setCount] = useState(0);
// 改变 count 的值
setCount(count++);
```

useReducer 简单用法如下：

```ts
const [count, dispatch] = useReducer(function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return count + 1;
    default:
      return count;
  }
}, 0);
// 改变 count 的值
dispatch({ type: 'increment' });
```

#### mountState & mountReducer

我们先从 useState 开始讲起，mount 阶段，`useState` 对应的源码是 `mountState`。这里面后创建初始的 hook 和更新队列 queue，然后创建 dispatch，最终返回 `[hook.memoizedState, dispatch]`，对应的是我们代码中的 `[count, setCount]`，供我们使用：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 创建一个 hook，链接到 hooks 链表中
  const hook = mountWorkInProgressHook();
  // 校验初始的 state 是否是个函数，是的话执行该函数
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  // 前面提到过，对于 useState，memoizedState 保存的是 state
  hook.memoizedState = hook.baseState = initialState;
  // 创建更新队列 updateQueue
  const queue = (hook.queue = {
    pending: null, // 待执行的 hook
    dispatch: null, // 更新函数
    lastRenderedReducer: basicStateReducer, // 上次渲染的 reducer
    lastRenderedState: (initialState: any), // 上次渲染的 state
  });
  // 创建 dispatch（负责更新的函数）
  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  // 返回 useState 的 state 及 dispatch，供我们使用
  return [hook.memoizedState, dispatch];
}
```

再来看下 mount 阶段的 `useReducer` 的源码，也就是 `mountReducer`，可以看到和 `mountState` 所做的事情基本时一样的，`mountState` 可以看做是有一个初始 state 的 `mountReducer`：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = mountWorkInProgressHook();
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```

#### dispatchAction

上面的代码中，其他内容我们前面基本都有讲过，你们应该了解它们的作用，我们着重来看一下 dispatch，它是通过执行 `dispatchAction` 创建的。

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  // ...
  // 获取更新触发时间及优先级
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(fiber);

  // 初始化 update
  const update: Update<S, A> = {
    lane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: (null: any),
  };

  // 将 update 链接到更新队列中
  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // currentlyRenderingFiber 存在，说明是在 render 过程发生的更新
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // fiber.lanes === NoLanes 说明是首次更新
      // 如果值不同，则保存在eagerState，下次 render 时可以直接使用，而无需再计算。
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        if (__DEV__) {
          prevDispatcher = ReactCurrentDispatcher.current;
          ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnUpdateInDEV;
        }
        try {
          const currentState: S = (queue.lastRenderedState: any);
          // 我们可以根据当前 state 和 action 来计算新的 state 值
          const eagerState = lastRenderedReducer(currentState, action);
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            // 如果与当前值相同，则跳过更新
            return;
          }
          // 如果值不同，新一轮更新时渲染 eagerState
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
          if (__DEV__) {
            ReactCurrentDispatcher.current = prevDispatcher;
          }
        }
      }
    }
    // ...
    // 开启调度，触发新的一轮更新，也就是走 beginWork, completeWork 那一套流程
    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
  // ...

  if (enableSchedulingProfiler) {
    markStateUpdateScheduled(fiber, lane);
  }
}
```

首先，会创建一个初始的 update 对象，用来记录相关的 hook 信息，并将它添加到 queue 中，这里的 queue 的添加你可以发现它形成了一个循环链表，这样 pending 作为链表的一个尾结点，而 pending.next 就能够获取链表的头结点。这样做的目的是，在 `setCount` 时，我们需要将 update 添加到链表的尾部；而在下面的 `updateReducer` 中，我们需要获取链表的头结点来遍历链表，通过循环链表能够轻松实现我们的需求。

之后，会根据当前所处的阶段是否在 render 阶段发生：

- 如果是 render 阶段发生，那么会触发 re-render 过程，将 `didScheduleRenderPhaseUpdateDuringThisPass` 置为 true。前面 `renderWithHooks` 的代码中我们说了，`didScheduleRenderPhaseUpdateDuringThisPass` 为 true 时会代表 re-render，会重新执行 render 过程，直至其为 false。
- 如果不是在 render 阶段发生，那么会通过当前的 state 和 action 来判断下次渲染的 state 的值，并与当前 state 的值进行比较，如果两个值一致，则不需要更新，跳过更新过程；如果两个值不一致，调用 `scheduleUpdateOnFiber` 开始调度，触发新一轮更新。

#### updateReducer

update 时，`useState` 和 `useReducer` 就更没什么区别了，`updateState` 就是直接返回了 `updateReducer` 函数，所以我们直接看 `updateReducer` 的源码就可以。

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState: any));
}
```

`updateReducer` 中，用 `pending` 来指向本次要触发的 update，然后将本次 hook 要执行的 update 和 current fiber 中之前未完成的 update 全部链接到 `baseQueue`，也就是代表全局的 update。

在 render 阶段，会遍历 update 来计算 state 的值，若某个 update 的优先级低于当前 render 执行的任务的优先级，则跳过此次 update 及未遍历完的 update 的执行，先执行其他的 update。然后再下一次 render 时从跳过的 update 开始继续执行。

update 阶段 dispatch 会生成一个新的 update 链接到 hooks 中，并根据之前的 state 和本次 action 去计算新的 state。

`updateReducer` 的源码如下：

```ts
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 取出 hook 节点
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  invariant(
    queue !== null,
    'Should have a queue. This is likely a bug in React. Please file an issue.',
  );

  queue.lastRenderedReducer = reducer;

  const current: Hook = (currentHook: any);

  // 上次未完成的 update
  let baseQueue = current.baseQueue;

  // 获取本次待执行的 update
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    if (baseQueue !== null) {
      // 如果 baseQueue 和 pendingQueue 都存在，将 pendingQueue 链接到 baseQueue 尾部
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    // ...
    // react 的异步模型，可能发生一个更高优先级任务打断当前任务的执行
    // 所以要将 baseQueue 也赋值给 current fiber
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    // 遍历 hooks 链表，计算 state
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // 如果当前的 update 优先级低于 render 优先级，下次 render 时再执行本次的 update
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: (null: any),
        };
        // 把这个 update 添加到 newBaseQueue 中下次 render 执行
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // 更新 queue 的优先级
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane,
        );
        // 标记本次 update 跳过了
        markSkippedUpdateLanes(updateLane);
      } else {
        if (newBaseQueueLast !== null) {
          // newBaseQueueLast 不为 null，说明此前有跳过的 update
          // update 之间可能存在依赖，将后续 update 都连接到 newBaseQueue 中留到下次 render 执行
          const clone: Update<S, A> = {
            lane: NoLane,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: (null: any),
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // 执行本次的 update，计算新的 state
        if (update.eagerReducer === reducer) {
          // update.eagerReducer 和 reducer 相等，说明 reducer 已经计算过，直接取结算过的 state
          newState = ((update.eagerState: any): S);
        } else {
          // 根据 state 和 action 计算新的 state
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      // newBaseQueueLast 为 null，说明所有 update 处理完了，更新 baseState
      newBaseState = newState;
    } else {
      // 未处理完留到下次执行
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }

    // 如果新的 state 和之前的 state 不相等，标记需要更新
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    // 将新的 state 和 baseQueue 保存到 hook 中
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

#### 总结

总结一下 `useState` 和 `useReducer` 的执行过程如下图：
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6f1dcf1c1676467291b8c7edf7546d6b~tplv-k3u1fbpfcp-watermark.image?" width="100%">

### useEffect

同样，我们也分为 mount 和 update 两种情况来看 useEffect。

#### 用法

`useEffect` 的使用大家应该都了解，在这里就不赘述了，我们本次的用例如下：

```ts
useEffect(() => {
  console.log('update');
  return () => {
    console.log('unmount');
  };
}, [count]);
```

#### mountEffect

mount 阶段 `useEffect` 实际上是调用了 `mountEffect` 方法，进一步通过传递参数调用了 `mountEffectImpl` 这个函数：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountEffect(
  create: () => (() => void) | void, // 执行的回调函数
  deps: Array<mixed> | void | null // 依赖项
): void {
  // ...
  return mountEffectImpl(
    UpdateEffect | PassiveEffect,
    HookPassive,
    create,
    deps
  );
}
```

和 mountState 中所做的事情类似，mountEffectImpl 中首先通过 `mountWorkInProgressHook` 创建了 hook 链接到 hooks 链表中，前面提到过 `useEffect` 的 hook 是一个 Effect 类型的对象。然后通过 `pushEffect` 方法创建一个 effect 添加到 hook 的 memoizedState 属性：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
  // 创建 hook 并链接到 hooks 链表中
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  // 创建一个 effect 对象并添加到 hook 的 memoizedState 中
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}
```

#### pushEffect

`pushEffect` 函数中主要做了两件事，创建 effect 对象，然后将其添加到 fiber 的 updateQueue 链表上：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function pushEffect(tag, create, destroy, deps) {
  // 创建 effect
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: (null: any),
  };
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  if (componentUpdateQueue === null) {
    // componentUpdateQueue 为 null，将 effect 添加到 componentUpdateQueue 头结点
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // 链接到当前 fiber 节点的 updateQueue 的 lastEffect 中
    const lastEffect = componentUpdateQueue.lastEffect;
    // 构成循环链表结构
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

#### updateEffect

update 阶段，`useEffect` 实际上是调用了 `updateEffect` 函数，同样是进一步调用了 `updateEffectImpl` 函数：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  // ...
  return updateEffectImpl(
    UpdateEffect | PassiveEffect,
    HookPassive,
    create,
    deps
  );
}
```

所以我们接着往下看 `updateEffectImpl` 函数做了什么，它从 `updateWorkInProgressHook` 取出对应的 hook，然后看上一轮 render 中是否有 hook 存在，若存在且上一轮 render 和本轮的依赖项没发生变化，说明副作用不需要执行，创建一个 effect 对象添加到 updateQueue 链表后直接返回；若两次的依赖项发生了变化，向 fiber 添加 flags 副作用标签，待 commit 时更新，然后再创建一个 effect 对象添加到 updateQueue 链表：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  // 从 hooks 链表中取出对应 hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    // 若上一轮 render 对应 hook 存在
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 若上一轮和本次的依赖项未发生变化，说明没有副作用
        // 创建一个 effect 对象添加到 updateQueue 链表中，然后返回
        pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  // 执行到这里说明上一轮和本轮依赖项发生变化
  // 向 fiber 添加 flags 副作用标签，待 commit 时更新
  currentlyRenderingFiber.flags |= fiberFlags;

  // 创建一个 effect 对象添加到 updateQueue 链表中
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}
```

#### 总结

总结一下 `useEffect` 的大体流程如下：
<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/15ac0841f23949d3a516516c6e150aa7~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### useRef

`useRef` 的代码十分的简单了，我们直接将 mount 阶段和 update 阶段的放到一起来看：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountRef<T>(initialValue: T): {|current: T|} {
  const hook = mountWorkInProgressHook();
  const ref = {current: initialValue};
  // ...
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
```

mount 阶段，调用 `mountRef` 函数，通过 `mountWorkInProgressHook` 创建一个 hook 并添加到 hooks 链表上，`hook.memoizedState` 上存储的是 `{current: initialValue}` 这个 ref 对象。

update 阶段，调用 `updateRef` 函数，通过 `updateWorkInProgressHook` 方法直接取出 `hook.memoizedState`。

可以看到 `hook.memoizedState` 指向的是一个对象的引用，这就解释了我们可以直接通过 `ref.current` 去改变和获取最新的值，不必进行任何依赖注入。

### useCallback & useMemo

`useCallback` 和 `useMemo` 也是一样，源码结构上十分相似，所以也放在一起来讲。

#### 用法

基础用法如下：

```ts
// 第一个参数是 “创建” 函数，第二个参数是依赖项数组
// “创建” 函数会根据依赖项数组返回一个值，并且仅会在某个依赖项改变时才重新计算
const value = useMemo(() => add(a, b), [a, b]);

// 第一个参数是回调函数，第二个参数是依赖项数组
// 依赖项改变时回调函数会进行更新
const callback = useCallback(() => {
  add(a, b);
}, [a, b]);
```

#### mount 阶段

mount 时，分别调用了 `mountCallback` 和 `mountMemo` 函数，两者都通过 `mountWorkInProgressHook` 方法创建 hook 添加到了 hooks 链表中。不同的是，`mountCallback` 的 memoizedState 是 `[callback, nextDeps]`，并且返回的是其第一个参数；`mountMemo` 的 memoizedState 是 `[nextValue, nextDeps]`，返回的也是 `nextValue` 也就是其第一个参数的执行结果。

所以看上去 `useMemo` 就是比 `useCallback` 多了一步第一个参数的执行过程。

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 创建 hook 添加到链表中
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null
): T {
  // 创建 hook 添加到链表中
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

#### update 阶段

update 时，分别调用了 `updateCallback` 和 `updateMemo` 函数，它们都通过 `updateWorkInProgressHook` 取出对应的 hook，若依赖项未发生改变，则取上一轮的 callback 或者 value 返回；若依赖项发生改变，则重新赋值 hook.memoizedState 并返回新的 callback 或新计算的 value：

```ts
// packages/react-reconciler/src/ReactFiberHooks.old.js

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 获取对应 hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // 依赖项未发生改变，取上一轮的 callback 并返回
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }
  // 依赖项改变了，重新赋值 hook.memoizedState，返回新的 callback
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null
): T {
  // 获取对应 hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // 依赖项未发生改变，取上一轮的值并返回
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }
  // 依赖项改变了，计算新的值，重新赋值 hook.memoizedState并返回新的值
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

## 结语

本章讲解了 react hooks 的源码，理解了 hooks 的设计思想和工作过程。其他 hook 平时用的比较少，就不在这里展开讲了，但通过上面几个 hook 的源码讲解，其他 hook 看源码你应该也能看得懂。
