---
desc: '众所周知，Code Review 是开发过程中一个非常重要的环节，但是很多公司或者团队是没有这一环节的，今天笔者结合自己所在团队，浅谈 Code Review 的价值及如何实施。'
tag: ['代码规范', 'team']
time: '2021-05-08'
---

# 团队如何实施 Code Review

众所周知，Code Review 是开发过程中一个非常重要的环节，但是很多公司或者团队是没有这一环节的，今天笔者结合自己所在团队，浅谈 Code Review 的价值及如何实施。

## 1. Code Review 的价值

许多团队没有 Code Review 环节，或者因为追求项目快速上线，认为 CR 浪费时间；或者团队成员缺少 CR 观念，认为 CR 的价值并不大。所以想要推动 CR 在团队中的实施，最最重要的一点便是增强团队成员对 CR 环节的认同感。
<br>

Code Review 环节，它更加依赖于团队成员的主观能动性，只有团队成员对其认可，他们才会积极地参入这一环节，CR 的价值才能最大化的体现。如果团队成员不认可 CR，即使强制设置了 CR 流程，也是形同虚设，反而可能阻碍正常开发流程的效率。那么如何让团队成员认可 CR 环节呢，自然是让他们意识到 CR 的价值，然后就会……真香！
<br>
![](//p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f5e284a8e87e4340b5f20e9c88fb2777~tplv-k3u1fbpfcp-zoom-1.image)<br>

### 1.1 提升团队代码质量

随着团队规模的扩大和项目的迭代升级，团队之间的信息透明度会越来越低，项目的可维护性也会越来越差，可能引发如下一系列问题：

1. 已有的 utils 方法，重复造轮子
2. 代码过于复杂，缺少必要注释，后人难以维护
3. 目录结构五花八门，杂乱不堪
   <br>
   ……
   <br>
   合理的 CR 环节，可以有效地把控每次提交的代码质量，不至于让项目的可维护性随着版本迭代和时间推移变得太差，这也是 CR 的首要目的。
   <b>CR 环节并不会降低开发效率</b>，就一次代码提交来说，也许部分人认为 CR 可能花费了时间，但是有效的 CR 给后人扩展和维护时所节省的时间是远超于此的。

### 1.2 团队技术交流

Reviewer 和 Reviewee，在参与 CR 的过程中，都是可以收获到许多知识，进行技术交流的。

1. 有利于帮助新人快速成长，团队有新人加入时（如实习生和校招生），往往需要以为导师带领一段时间，通过 CR 环节，可以使导师最直接的了解到新人开发过程中所遇到的问题，作出相应的指导。
2. 通过 CR 环节，团队成员可以了解他人的业务，而不局限于自己的所负责的业务范围。项目发现问题时，可以迅速定位到相关业务的负责人进行修改。同时若有的团队成员离职后，也可以减少业务一人负责所带来的后期维护困难。
3. 学习他人的优秀代码。通过 CR 环节，可以迅速接触到团队成员在项目中解决某些问题的优秀代码，或者使用的一些你所未接触过的一些 api 等。

### 1.3 保证项目的统一规范

既然要进行 CR，首先要对项目的规范制定要求，包括编码风格规范、目录结构规范、业务规范等等。一方面，统一的项目规范才能保证项目的代码质量，提高项目的质量和可维护性；另一方面，在大家熟悉了统一的规范后，能够提升 CR 的效率，节省时间。

## 2. Code Review 的实践

关于 Code Review 的实践，要考虑的包括 CR 所花费的时间、CR 的形式、何时进行 CR 等等。

### 2.1 预留 CR 的时间

首先不得不承认，CR 环节是要耗费一定时间的，所以在项目排期中，不仅要考虑开发、联调、提测、改 bug 等时间，还要预留出 CR 的时间。包括担任 Reviewer 和 Reviewee 角色的时间都要考虑。
<br>
另外如果遇到的需求比较复杂，为了避免因为 CR 过程导致代码需要大量修改，最好提前和团队成员沟通好需求的设计和结果思路。

### 2.2 CR 的形式

我所见过的 CR 大多有两种形式。一种是设立一个特定时间，例如每周或者每半月等等，团队成员一起对之前的 Merge Request 进行 CR；另一种是对每次的 Merge Request 都进行 CR。
<br>

我个人更偏向于后者。第一种定期 CR，Merge Request 的数量太多，不太可能对所有的 MR 进行 CR，如果 CR 之后再对之前的诸多 MR 进行修改成本太大；而且一次性太多的 CR 会打击团队成员的积极性。第二种 MR 相对就轻松的多，可以考虑轮班每天设置 2-3 人对当天的 MR 进行 CR 即可。

### 2.3 CR 的时机

CR 的环节应该设立在提测环节之前。因为 CR 后如果优化代码虽然理论上只是代码优化，但很可能会对业务逻辑产生影响，如果在提测时候，那么可能会影响到已经测试过的功能点。
<br>
当然也要分情况，如果遇到比较紧急的需求或者 bug 修复，那么也可以先提测，后续再做相应的 CR。

## 3. 对团队成员要求

前面已经提到，要增强团队成员对 CR 环节的认同感。作为 CR 环节的参与者，还应该根据自己的团队特点，对团队成员做出相应要求，可以参考我们团队。

### 3.1 Reviewer

1. 指明 review 的级别。reviewer 再给相应的代码添加评论时，建议指明评论的级别，可以在评论前用[]作出标识，例如：<br>
   - [request]xxxxxxx 　　　　　　　此条评论的代码必须修改才能予以通过
   - [advise]xxxxxxxx 　　　　　　　此条评论的代码建议修改，但不修改也可以通过
   - [question]xxxxxx 　　　　　　　此条评论的代码有疑问，需 reviewee 进一步解释
2. 讲明该评论的原因。在对代码做出评论时，应当解释清楚原因，如果自己有现成的更好地解决思路，应该把相应的解决思路也评论上，节省 reviewee 的修改时间。
3. 平等友善的评论。评论者在 review 的过程中，目的是提升项目代码质量，而不是抨击别人，质疑别人的能力，应该保持平等友善的语气。
4. 享受 Code Review。只有积极的参与 CR，把 CR 作为一种享受，才能将 CR 的价值最大化的体现。

### 3.2 Reviewee

1. 注重注释。对于复杂代码写明相应注释，在进行 commit 时也应简明的写清楚背景，帮助 reviewer 理解，提高 review 的效率。
2. 保持乐观的心态接受别人的 review。团队成员的 review 不是对你的批判，而是帮助你的提升，所以要尊重别人的 review，如果 review 你感觉不正确，可以在下面提出疑问，进一步解释。
3. 完成相应 review 的修改应当在下面及时进行回复，保持信息同步。
