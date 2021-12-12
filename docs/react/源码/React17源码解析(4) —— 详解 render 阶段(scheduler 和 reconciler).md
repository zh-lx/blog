---
tag: ['react']
---

本章将讲解 react 的核心阶段之一 —— render 阶段，我们将探究以下部分内容的源码：

> - 更新任务的触发
> - 更新任务的创建
> - reconciler 过程同步和异步遍历及执行任务
> - scheduler 是如何实现帧空闲时间调度任务以及中断任务的

# 触发更新

触发更新的方式主要有以下几种：`ReactDOM.render`、`setState`、`forUpdate` 以及 hooks 中的 `useState` 等，关于 hooks 的我们后面再详细讲解，这里先关注前三种情况。

## ReactDOM.render

`ReactDOM.render` 作为 react 应用程序的入口函数，在页面首次渲染时便会触发，页面 dom 的首次创建，也属于触发 react 更新的一种情况。其整体流程如下：

<img width="45%" src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1bc6c901d9344035a53b5035f535adb7~tplv-k3u1fbpfcp-watermark.image?" />

首先调用 `legacyRenderSubtreeIntoContainer` 函数，校验根节点 root 是否存在，若不存在，调用 `legacyCreateRootFromDOMContainer` 创建根节点 root、rootFiber 和 fiberRoot 并绑定它们之间的引用关系，然后调用 `updateContainer` 去非批量执行后面的更新流程；若存在，直接调用 `updateContainer` 去批量执行后面的更新流程：

```ts
// packages/react-dom/src/client/ReactDOMLegacy.js

function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: Container,
  forceHydrate: boolean,
  callback: ?Function,
) {
  // ...
  let root: RootType = (container._reactRootContainer: any);
  let fiberRoot;
  if (!root) {
    // 首次渲染时根节点不存在
    // 通过 legacyCreateRootFromDOMContainer 创建根节点、fiberRoot 和 rootFiber
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // 非批量执行更新流程
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // 批量执行更新流程
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}
```

`updateContainer` 函数中，主要做了以下几件事情：

- requestEventTime：获取更新触发的时间
- requestUpdateLane：获取当前任务优先级
- createUpdate：创建更新
- enqueueUpdate：将任务推进更新队列
- scheduleUpdateOnFiber：调度更新
  关于这几个函数稍后会详细讲到

```ts
// packages/react-dom/src/client/ReactDOMLegacy.js

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function
): Lane {
  // ...
  const current = container.current;
  const eventTime = requestEventTime(); // 获取更新触发的时间
  // ...
  const lane = requestUpdateLane(current); // 获取任务优先级

  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  // ...

  const update = createUpdate(eventTime, lane); // 创建更新任务
  update.payload = { element };

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    // ...
    update.callback = callback;
  }

  enqueueUpdate(current, update); // 将任务推入更新队列
  scheduleUpdateOnFiber(current, lane, eventTime); // schedule 进行调度

  return lane;
}
```

## setState

setState 时类组件中我们最常用的修改状态的方法，状态修改会触发更新流程，其执行过程如下：

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/de0bd64a06f24c52a301e9a378f9783b~tplv-k3u1fbpfcp-watermark.image?"  width="45%" style="width: 45%" />

class 组件在原型链上定义了 `setState` 方法，其调用了触发器 `updater` 上的 `enqueueSetState` 方法：

```ts
// packages/react/src/ReactBaseClasses.js

Component.prototype.setState = function (partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.'
  );
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
```

然后我们再来看以下 updater 上定义的 `enqueueSetState` 方法，一看到这我们就了然了，和 `updateContainer` 方法中做的事情几乎一模一样，都是触发后续的更新调度。

```ts
// packages/react-reconciler/src/ReactFiberClassComponent.old.js

const classComponentUpdater = {
  isMounted,
  enqueueSetState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime(); // 获取更新触发的时间
    const lane = requestUpdateLane(fiber); // 获取任务优先级

    const update = createUpdate(eventTime, lane); // 创建更新任务
    update.payload = payload;
    if (callback !== undefined && callback !== null) {
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'setState');
      }
      update.callback = callback;
    }

    enqueueUpdate(fiber, update); // 将任务推入更新队列
    scheduleUpdateOnFiber(fiber, lane, eventTime); // schedule 进行调度
    // ...

    if (enableSchedulingProfiler) {
      markStateUpdateScheduled(fiber, lane);
    }
  },
  // ...
};
```

## forceUpdate

`forceUpdate` 的流程与 `setState` 几乎一模一样：

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/378f9ebb90824805ad7c44789be1173c~tplv-k3u1fbpfcp-watermark.image?" width="45%" style="width: 45%" />

同样其调用了触发器 updater 上的 `enqueueForceUpdate` 方法，`enqueueForceUpdate` 方法也同样是触发了一系列的更新流程：

```ts
reconciler / src / ReactFiberClassComponent.old.js;

const classComponentUpdater = {
  isMounted,
  // ...
  enqueueForceUpdate(inst, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime(); // 获取更新触发的时间
    const lane = requestUpdateLane(fiber); // 获取任务优先级

    const update = createUpdate(eventTime, lane); // 创建更新
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'forceUpdate');
      }
      update.callback = callback;
    }

    enqueueUpdate(fiber, update); // 将任务推进更新队列
    scheduleUpdateOnFiber(fiber, lane, eventTime); // 触发更新调度
    // ...

    if (enableSchedulingProfiler) {
      markForceUpdateScheduled(fiber, lane);
    }
  },
};
```

# 创建更新任务

可以发现，上述的三种触发更新的动作，最后殊途同归，都会走上述流程图中从 `requestEventTime` 到 `scheduleUpdateOnFiber` 这一流程，去创建更新任务，先我们详细看下更新任务是如何创建的。

## 获取更新触发时间

前面的文章中我们讲到过，react 执行更新过程中，会将更新任务拆解，每一帧优先执行高优先级的任务，从而保证用户体验的流畅。那么即使对于同样优先级的任务，在任务多的情况下该优先执行哪一些呢？

react 通过 `requestEventTime` 方法去创建一个 currentEventTime，用于标识更新任务触发的时间，对于相同时间的任务，会批量去执行。同样优先级的任务，currentEventTime 值越小，就会越早执行。

我们看一下 `requestEventTime` 方法的实现：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

export function requestEventTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // 在 react 执行过程中，直接返回当前时间
    return now();
  }
  // 如果不在 react 执行过程中
  if (currentEventTime !== NoTimestamp) {
    // 正在执行浏览器事件，返回上次的 currentEventTime
    return currentEventTime;
  }
  // react 中断后首次更新，计算新的 currentEventTime
  currentEventTime = now();
  return currentEventTime;
}
```

在这个方法中，`(executionContext & (RenderContext | CommitContext)` 做了二进制运算，`RenderContext` 代表着 react 正在计算更新，`CommitContext` 代表着 react 正在提交更新。所以这句话是判断当前 react 是否处在计算或者提交更新的阶段，如果是则直接返回 `now()`。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

export const NoContext = /*             */ 0b0000000;
const BatchedContext = /*               */ 0b0000001;
const EventContext = /*                 */ 0b0000010;
const DiscreteEventContext = /*         */ 0b0000100;
const LegacyUnbatchedContext = /*       */ 0b0001000;
const RenderContext = /*                */ 0b0010000;
const CommitContext = /*                */ 0b0100000;
export const RetryAfterError = /*       */ 0b1000000;

let executionContext: ExecutionContext = NoContext;
```

再来看一下 `now` 的代码，这里的意思时，当前后的更新任务时间差小于 10ms 时，直接采用上次的 `Scheduler_now`，这样可以抹平 10ms 内更新任务的时间差， 有利于批量更新：

```ts
// packages/react-reconciler/src/SchedulerWithReactIntegration.old.js

export const now =
  initialTimeMs < 10000 ? Scheduler_now : () => Scheduler_now() - initialTimeMs;
```

综上所述，`requestEvent` 做的事情如下：

1. 在 react 的 render 和 commit 阶段我们直接获取更新任务的触发时间，并抹平相差 10ms 以内的更新任务以便于批量执行。
2. 当 currentEventTime 不等于 NoTimestamp 时，则判断其正在执行浏览器事件，react 想要同样优先级的更新任务保持相同的时间，所以直接返回上次的 currentEventTime
3. 如果是 react 上次中断之后的首次更新，那么给 currentEventTime 赋一个新的值

## 划分更新任务优先级

说完了相同优先级任务的触发时间，那么任务的优先级又是如何划分的呢？这里就要提到 `requestUpdateLane`，我们来看一下其源码：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

export function requestUpdateLane(fiber: Fiber): Lane {
  // ...

  // 根据记录下的事件的优先级，获取任务调度的优先级
  const schedulerPriority = getCurrentPriorityLevel();

  // ...
  let lane;
  if (
    (executionContext & DiscreteEventContext) !== NoContext &&
    schedulerPriority === UserBlockingSchedulerPriority
  ) {
    // 如果是用户阻塞级别的事件，则通过InputDiscreteLanePriority 计算更新的优先级 lane
    lane = findUpdateLane(InputDiscreteLanePriority, currentEventWipLanes);
  } else {
    // 否则依据事件的优先级计算 schedulerLanePriority
    const schedulerLanePriority = schedulerPriorityToLanePriority(
      schedulerPriority,
    );

    if (decoupleUpdatePriorityFromScheduler) {
      const currentUpdateLanePriority = getCurrentUpdateLanePriority();

    // 根据计算得到的 schedulerLanePriority，计算更新的优先级 lane
    lane = findUpdateLane(schedulerLanePriority, currentEventWipLanes);
  }

  return lane;
}
```

它首先找出会通过 `getCurrentPriorityLevel` 方法，根据 Scheduler 中记录的事件优先级，获取任务调度的优先级 schedulerPriority。然后通过 `findUpdateLane` 方法计算得出 lane，作为更新过程中的优先级。

`findUpdateLane` 这个方法中，按照事件的类型，匹配不同级别的 lane，事件类型的优先级划分如下，值越高，代表优先级越高：

```ts
// packages/react-reconciler/src/ReactFiberLane.js

export const SyncLanePriority: LanePriority = 15;
export const SyncBatchedLanePriority: LanePriority = 14;
const InputDiscreteHydrationLanePriority: LanePriority = 13;
export const InputDiscreteLanePriority: LanePriority = 12;
const InputContinuousHydrationLanePriority: LanePriority = 11;
export const InputContinuousLanePriority: LanePriority = 10;
const DefaultHydrationLanePriority: LanePriority = 9;
export const DefaultLanePriority: LanePriority = 8;
const TransitionHydrationPriority: LanePriority = 7;
export const TransitionPriority: LanePriority = 6;
const RetryLanePriority: LanePriority = 5;
const SelectiveHydrationLanePriority: LanePriority = 4;
const IdleHydrationLanePriority: LanePriority = 3;
const IdleLanePriority: LanePriority = 2;
const OffscreenLanePriority: LanePriority = 1;
export const NoLanePriority: LanePriority = 0;
```

## 创建更新对象

eventTime 和 lane 都创建好了之后，就该创建更新了，`createUpdate` 就是基于上面两个方法所创建的 eventTime 和 lane，去创建一个更新对象：

```ts
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function createUpdate(eventTime: number, lane: Lane): Update<*> {
  const update: Update<*> = {
    eventTime, // 更新要出发的事件
    lane, // 优先级

    tag: UpdateState, // 指定更新的类型，0更新 1替换 2强制更新 3捕获性的更新
    payload: null, // 要更新的内容，例如 setState 接收的第一个参数
    callback: null, // 更新完成后的回调

    next: null, // 指向下一个更新
  };
  return update;
}
```

## 关联 fiber 的更新队列

创建好了 update 对象之后，紧接着调用 `enqueueUpdate` 方法把 update 对象放到 关联的 fiber 的 updateQueue 队列之中：

```ts
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  // 获取当前 fiber 的更新队列
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // 若 updateQueue 为空，表示 fiber 还未渲染，直接退出
    return;
  }

  const sharedQueue: SharedQueue<State> = (updateQueue: any).shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    // pending 为 null 时表示首次更新，创建循环列表
    update.next = update;
  } else {
    // 将 update 插入到循环列表中
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;

  // ...
}
```

# reconciler 过程

上面的更新任务创建好了并且关联到了 fiber 上，下面就该到了 react render 阶段的核心之一 —— reconciler 阶段。

## 根据任务类型执行不同更新

reconciler 阶段会协调任务去执行，以 `scheduleUpdateOnFiber` 为入口函数，首先会调用 `checkForNestedUpdates` 方法，检查嵌套的更新数量，若嵌套数量大于 50 层时，被认为是循环更新（无限更新）。此时会抛出异常，避免了例如在类组件 render 函数中调用了 setState 这种死循环的情况。

然后通过 `markUpdateLaneFromFiberToRoot` 方法，向上递归更新 fiber 的 lane，lane 的更新很简单，就是将当前任务 lane 与之前的 lane 进行二进制或运算叠加。

我们看一下其[源码](https://github.com/facebook/react/blob/17.0.2/packages/react-reconciler/src/ReactFiberWorkLoop.new.js)：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

export function scheduleUpdateOnFiber(
  fiber: Fiber,
  lane: Lane,
  eventTime: number,
) {
  // 检查是否有循环更新
  // 避免例如在类组件 render 函数中调用了 setState 这种死循环的情况
  checkForNestedUpdates();

  // ...
  // 自底向上更新 child.fiberLanes
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);

  // ...
  // 标记 root 有更新，将 update 的 lane 插入到root.pendingLanes 中
  markRootUpdated(root, lane, eventTime);

  if (lane === SyncLane) { // 同步任务，采用同步渲染
    if (
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // 如果本次是同步更新，并且当前还未开始渲染
      // 表示当前的 js 主线程空闲，并且没有 react 任务在执行

      // ...
      // 调用 performSyncWorkOnRoot 执行同步更新任务
      performSyncWorkOnRoot(root);
    } else {
      // 如果本次时同步更新，但是有 react 任务正在执行

      // 调用 ensureRootIsScheduled 去复用当前正在执行的任务，让其将本次的更新一并执行
      ensureRootIsScheduled(root, eventTime);
      schedulePendingInteractions(root, lane);

      // ...
  } else {
    // 如果本次更新是异步任务

    // ...
    // 调用 ensureRootIsScheduled 执行可中断更新
    ensureRootIsScheduled(root, eventTime);
    schedulePendingInteractions(root, lane);
  }

  mostRecentlyUpdatedRoot = root;
}
```

然后会根据任务类型以及当前线程所处的 react 执行阶段，去判断进行何种类型的更新：

### 执行同步更新

当任务的类型为同步任务，并且当前的 js 主线程空闲（没有正在执行的 react 任务时），会通过 `performSyncWorkOnRoot(root)` 方法开始执行同步任务。

`performSyncWorkOnRoot` 里面主要做了两件事：

- renderRootSync 从根节点开始进行同步渲染任务
- commitRoot 执行 commit 流程

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function performSyncWorkOnRoot(root) {
  // ...
  exitStatus = renderRootSync(root, lanes);
  // ...
  commitRoot(root);
  // ...
}
```

当任务类型为同步类型，但是 js 主线程非空闲时。会执行 `ensureRootIsScheduled` 方法：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  // ...
  // 如果有正在执行的任务，
  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    if (existingCallbackPriority === newCallbackPriority) {
      // 任务优先级没改变，说明可以复用之前的任务一起执行
      return;
    }
    // 任务优先级改变了，说明不能复用。
    // 取消正在执行的任务，重新去调度
    cancelCallback(existingCallbackNode);
  }

  // 进行一个新的调度
  let newCallbackNode;
  if (newCallbackPriority === SyncLanePriority) {
    // 如果是同步任务优先级，执行 performSyncWorkOnRoot
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
  } else if (newCallbackPriority === SyncBatchedLanePriority) {
    // 如果是批量同步任务优先级，执行 performSyncWorkOnRoot
    newCallbackNode = scheduleCallback(
      ImmediateSchedulerPriority,
      performSyncWorkOnRoot.bind(null, root)
    );
  } else {
    // ...
    // 如果不是批量同步任务优先级，执行 performConcurrentWorkOnRoot
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  // ...
}
```

`ensureRootIsScheduled` 方法中，会先看加入了新的任务后根节点任务优先级是否有变更，如果无变更，说明新的任务会被当前的 schedule 一同执行；如果有变更，则创建新的 schedule，然后也是调用`performSyncWorkOnRoot(root)` 方法开始执行同步任务。

### 执行可中断更新

当任务的类型不是同步类型时，react 也会执行 `ensureRootIsScheduled` 方法，因为是异步任务，最终会执行 `performConcurrentWorkOnRoot` 方法，去进行可中断的更新，下面会详细讲到。

## workLoop

### 同步

以同步更新为例，`performSyncWorkOnRoot` 会经过以下流程，`performSyncWorkOnRoot` ——> `renderRootSync` ——> `workLoopSync`。

`workLoopSync` 中，只要 workInProgress（workInProgress fiber 树中新创建的 fiber 节点） 不为 null，就会一直循环，执行 `performUnitOfWork` 函数。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

### 可中断

可中断模式下，`performConcurrentWorkOnRoot` 会执行以下过程：`performConcurrentWorkOnRoot` ——> `renderRootConcurrent` ——> `workLoopConcurrent`。

相比于 `workLoopSync`, `workLoopConcurrent` 在每一次对 workInProgress 执行 `performUnitOfWork` 前，会先判断以下 `shouldYield()` 的值。若为 false 则继续执行，若为 true 则中断执行。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

## performUnitOfWork

最终无论是同步执行任务，还是可中断地执行任务，都会进入 `performUnitOfWork` 函数中。

`performUnitOfWork` 中会以 fiber 作为单元，进行协调过程。每次 `beginWork` 执行后都会更新 workIngProgress，从而响应了上面 workLoop 的循环。

直至 fiber 树便利完成后，workInProgress 此时置为 null，执行 `completeUnitOfWork` 函数。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function performUnitOfWork(unitOfWork: Fiber): void {
  // ...
  const current = unitOfWork.alternate;
  // ...

  let next;
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    // ...
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
  } else {
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
  }

  // ...
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }

  ReactCurrentOwner.current = null;
}
```

### beginWork

`beginWork` 是根据当前执行环境，封装调用了 `originalBeginWork` 函数：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

let beginWork;
if (__DEV__ && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
  beginWork = (current, unitOfWork, lanes) => {
    // ...
    try {
      return originalBeginWork(current, unitOfWork, lanes);
    } catch (originalError) {
      // ...
    }
  };
} else {
  beginWork = originalBeginWork;
}
```

`originalBeginWork` 中，会根据 workInProgress 的 tag 属性，执行不同类型的 react 元素的更新函数。但是他们都大同小异，不论是 tag 是何种类型，更新函数最终都会去调用 `reconcileChildren` 函数。

```ts
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  const updateLanes = workInProgress.lanes;

  workInProgress.lanes = NoLanes;

  // 针对 workInProgress 的tag，执行相应的更新
  switch (workInProgress.tag) {
    // ...
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    // ...
  }
  // ...
}
```

以 `updateHostRoot` 为例，根据根 fiber 是否存在，去执行 mountChildFibers 或者 reconcileChildren：

```ts
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function updateHostRoot(current, workInProgress, renderLanes) {
  // ...
  const root: FiberRoot = workInProgress.stateNode;
  if (root.hydrate && enterHydrationState(workInProgress)) {
    // 若根 fiber 不存在，说明是首次渲染，调用 mountChildFibers
    // ...
    const child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
    workInProgress.child = child;
  } else {
    // 若根 fiber 存在，调用 reconcileChildren
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    resetHydrationState();
  }
  return workInProgress.child;
}
```

`reconcileChildren` 做的事情就是 react 的另一核心之一 —— diff 过程，在下一篇文章中会详细讲。

### completeUnitOfWork

当 workInProgress 为 null 时，也就是当前任务的 fiber 树遍历完之后，就进入到了 `completeUnitOfWork` 函数。

经过了 `beginWork` 操作，workInProgress 节点已经被打上了 flags 副作用标签。`completeUnitOfWork` 方法中主要是逐层收集 effects
链，最终收集到 root 上，供接下来的 commit 阶段使用。

`completeUnitOfWork` 结束后，render 阶段便结束了，后面就到了 commit 阶段。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js
function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork = unitOfWork;
  do {
    // ...
    // 对节点进行completeWork，生成DOM，更新props，绑定事件
    next = completeWork(current, completedWork, subtreeRenderLanes);

    if (returnFiber !== null && (returnFiber.flags & Incomplete) === NoFlags) {
      // 将当前节点的 effectList 并入到父节点的 effectList
      if (returnFiber.firstEffect === null) {
        returnFiber.firstEffect = completedWork.firstEffect;
      }
      if (completedWork.lastEffect !== null) {
        if (returnFiber.lastEffect !== null) {
          returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
        }
        returnFiber.lastEffect = completedWork.lastEffect;
      }

      // 将自身添加到 effectList 链，添加时跳过 NoWork 和 PerformedWork的 flags，因为真正的 commit 时用不到
      const flags = completedWork.flags;

      if (flags > PerformedWork) {
        if (returnFiber.lastEffect !== null) {
          returnFiber.lastEffect.nextEffect = completedWork;
        } else {
          returnFiber.firstEffect = completedWork;
        }
        returnFiber.lastEffect = completedWork;
      }
    }
  } while (completedWork !== null);

  // ...
}
```

# scheduler

## 实现帧空闲调度任务

刚刚上面说到了在执行可中断的更新时，浏览器会在每一帧空闲时刻去执行 react 更新任务，那么空闲时刻去执行是如何实现的呢？我们很容易联想到一个 api —— requestIdleCallback。但由于 requestIdleCallback 的兼容性问题以及 react 对应部分高优先级任务可能牺牲部分帧的需要，react 通过自己实现了类似的功能代替了 requestIdleCallback。

我们上面讲到执行可中断更新时，`performConcurrentWorkOnRoot` 函数时通过 `scheduleCallback` 包裹起来的：

```ts
scheduleCallback(
  schedulerPriorityLevel,
  performConcurrentWorkOnRoot.bind(null, root)
);
```

`scheduleCallback` 函数是引用了 `packages/scheduler/src/Scheduler.js` 路径下的 `unstable_scheduleCallback` 函数，我们来看一下这个函数，它会去按计划插入调度任务：

```ts
// packages/scheduler/src/Scheduler.js

function unstable_scheduleCallback(priorityLevel, callback, options) {
  // ...

  if (startTime > currentTime) {
    // 当前任务已超时，插入超时队列
    // ...
  } else {
    // 任务未超时，插入调度任务队列
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    // 符合更新调度执行的标志
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      // requestHostCallback 调度任务
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}
```

将任务插入了调度队列之后，会通过 `requestHostCallback` 函数去调度任务。

react 通过 `new MessageChannel()` 创建了消息通道，当发现 js 线程空闲时，通过 postMessage 通知 scheduler 开始调度。然后 react 接收到调度开始的通知时，就通过 `performWorkUntilDeadline` 函数去更新当前帧的结束时间，以及执行任务。从而实现了帧空闲时间的任务调度。

```ts
// packages/scheduler/src/forks/SchedulerHostConfig.default.js

// 获取当前设备每帧的时长
forceFrameRate = function (fps) {
  // ...
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
  } else {
    yieldInterval = 5;
  }
};

// 帧结束前执行任务
const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    // 更新当前帧的结束时间
    deadline = currentTime + yieldInterval;
    const hasTimeRemaining = true;
    try {
      const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
      // 如果还有调度任务就执行
      if (!hasMoreWork) {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      } else {
        // 没有调度任务就通过 postMessage 通知结束
        port.postMessage(null);
      }
    } catch (error) {
      // ..
      throw error;
    }
  } else {
    isMessageLoopRunning = false;
  }
  needsPaint = false;
};

// 通过 MessageChannel 创建消息通道，实现任务调度通知
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

// 通过 postMessage，通知 scheduler 已经开始了帧调度
requestHostCallback = function (callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};
```

## 任务中断

前面说到可中断模式下的 workLoop，每次遍历执行 performUnitOfWork 前会先判断 `shouYield` 的值

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

我们看一下 `shouYield` 的值是如何获取的：

```ts
// packages\scheduler\src\SchedulerPostTask.js
export function unstable_shouldYield() {
  return getCurrentTime() >= deadline;
}
```

`getCurrentTime` 获取的是当前的时间戳，deadline 上面讲到了是浏览器每一帧结束的时间戳。也就是说 concurrent 模式下，react 会将这些非同步任务放到浏览器每一帧空闲时间段去执行，若每一帧结束未执行完，则中断当前任务，待到浏览器下一帧的空闲再继续执行。

# 总结

总结一下 react render 阶段的设计思想：

1. 当发生渲染或者更新操作时，react 去创建一系列的任务，任务带有优先级，然后构建 workInProgress fiber 树链表。
2. 遍历任务链表去执行任务。每一帧帧先执行浏览器的渲染等任务，如果当前帧还有空闲时间，则执行任务，直到当前帧的时间用完。如果当前帧已经没有空闲时间，就等到下一帧的空闲时间再去执行。如果当前帧没有空闲时间但是当前任务链表有任务到期了或者有立即执行任务，那么必须执行的时候就以丢失几帧的代价，执行这些任务。执行完的任务都会被从链表中删除。

执行过程中的流程图如下：
<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8954bb134b6049afa265031fe36c53d7~tplv-k3u1fbpfcp-watermark.image?" width="100%" />
