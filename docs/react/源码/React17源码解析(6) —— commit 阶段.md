---
tag: ['react']
---

欢迎大家一起交流学习 react 源码，本系列导航请见：[React17 源码解析(开篇) —— 搭建 react 源码调试环境](https://juejin.cn/post/7014775797596553230/)

<hr />

前两章讲到了，react 在 render 阶段的 `completeUnitWork` 执行完毕后，就执行 `commitRoot` 进入到了 commit 阶段，本章将讲解 commit 阶段执行过程源码。

# 总览

commit 阶段相比于 render 阶段要简单很多，因为大部分更新的前期操作都在 render 阶段做好了，commit 阶段主要做的是根据之前生成的 effectList，对相应的真实 dom 进行更新和渲染，这个阶段是不可中断的。

commit 阶段大致可以分为以下几个过程：

1. 获取 effectList 链表，如果 root 上有 effect，则将其也添加进 effectList 中
2. 对 effectList 进行第一次遍历，执行 `commitBeforeMutationEffects` 函数来更新 class 组件实例上的 state、props 等，以及执行 getSnapshotBeforeUpdate 生命周期函数
3. 对 effectList 进行第二次遍历，执行 `commitMutationEffects` 函数来完成副作用的执行，主要包括重置文本节点以及真实 dom 节点的插入、删除和更新等操作。
4. 对 effectList 进行第三次遍历，执行 `commitLayoutEffects` 函数，去触发 componentDidMount、componentDidUpdate 以及各种回调函数等
5. 最后进行一点变量还原之类的收尾，就完成了 commit 阶段

我们从 commit 阶段的入口函数 `commitRoot` 开始看：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel)
  );
  return null;
}
```

它调用了 `commitRootImpl` 函数，所要做的工作都在这个函数中：

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitRootImpl(root, renderPriorityLevel) {
  // ...
  const finishedWork = root.finishedWork;
  const lanes = root.finishedLanes;
  // ...

  // 获取 effectList 链表
  let firstEffect;
  if (finishedWork.flags > PerformedWork) {
    // 如果 root 上有 effect，则将其添加进 effectList 链表中
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 如果 root 上没有 effect，直接使用 finishedWork.firstEffect 作用链表头节点
    firstEffect = finishedWork.firstEffect;
  }

  if (firstEffect !== null) {
    // ...

    // 第一次遍历，执行 commitBeforeMutationEffects
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        invokeGuardedCallback(null, commitBeforeMutationEffects, null);
        // ...
      } else {
        try {
          commitBeforeMutationEffects();
        } catch (error) {
          // ...
        }
      }
    } while (nextEffect !== null);

    // ...
    // 第二次遍历，执行 commitMutationEffects
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        invokeGuardedCallback(
          null,
          commitMutationEffects,
          null,
          root,
          renderPriorityLevel
        );
        // ...
      } else {
        try {
          commitMutationEffects(root, renderPriorityLevel);
        } catch (error) {
          // ...
        }
      }
    } while (nextEffect !== null);

    // 第三次遍历，执行 commitLayoutEffects
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        invokeGuardedCallback(null, commitLayoutEffects, null, root, lanes);
        // ...
      } else {
        try {
          commitLayoutEffects(root, lanes);
        } catch (error) {
          // ...
        }
      }
    } while (nextEffect !== null);

    nextEffect = null;

    // ...
  } else {
    // 没有任何副作用
    root.current = finishedWork;
    if (enableProfilerTimer) {
      recordCommitTime();
    }
  }

  // ...
}
```

# commitBeforeMutationEffects

`commitBeforeMutationEffects` 中，会从 firstEffect 开始，通过 nextEffect 不断对 effectList 链表进行遍历，若是当前的 fiber 节点有 flags 副作用，则执行 `commitBeforeMutationEffectOnFiber` 节点去对针对 class 组件单独处理。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    // ...
    const flags = nextEffect.flags;
    if ((flags & Snapshot) !== NoFlags) {
      // 如果当前 fiber 节点有 flags 副作用
      commitBeforeMutationEffectOnFiber(current, nextEffect);
      // ...
    }
    // ...
    nextEffect = nextEffect.nextEffect;
  }
}
```

然后看一下 `commitBeforeMutationEffectOnFiber`，它里面根据 fiber 的 tag 属性，主要是对 ClassComponent 组件进行处理，更新 ClassComponent 实例上的 state、props 等，以及执行 getSnapshotBeforeUpdate 生命周期函数:

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitBeforeMutationLifeCycles(
  current: Fiber | null,
  finishedWork: Fiber
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      return;
    }
    case ClassComponent: {
      if (finishedWork.flags & Snapshot) {
        if (current !== null) {
          // 非首次加载的情况下
          // 获取上一次的 props 和 state
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          // 获取当前 class 组件实例
          const instance = finishedWork.stateNode;
          // ...

          // 调用 getSnapshotBeforeUpdate 生命周期方法
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState
          );
          // ...
          // 将生成的 snapshot 保存到 instance.__reactInternalSnapshotBeforeUpdate 上，供 DidUpdate 生命周期使用
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      return;
    }
    // ...
  }
}
```

# commitMutationEffects

`commitMutationEffects` 中会根据对 effectList 进行第二次遍历，根据 flags 的类型进行二进制与操作，然后根据结果去执行不同的操作，对真实 dom 进行修改：

- ContentReset: 如果 flags 中包含 ContentReset 类型，代表文本节点内容改变，则执行 `commitResetTextContent` 重置文本节点的内容
- Ref: 如果 flags 中包含 Ref 类型，则执行 `commitDetachRef` 更改 ref 对应的 current 的值
- Placement: 上一章 diff 中讲过 Placement 代表插入，会执行 `commitPlacement` 去插入 dom 节点
- Update: flags 包含 Update 则会执行 `commitWork` 执行更新操作
- Deletion: flags 包含 Deletion 则会执行 `commitDeletion` 执行更新操作

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitMutationEffects(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel
) {
  // 对 effectList 进行遍历
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    // ContentReset：重置文本节点
    if (flags & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    // Ref：commitDetachRef 更新 ref 的 current 值
    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
      if (enableScopeAPI) {
        if (nextEffect.tag === ScopeComponent) {
          commitAttachRef(nextEffect);
        }
      }
    }

    // 执行更新、插入、删除操作
    const primaryFlags = flags & (Placement | Update | Deletion | Hydrating);
    switch (primaryFlags) {
      case Placement: {
        // 插入
        commitPlacement(nextEffect);
        nextEffect.flags &= ~Placement;
        break;
      }
      case PlacementAndUpdate: {
        // 插入并更新
        // 插入
        commitPlacement(nextEffect);
        nextEffect.flags &= ~Placement;

        // 更新
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // ...
      case Update: {
        // 更新
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Deletion: {
        // 删除
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }
    resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }
}
```

下面我们重点来看一下 react 是如何对真实 dom 节点进行操作的。

## 插入 dom 节点

### 获取父节点及插入位置

插入 dom 节点的操作以 `commitPlacement` 为入口函数， `commitPlacement` 中会首先获取当前 fiber 的父 fiber 对应的真实 dom 节点以及在父节点下要插入的位置，根据父节点对应的 dom 是否为 container，去执行 `insertOrAppendPlacementNodeIntoContainer` 或者 `insertOrAppendPlacementNode` 进行节点的插入。

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }

  // 获取当前 fiber 的父 fiber
  const parentFiber = getHostParentFiber(finishedWork);

  let parent;
  let isContainer;
  // 获取父 fiber 对应真实 dom 节点
  const parentStateNode = parentFiber.stateNode;
  // 获取父 fiber 对应的 dom 是否可以作为 container
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }
    default:
      invariant(
        false,
        'Invalid host parent fiber. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
  }
  // 如果父 fiber 有 ContentReset 的 flags 副作用，则重置其文本内容
  if (parentFiber.flags & ContentReset) {
    resetTextContent(parent);
    parentFiber.flags &= ~ContentReset;
  }

  // 获取要在哪个兄弟 fiber 之前插入
  const before = getHostSibling(finishedWork);
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}
```

### 判断当前节点是否为单节点

我们以 `insertOrAppendPlacementNodeIntoContainer` 为例看一下其源码，里面通过 tag 属性判断了当前的 fiber 是否为原生 dom 节点。若是，则调用 `insertInContainerBefore` 或 `appendChildToContainer` 在相应位置插入真实 dom；若不是，则对当前 fiber 的所有子 fiber 调用 `insertOrAppendPlacementNodeIntoContainer` 进行遍历：

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function insertOrAppendPlacementNodeIntoContainer(
  node: Fiber,
  before: ?Instance,
  parent: Container
): void {
  const { tag } = node;
  // 判断当前节点是否为原生的 dom 节点
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost || (enableFundamentalAPI && tag === FundamentalComponent)) {
    // 是原生 dom 节点，在父节点的对应位置插入当前节点
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before) {
      insertInContainerBefore(parent, stateNode, before);
    } else {
      appendChildToContainer(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    // 如是 Portal 不做处理
  } else {
    // 不是原生 dom 节点，则遍历插入当前节点的各个子节点
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNodeIntoContainer(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}
```

### 在对应位置插入节点

before 不为 null 时，说明要在某个 dom 节点之前插入新的 dom，调用 `insertInContainerBefore` 去进行插入，根据父节点是否注释类型，选择在父节点的父节点下插入新的 dom，还是直接在父节点下插入新的 dom：

```ts
// packages/react-dom/src/client/ReactDOMHostConfig.js

export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    // 如果父节点为注释类型，则在父节点的父节点下插入新的 dom
    (container.parentNode: any).insertBefore(child, beforeChild);
  } else {
    // 否则直接插入新的 dom
    container.insertBefore(child, beforeChild);
  }
}
```

before 为 null 时，调用 `appendChildToContainer` 方法，直接在父节点（如果父节点为注释类型则在父节点的父节点）的最后位置插入新的 dom：

```ts

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    // 如果父节点为注释类型，则在父节点的父节点下插入新的 dom
    parentNode = (container.parentNode: any);
    parentNode.insertBefore(child, container);
  } else {
    // 否则直接插入新的 dom
    parentNode = container;
    parentNode.appendChild(child);
  }
  // ...
}
```

这几步都是以 `insertOrAppendPlacementNodeIntoContainer` 为例看源码，`insertOrAppendPlacementNode` 和它的唯一区别就是最后在对应位置插入节点时，不需要额外判断父节点 (container) 是否为 COMMENT_TYPE 了。

## 更新 dom 节点

更新操作以 `commitWork` 为入口函数，更新主要是针对 HostComponent 和 HostText 两种类型进行更新。

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  // ...

  switch (finishedWork.tag) {
    // ...
    case ClassComponent: {
      return;
    }
    case HostComponent: {
      // 获取真实 dom 节点
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        // 获取新的 props
        const newProps = finishedWork.memoizedProps;
        // 获取老的 props
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        // 取出 updateQueue
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue: any);
        // 清空 updateQueue
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          // 提交更新
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return;
    }
    case HostText: {
      // 获取真实文本节点
      const textInstance: TextInstance = finishedWork.stateNode;
      // 获取新的文本内容
      const newText: string = finishedWork.memoizedProps;
      // 获取老的文本内容
      const oldText: string =
        current !== null ? current.memoizedProps : newText;
      // 提交更新
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
    case HostRoot: {
      // ssr操作，暂不关注
      if (supportsHydration) {
        const root: FiberRoot = finishedWork.stateNode;
        if (root.hydrate) {
          root.hydrate = false;
          commitHydratedContainer(root.containerInfo);
        }
      }
      return;
    }
    case Profiler: {
      return;
    }
    // ...
}
```

### 更新 HostComponent

根据上面的 commitWork 的源码，更新 HostComponent 时，获取了真实 dom 节点实例、props 以及 updateQueue 之后，就调用 `commitUpdate` 对 dom 进行更新，它通过 `updateProperties` 函数将 props 变化应用到真实 dom 上。

```ts
// packages/react-dom/src/client/ReactDOMHostConfig.js

export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object
): void {
  // 做了 domElement[internalPropsKey] = props 的操作
  updateFiberProps(domElement, newProps);
  // 应用给真实 dom
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
}
```

`updateProperties` 中，通过 `updateDOMProperties` 将 diff 结果应用于真实的 dom 节点。另外根据 fiber 的 tag 属性，如果判断对应的 dom 的节点为表单类型，例如 radio、textarea、input、select 等，会做特定的处理：

```ts
// packages/react-dom/src/client/ReactDOMComponent.js

export function updateProperties(
  domElement: Element,
  updatePayload: Array<any>,
  tag: string,
  lastRawProps: Object,
  nextRawProps: Object
): void {
  // 针对表单组件进行特殊处理，例如更新 radio 的 checked 值
  if (
    tag === 'input' &&
    nextRawProps.type === 'radio' &&
    nextRawProps.name != null
  ) {
    ReactDOMInputUpdateChecked(domElement, nextRawProps);
  }

  // 判断是否为用户自定义的组件，即是否包含 "-"
  const wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
  const isCustomComponentTag = isCustomComponent(tag, nextRawProps);
  // 将 diff 结果应用于真实 dom
  updateDOMProperties(
    domElement,
    updatePayload,
    wasCustomComponentTag,
    isCustomComponentTag
  );

  // 针对表单的特殊处理
  switch (tag) {
    case 'input':
      ReactDOMInputUpdateWrapper(domElement, nextRawProps);
      break;
    case 'textarea':
      ReactDOMTextareaUpdateWrapper(domElement, nextRawProps);
      break;
    case 'select':
      ReactDOMSelectPostUpdateWrapper(domElement, nextRawProps);
      break;
  }
}
```

`updateDOMProperties` 中，会遍历之前 render 阶段生成的 updatePayload，将其映射到真实的 dom 节点属性上，另外会针对 style、dangerouslySetInnerHTML 以及 textContent 做一些处理，从而实现了 dom 的更新：

```ts
// packages/react-dom/src/client/ReactDOMHostConfig.js

function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean
): void {
  // 对 updatePayload 遍历
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      // 处理 style 样式更新
      setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      // 处理 innerHTML 改变
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
      // 处理 textContent
      setTextContent(domElement, propValue);
    } else {
      // 处理其他节点属性
      setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
    }
  }
}
```

### 更新 HostText

HostText 的更新处理十分简单，调用 `commitTextUpdate`，里面直接将 dom 的 nodeValue 设置为 newText 的值：

```ts
// packages/react-dom/src/client/ReactDOMHostConfig.js

export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string
): void {
  textInstance.nodeValue = newText;
}
```

## 删除 dom 节点

删除 dom 节点的操作以 `commitDeletion` 为入口函数，它所要做的事情最复杂。react 会采用深度优先遍历去遍历整颗 fiber 树，找到需要删除的 fiber，除了要将对应的 dom 节点删除，还需要考虑 ref 的卸载、componentWillUnmount 等生命周期的调用：

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitDeletion(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel
): void {
  if (supportsMutation) {
    // 支持 useMutation
    unmountHostComponents(finishedRoot, current, renderPriorityLevel);
  } else {
    // 不支持 useMutation
    commitNestedUnmounts(finishedRoot, current, renderPriorityLevel);
  }
  const alternate = current.alternate;
  // 重置 fiber 的各项属性
  detachFiberMutation(current);
  if (alternate !== null) {
    detachFiberMutation(alternate);
  }
}
```

### unmountHostComponents

`unmountHostComponents` 首先判断当前父节点是否合法，若是不合法寻找合法的父节点，然后通过深度优先遍历，去遍历整棵树，通过 `commitUnmount` 卸载 ref、执行生命周期。遇到是原生 dom 类型的节点，还会从对应的父节点下删除该节点。

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function unmountHostComponents(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  let node: Fiber = current;
  let currentParentIsValid = false;
  let currentParent;
  let currentParentIsContainer;

  while (true) {
    if (!currentParentIsValid) {
      // 若当前的父节点不是非法的 dom 节点，寻找一个合法的 dom 父节点
      let parent = node.return;
      findParent: while (true) {
        invariant(
          parent !== null,
          'Expected to find a host parent. This error is likely caused by ' +
            'a bug in React. Please file an issue.',
        );
        const parentStateNode = parent.stateNode;
        switch (parent.tag) {
          case HostComponent:
            currentParent = parentStateNode;
            currentParentIsContainer = false;
            break findParent;
          case HostRoot:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;
          case HostPortal:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;
          case FundamentalComponent:
            if (enableFundamentalAPI) {
              currentParent = parentStateNode.instance;
              currentParentIsContainer = false;
            }
        }
        parent = parent.return;
      }
      currentParentIsValid = true;
    }

    if (node.tag === HostComponent || node.tag === HostText) {
      // 若果是原生 dom 节点，调用 commitNestedUnmounts 方法
      commitNestedUnmounts(finishedRoot, node, renderPriorityLevel);
      if (currentParentIsContainer) {
        // 若当前的 parent 是 container，则将 child 从 container 中移除(通过 dom.removeChild 方法)
        removeChildFromContainer(
          ((currentParent: any): Container),
          (node.stateNode: Instance | TextInstance),
        );
      } else {
        // 从 parent 中移除 child(通过 dom.removeChild 方法)
        removeChild(
          ((currentParent: any): Instance),
          (node.stateNode: Instance | TextInstance),
        );
      }
    } // ...
    else if (node.tag === HostPortal) {
      // 若是 portal 节点，直接向下遍历 child，因为它没有 ref 和生命周期等额外要处理的事情
      if (node.child !== null) {
        currentParent = node.stateNode.containerInfo;
        currentParentIsContainer = true;
        node.child.return = node;
        node = node.child;
        continue;
      }
    } else {
      // 其他 react 节点，调用 commitUnmount，里面会卸载 ref、执行生命周期等
      commitUnmount(finishedRoot, node, renderPriorityLevel);
      // 深度优先遍历子节点
      if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }
    // node 和 current 相等时说明整颗树的深度优先遍历完成
    if (node === current) {
      return;
    }
    // 如果没有兄弟节点，说明当前子树遍历完毕，返回到父节点继续深度优先遍历
    while (node.sibling === null) {
      if (node.return === null || node.return === current) {
        return;
      }
      node = node.return;
      if (node.tag === HostPortal) {
        currentParentIsValid = false;
      }
    }
    // 继续遍历兄弟节点
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

### commitNestedUnmounts

`commitNestedUnmounts` 相比 `unmountHostComponents` 不需要额外做当前父节点是否合法的判断以及 react 节点类型的判断，直接采用深度优先遍历，去执行 `commitUnmount` 方法即可：

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitNestedUnmounts(
  finishedRoot: FiberRoot,
  root: Fiber,
  renderPriorityLevel: ReactPriorityLevel
): void {
  let node: Fiber = root;
  while (true) {
    // 调用 commitUnmount 去卸载 ref、执行生命周期
    commitUnmount(finishedRoot, node, renderPriorityLevel);
    if (node.child !== null && (!supportsMutation || node.tag !== HostPortal)) {
      // 深度优先遍历向下遍历子树
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      // node 为 root 时说明整棵树的深度优先遍历完成
      return;
    }
    while (node.sibling === null) {
      // node.sibling 为 null 时说明当前子树遍历完成，返回上级节点继续深度优先遍历
      if (node.return === null || node.return === root) {
        return;
      }
      node = node.return;
    }
    // 遍历兄弟节点
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

### commitUnmount

commitUnmount 中会完成对 react 组件 ref 的卸载，若果是类组件，执行 componentWillUnmount 生命周期等操作：

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitUnmount(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel
): void {
  onCommitUnmount(current);

  switch (current.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    // ...
    case ClassComponent: {
      // 卸载 ref
      safelyDetachRef(current);
      const instance = current.stateNode;
      // 执行 componentWillUnmount 生命周期
      if (typeof instance.componentWillUnmount === 'function') {
        safelyCallComponentWillUnmount(current, instance);
      }
      return;
    }
    case HostComponent: {
      // 卸载 ref
      safelyDetachRef(current);
      return;
    }
    case HostPortal: {
      if (supportsMutation) {
        // 递归遍历子树
        unmountHostComponents(finishedRoot, current, renderPriorityLevel);
      } else if (supportsPersistence) {
        emptyPortalContainer(current);
      }
      return;
    }
    // ...
  }
}
```

最终通过以上操作，react 就完成了 dom 的删除工作。

# commitLayoutEffects

接下来通过 `commitLayoutEffects` 为入口函数，执行第三次遍历，这里会遍历 effectList，执行 `componentDidMount`、`componentDidUpdate` 等生命周期，另外会执行 `componentUpdateQueue` 函数去执行回调函数。

```ts
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  // ...

  // 遍历 effectList
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    if (flags & (Update | Callback)) {
      const current = nextEffect.alternate;
      // 执行 componentDidMount、componentDidUpdate 以及 componentUpdateQueue
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }

    // 更新 ref
    if (enableScopeAPI) {
      if (flags & Ref && nextEffect.tag !== ScopeComponent) {
        commitAttachRef(nextEffect);
      }
    } else {
      if (flags & Ref) {
        commitAttachRef(nextEffect);
      }
    }

    resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }
}
```

## 执行生命周期

`commitLayoutEffectOnFiber` 调用了 `packages/react-reconciler/src/ReactFiberCommitWork.old.js` 路径下的 `commitLifeCycles` 函数，里面针对首次渲染和非首次渲染分别执行 `componentDidMount` 和 `componentDidUpdate` 生命周期，以及调用 `commitUpdateQueue` 去触发回调：

```ts
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitLifeCycles(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    // ...
    case ClassComponent: {
      const instance = finishedWork.stateNode;
      if (finishedWork.flags & Update) {
        if (current === null) {
          // 首次渲染，执行 componentDidMount 生命周期
          if (
            enableProfilerTimer &&
            enableProfilerCommitHooks &&
            finishedWork.mode & ProfileMode
          ) {
            try {
              startLayoutEffectTimer();
              instance.componentDidMount();
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            instance.componentDidMount();
          }
        } else {
          // 非首次渲染，执行 componentDidUpdate 生命周期
          const prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          const prevState = current.memoizedState;
          // ...
          if (
            enableProfilerTimer &&
            enableProfilerCommitHooks &&
            finishedWork.mode & ProfileMode
          ) {
            try {
              startLayoutEffectTimer();
              instance.componentDidUpdate(
                prevProps,
                prevState,
                instance.__reactInternalSnapshotBeforeUpdate,
              );
            } finally {
              recordLayoutEffectDuration(finishedWork);
            }
          } else {
            instance.componentDidUpdate(
              prevProps,
              prevState,
              instance.__reactInternalSnapshotBeforeUpdate,
            );
          }
        }
      }

      // ...

      if (updateQueue !== null) {
        // ...
        // 执行 commitUpdateQueue 处理回调
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostRoot: {

      const updateQueue: UpdateQueue<
        *,
      > | null = (finishedWork.updateQueue: any);
      if (updateQueue !== null) {
        // ...
        // 调用 commitUpdateQueue 处理 ReactDOM.render 的回调
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      // ...
      // commitMount 处理 input 标签有 auto-focus 的情况
      if (current === null && finishedWork.flags & Update) {
        const type = finishedWork.type;
        const props = finishedWork.memoizedProps;
        commitMount(instance, type, props, finishedWork);
      }

      return;
    }
    // ...
}
```

## 处理回调

处理回调是在 `commitUpdateQueue` 中做的，它会对 finishedQueue 上面的 effects 进行遍历，若有 callback，则执行 callback。同时会重置 finishedQueue 上面的 effects 为 null：

```ts
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function commitUpdateQueue<State>(
  finishedWork: Fiber,
  finishedQueue: UpdateQueue<State>,
  instance: any
): void {
  const effects = finishedQueue.effects;
  // 清空 effects
  finishedQueue.effects = null;
  // 对 effect 遍历
  if (effects !== null) {
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const callback = effect.callback;
      // 执行回调
      if (callback !== null) {
        effect.callback = null;
        callCallback(callback, instance);
      }
    }
  }
}
```

在这之后就是进行最后一点变量还原等收尾工作，然后整个 commit 过程就完成了！

# 总结

接着第(4)章 [render 阶段](https://juejin.cn/post/7019254208830373902)的流程图，补充上 commit 阶段的流程图，就构成了完整的 react 执行图了：

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/747d92865deb4fb2af9d02afd8d5f208~tplv-k3u1fbpfcp-watermark.image?" width="100%">
