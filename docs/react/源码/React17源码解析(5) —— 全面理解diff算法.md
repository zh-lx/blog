---
desc: 'react 源码解析，本章节将结合源码解析 diff 算法，包括如下内容：react diff 算法的介绍、diff 策略、diff 源码解析。'
cover: 'https://image-1300099782.cos.ap-beijing.myqcloud.com/blog%2Freact-code.png'
tag: ['react']
time: '2021-10-15'
---

欢迎大家一起交流学习 react 源码，本系列导航请见：[React17 源码解析(开篇) —— 搭建 react 源码调试环境](https://juejin.cn/post/7014775797596553230/)

<hr />

> react 源码解析(5)，本章节将结合源码解析 diff 算法，包括如下内容：
>
> - react diff 算法的介绍
> - diff 策略
> - diff 源码解析

上一章中 react 的 render 阶段，其中 `begin` 时会调用 `reconcileChildren`  函数， `reconcileChildren` 中做的事情就是 react 知名的 diff 过程，本章会对 diff 算法进行讲解。

## diff 算法介绍

react 的每次更新，都会将新的 ReactElement 内容与旧的 fiber 树作对比，比较出它们的差异后，构建新的 fiber 树，将差异点放入更新队列之中，从而对真实 dom 进行 render。简单来说就是如何通过最小代价将旧的 fiber 树转换为新的 fiber 树。

[经典的 diff 算法](https://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf) 中，将一棵树转为另一棵树的最低时间复杂度为 O(n^3)，其中 n 为树种节点的个数。假如采用这种 diff 算法，一个应用有 1000 个节点的情况下，需要比较 十亿 次才能将 dom 树更新完成，显然这个性能是无法让人接受的。

因此，想要将 diff 应用于 virtual dom 中，必须实现一种高效的 diff 算法。React 便通过制定了一套大胆的策略，实现了 O(n) 的时间复杂度更新 virtual dom。

## diff 策略

react 将 diff 算法优化到 O(n) 的时间复杂度，基于了以下三个前提策略：

- 只对同级元素进行比较。Web UI 中 DOM 节点跨层级的移动操作特别少，可以忽略不计，如果出现跨层级的 dom 节点更新，则不进行复用。
- 两个不同类型的组件会产生两棵不同的树形结构。
- 对同一层级的子节点，开发者可以通过 `key` 来确定哪些子元素可以在不同渲染中保持稳定。

上面的三种 diff 策略，分别对应着 tree diff、component diff 和 element diff。

## tree diff

根据策略一，react 会对 fiber 树进行分层比较，只比较同级元素。这里的同级指的是同一个父节点下的子节点(往上的祖先节点也都是同一个)，而不是树的深度相同。

<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1a94404eaa314e21b22fe0da9cb85ddd~tplv-k3u1fbpfcp-watermark.image?)" width="100%" />

如上图所示，react 的 tree diff 是采用深度优先遍历，所以要比较的元素向上的祖先元素都会一致，即图中会对相同颜色的方框内圈出的元素进行比较，例如左边树的 A 节点下的子节点 C、D 会与右边树 A 节点下的 C、D、E 进行比较。

当元素出现跨层级的移动时，例如下图：
<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a9dd9bf106b64711aa3801ab3d9ff257~tplv-k3u1fbpfcp-watermark.image?" width="100%" />
A 子树从 root 节点下到了 B 节点下，在 react diff 过程中并不会直接将 A 子树移动到 B 子树下，而是进行如下操作：

1. 在 root 节点下删除 A 节点
2. 在 B 节点下创建 A 子节点
3. 在新创建的 A 子节点下创建 C、D 节点

### component diff

对于组件之间的比较，只要它们的类型不同，就判断为它们是两棵不同的树形结构，直接会将它们给替换掉。

例如下面的两棵树，左边树 B 节点和右边树 K 节点除了类型不同(比如 B 为 div 类型，K 为 p 类型)，内容完全一致，但 react 依然后直接替换掉整个节点。实际经过的变换是：

1. 在 root 节点下创建 K 节点
2. 在 K 节点下创建 E、F 节点
3. 在 F 节点下创建 G、H 节点
4. 在 root 节点下删除 B 子节点

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/845960d68ac2468eb19980e4def1219b~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

虽然如果在本例中改变类型复用子元素性能会更高一点，但是在时机应用开发中类型不一致子内容完全一致的情况极少，对这种情况过多判断反而会增加时机复杂度，降低平均性能。

### element diff

react 对于同层级的元素进行比较时，会通过 key 对元素进行比较以识别哪些元素可以稳定的渲染。同级元素的比较存在<b>插入</b>、<b>删除</b>和<b>移动</b>三种操作。

如下图左边的树想要转变为右边的树：
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/562a718d3ed144ddb45b8fc193fe966f~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

实际经过的变换如下：

1. 将 root 节点下 A 子节点移动至 B 子节点之后
2. 在 root 节点下新增 E 子节点
3. 将 root 节点下 C 子节点删除

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1e40065903a24a758f72b3a2afbd5e34~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

## 结合源码看 diff

### 整体流程

diff 算法从 `reconcileChildren` 函数开始，根据当前 fiber 是否存在，决定是直接渲染新的 ReactElement 内容还是与当前 fiber 去进行 Diff，看一下其[源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.new.js)：

```ts
export function reconcileChildren(
  current: Fiber | null, // 当前 fiber 节点
  workInProgress: Fiber, // 父 fiber
  nextChildren: any, // 新生成的 ReactElement 内容
  renderLanes: Lanes // 渲染的优先级
) {
  if (current === null) {
    // 如果当前 fiber 节点为空，则直接将新的 ReactElement 内容生成新的 fiber
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    // 当前 fiber 节点不为空，则与新生成的 ReactElement 内容进行 diff
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}
```

因为我们主要是要学习 diff 算法，所以我们暂时先不关心 `mountChildFibers` 函数，主要关注 `reconcileChildFibers` ，我们来看一下它的[源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.old.js)：

```ts
function reconcileChildFibers(
  returnFiber: Fiber, // 父 Fiber
  currentFirstChild: Fiber | null, // 父 fiber 下要对比的第一个子 fiber
  newChild: any, // 更新后的 React.Element 内容
  lanes: Lanes // 更新的优先级
): Fiber | null {
  // 对新创建的 ReactElement 最外层是 fragment 类型单独处理，比较其 children
  const isUnkeyedTopLevelFragment =
    typeof newChild === 'object' &&
    newChild !== null &&
    newChild.type === REACT_FRAGMENT_TYPE &&
    newChild.key === null;
  if (isUnkeyedTopLevelFragment) {
    newChild = newChild.props.children;
  }

  // 对更新后的 React.Element 是单节点的处理
  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      // 常规 react 元素
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(
          reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            lanes
          )
        );
      // react.portal 类型
      case REACT_PORTAL_TYPE:
        return placeSingleChild(
          reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes)
        );
      // react.lazy 类型
      case REACT_LAZY_TYPE:
        if (enableLazyElements) {
          const payload = newChild._payload;
          const init = newChild._init;
          return reconcileChildFibers(
            returnFiber,
            currentFirstChild,
            init(payload),
            lanes
          );
        }
    }

    // 更新后的 React.Element 是多节点的处理
    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
    }

    // 迭代器函数的单独处理
    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
    }

    throwOnInvalidObjectType(returnFiber, newChild);
  }

  // 纯文本节点的类型处理
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(
      reconcileSingleTextNode(
        returnFiber,
        currentFirstChild,
        '' + newChild,
        lanes
      )
    );
  }

  if (__DEV__) {
    if (typeof newChild === 'function') {
      warnOnFunctionType(returnFiber);
    }
  }

  // 不符合以上情况都视为 empty，直接从父节点删除所有旧的子 Fiber
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```

入口函数中，接收 `returnFiber`、`currentFirstChild`、`newChild`、`lanes` 四个参数，其中，根据 `newChid` 的类型，我们主要关注几个比较常见的类型的 diff，单 React 元素的 diff、纯文本类型的 diff 和 数组类型的 diff。

所以根据 ReactElement 类型走的不同流程如下：
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7a867d036fb4cd7bc7c5092de0ce2c8~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### 新内容为 REACT_ELEMENT_TYPE

当新创建的节点 type 为 object 时，我们看一下其为 `REACT_ELEMENT_TYPE` 类型的 diff，即 `placeSingleChild(reconcileSingleElement(...))` 函数。

先看一下 `reconcileSingleElement` 函数的[源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.old.js)：

```ts
function reconcileSingleElement(
  returnFiber: Fiber, // 父 fiber
  currentFirstChild: Fiber | null, // 父 fiber 下第一个开始对比的旧的子  fiber
  element: ReactElement, // 当前的 ReactElement内容
  lanes: Lanes // 更新的优先级
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  // 处理旧的 fiber 由多个节点变成新的 fiber 一个节点的情况
  // 循环遍历父 fiber 下的旧的子 fiber，直至遍历完或者找到 key 和 type 都与新节点相同的情况
  while (child !== null) {
    if (child.key === key) {
      const elementType = element.type;
      if (elementType === REACT_FRAGMENT_TYPE) {
        if (child.tag === Fragment) {
          // 如果新的 ReactElement 和旧 Fiber 都是 fragment 类型且 key 相等
          // 对旧 fiber 后面的所有兄弟节点添加 Deletion 副作用标记，用于 dom 更新时删除
          deleteRemainingChildren(returnFiber, child.sibling);

          // 通过 useFiber, 基于旧的 fiber 和新的 props.children，克隆生成一个新的 fiber，新 fiber 的 index 为 0，sibling 为 null
          // 这便是所谓的 fiber 复用
          const existing = useFiber(child, element.props.children);
          existing.return = returnFiber;
          if (__DEV__) {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
          }
          return existing;
        }
      } else {
        if (
          // 如果新的 ReactElement 和旧 Fiber 的 key 和 type 都相等
          child.elementType === elementType ||
          (__DEV__
            ? isCompatibleFamilyForHotReloading(child, element)
            : false) ||
          (enableLazyElements &&
            typeof elementType === 'object' &&
            elementType !== null &&
            elementType.$$typeof === REACT_LAZY_TYPE &&
            resolveLazy(elementType) === child.type)
        ) {
          // 对旧 fiber 后面的所有兄弟节点添加 Deletion 副作用标记，用于 dom 更新时删除
          deleteRemainingChildren(returnFiber, child.sibling);
          // 通过 useFiber 复用新节点并返回
          const existing = useFiber(child, element.props);
          existing.ref = coerceRef(returnFiber, child, element);
          existing.return = returnFiber;
          if (__DEV__) {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
          }
          return existing;
        }
      }
      // 若 key 相同但是 type 不同说明不匹配，移除旧 fiber 及其后面的兄弟 fiber
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // 若 key 不同，对当前的旧 fiber 添加 Deletion 副作用标记，继续对其兄弟节点遍历
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  // 都遍历完之后说明没有匹配到 key 和 type 都相同的 fiber
  if (element.type === REACT_FRAGMENT_TYPE) {
    // 如果新节点是 fragment 类型，createFiberFromFragment 创建新的 fragment 类型 fiber并返回
    const created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      lanes,
      element.key
    );
    created.return = returnFiber;
    return created;
  } else {
    // createFiberFromElement 创建 fiber 并返回
    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    created.ref = coerceRef(returnFiber, currentFirstChild, element);
    created.return = returnFiber;
    return created;
  }
}
```

根据源码我们可以得知，`reconcileSingleElement` 函数中，会遍历父 fiber 下所有的旧的子 fiber，寻找与新生成的 ReactElement 内容的 key 和 type 都相同的子 fiber。每次遍历对比的过程中：

- 若当前旧的子 fiber 与新内容 key 或 type 不一致，对当前旧的子 fiber 添加 `Deletion` 副作用标记（用于 dom 更新时删除），继续对比下一个旧子 fiber
- 若当前旧的子 fiber 与新内容 key 或 type 一致，则判断为可复用，通过 `deleteRemainingChildren` 对该子 fiber 后面所有的兄弟 fiber 添加 `Deletion` 副作用标记，然后通过 `useFiber` 基于该子 fiber 和新内容的 props 生成新的 fiber 进行复用，结束遍历。

若都遍历完没找到与新内容 key 或 type 子 fiber，此时父 fiber 下的所有旧的子 fiber 都已经添加了 `Deletion` 副作用标记，通过 `createFiberFromElement` 基于新内容创建新的 fiber 并将其 return 指向父 fiber。

再来看 `placeSingleChild` 的[源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.old.js)：

```ts
function placeSingleChild(newFiber: Fiber): Fiber {
  if (shouldTrackSideEffects && newFiber.alternate === null) {
    newFiber.flags |= Placement;
  }
  return newFiber;
}
```

`placeSingleChild` 中做的事情更为简单，就是将 `reconcileSingleElement` 中生成的新 fiber 打上 `Placement` 的标记，表示 dom 更新渲染时要进行插入。

所以对于 REACT_ELEMENT_TYPE 类型的 diff 总结如下：
<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/64a4ace349ad4d6db1e21d1efb078a7b~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### 新内容为纯文本类型

当新创建节点的 typeof 为 string 或者 number 时，表示是纯文本节点，使用 `placeSingleChild(reconcileSingleTextNode(...))` 函数进行 diff。

`placeSingleChild` 前面说过了，我们主要看 `reconcileSingleTextNode` 的[源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.old.js)：

```ts
function reconcileSingleTextNode(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  textContent: string,
  lanes: Lanes
): Fiber {
  if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
    // deleteRemainingChildren 对旧 fiber 后面的所有兄弟节点添加 Deletion 副作用标记，用于 dom 更新时删除
    // useFiber 传入 textContext 复用当前 fiber
    deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
    const existing = useFiber(currentFirstChild, textContent);
    existing.return = returnFiber;
    return existing;
  }
  // 若未匹配到，createFiberFromText 创建新的 fiber
  deleteRemainingChildren(returnFiber, currentFirstChild);
  const created = createFiberFromText(textContent, returnFiber.mode, lanes);
  created.return = returnFiber;
  return created;
}
```

新内容为纯文本时 diff 比较简单，只需要判断当前父 fiber 的第一个旧子 fiber 类型：

- 当前 fiber 也为文本类型的节点时，`deleteRemainingChildren` 对第一个旧子 fiber 的所有兄弟 fiber 添加 `Deletion` 副作用标记，然后通过 `useFiber` 基于当前 fiber 和 textContent 创建新的 fiber 复用，将其 return 指向父 fiber
- 否则通过 `deleteRemainingChildren` 对所有旧的子 fiber 添加 `Deletion` 副作用标记，然后 `createFiberFromText` 创建新的文本类型 fiber 节点，将其 return 指向父 fiber

所以对文本类型 diff 的流程如下：
<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c96ba9ea85eb4083b85d3b3c554c9669~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

### 新内容为数组类型

上面所说的两种情况，都是一个或多个子 fiebr 变成单个 fiber。新内容为数组类型时，意味着要将一个或多个子 fiber 替换为多个 fiber，内容相对复杂，我们看一下 `reconcileChildrenArray` 的[源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.old.js)：

```ts
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,
  lanes: Lanes
): Fiber | null {
  // 开发环境下会校验 key 是否存在且合法，否则会报 warning
  if (__DEV__) {
    let knownKeys = null;
    for (let i = 0; i < newChildren.length; i++) {
      const child = newChildren[i];
      knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
    }
  }

  let resultingFirstChild: Fiber | null = null; // 最终要返回的第一个子 fiber
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;
  // 因为在实际的应用开发中，react 发现更新的情况远大于新增和删除的情况，所以这里优先处理更新
  // 根据 oldFiber 的 index 和 newChildren 的下标，找到要对比更新的 oldFiber
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    // 通过 updateSlot 来 diff oldFiber 和新的 child，生成新的 Fiber
    // updateSlot 与上面两种类型的 diff 类似，如果 oldFiber 可复用，则根据 oldFiber 和 child 的 props 生成新的 fiber；否则返回 null
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes
    );
    // newFiber 为 null 说明不可复用，退出第一轮的循环
    if (newFiber === null) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        deleteChild(returnFiber, oldFiber);
      }
    }
    // 记录复用的 oldFiber 的 index，同时给新 fiber 打上 Placement 副作用标签
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

    if (previousNewFiber === null) {
      // 如果上一个 newFiber 为 null，说明这是第一个生成的 newFiber，设置为 resultingFirstChild
      resultingFirstChild = newFiber;
    } else {
      // 否则构建链式关系
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  if (newIdx === newChildren.length) {
    // newChildren遍历完了，说明剩下的 oldFiber 都是待删除的 Fiber
    // 对剩下 oldFiber 标记 Deletion
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  if (oldFiber === null) {
    // olderFiber 遍历完了
    // newChildren 剩下的节点都是需要新增的节点
    for (; newIdx < newChildren.length; newIdx++) {
      // 遍历剩下的 child，通过 createChild 创建新的 fiber
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      // 处理dom移动，// 记录 index，同时给新 fiber 打上 Placement 副作用标签
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      // 将新创建 fiber 加入到 fiber 链表树中
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // oldFiber 和 newChildren 都未遍历完
  // mapRemainingChildren 生成一个以 oldFiber 的 key 为 key， oldFiber 为 value 的 map
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  // 对剩下的 newChildren 进行遍历
  for (; newIdx < newChildren.length; newIdx++) {
    // 找到 mapRemainingChildren 中 key 相等的 fiber, 创建新 fiber 复用
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes
    );
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          // 删除当前找到的 fiber
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key
          );
        }
      }
      // 处理dom移动，记录 index，同时给新 fiber 打上 Placement 副作用标签
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      // 将新创建 fiber 加入到 fiber 链表树中
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }

  if (shouldTrackSideEffects) {
    // 剩余的旧 fiber 的打上 Deletion 副作用标签
    existingChildren.forEach((child) => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}
```

从上述代码我们可以得知，对于新增内容为数组时，react 会对旧 fiber 和 newChildren 进行遍历。

1. 首先先对 newChildren 进行第一轮遍历，将当前的 oldFiber 与 当前 newIdx 下标的 newChild 通过 `updateSlot` 进行 diff，diff 的流程和上面单节点的 diff 类似，然后返回 diff 后的结果：
   - 如果 diff 后 oldFiber 和 newIdx 的 key 和 type 一致，说明可复用。根据 oldFiber 和 newChild 的 props 生成新的 fiber，通过 `placeChild` 给新生成的 fiber 打上 `Placement` 副作用标记，同时新 fiber 与之前遍历生成的新 fiber 构建链表树关系。然后继续执行遍历，对下一个 oldFiber 和下一个 newIdx 下标的 newFiber 继续 diff
   - 如果 diff 后 oldFiber 和 newIdx 的 key 或 type 不一致，那么说明不可复用，返回的结果为 null，第一轮遍历结束
2. 第一轮遍历结束后，可能会执行以下几种情况：
   - 若 newChildren 遍历完了，那剩下的 oldFiber 都是待删除的，通过 `deleteRemainingChildren` 对剩下的 oldFiber 打上 `Deletion` 副作用标记
   - 若 oldFiber 遍历完了，那剩下的 newChildren 都是需要新增的，遍历剩下的 newChildren，通过 `createChild` 创建新的 fiber，`placeChild` 给新生成的 fiber 打上 `Placement` 副作用标记并添加到 fiber 链表树中。
   - 若 oldFiber 和 newChildren 都未遍历完，通过 `mapRemainingChildren` 创建一个以剩下的 oldFiber 的 key 为 key，oldFiber 为 value 的 map。然后对剩下的 newChildren 进行遍历，通过 `updateFromMap` 在 map 中寻找具有相同 key 创建新的 fiber(若找到则基于 oldFiber 和 newChild 的 props 创建，否则直接基于 newChild 创建)，则从 map 中删除当前的 key，然后`placeChild` 给新生成的 fiber 打上 `Placement` 副作用标记并添加到 fiber 链表树中。遍历完之后则 existingChildren 还剩下 oldFiber 的话，则都是待删除的 fiber，`deleteChild` 对其打上 `Deletion` 副作用标记。

所以整体的流程如下：
<img src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dfd0cc7eddf34620b73046cc685e8237~tplv-k3u1fbpfcp-watermark.image?" width="100%" />

## diff 后的渲染

diff 流程结束后，会形成新的 fiber 链表树，链表树上的 fiber 通过 flags 字段做了副作用标记，主要有以下几种：

1. Deletion：会在渲染阶段对对应的 dom 做删除操作
2. Update：在 fiber.updateQueue 上保存了要更新的属性，在渲染阶段会对 dom 做更新操作
3. Placement：Placement 可能是插入也可能是移动，实际上两种都是插入动作。react 在更新时会优先去寻找要插入的 fiber 的 sibling，如果找到了执行 dom 的 `insertBefore` 方法，如果没有找到就执行 dom 的 `appendChild` 方法，从而实现了新节点插入位置的准确性

在 `completeUnitWork` 阶段结束后，react 会根据 fiber 链表树的 flags，构建一个 effectList 链表，里面记录了哪些 fiber 需要进行插入、删除、更新操作，在后面的 commit 阶段进行真实 dom 节点的更新，下一章将详细讲述 commit 阶段。
