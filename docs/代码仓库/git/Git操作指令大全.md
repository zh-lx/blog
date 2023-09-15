---
desc: '本文总结了日常工作中常用的 git 指令，涵盖了绝大部分的使用场景，让你能够轻松应对各种 git 协作流程。'
cover: 'https://github.com/zh-lx/blog/assets/73059627/789ee5e2-6e23-4ab5-9e1c-37b2ebaef68d'
tag: ['git']
time: '2021-12-31'
---

# Git 操作指令大全

本文总结了日常工作中常用的 git 指令，涵盖了绝大部分的使用场景，让你能够轻松应对各种 git 协作流程。

## 理解 git 工作区域

根据 git 的几个文件存储区域，git 的工作区域可以划分为 4 个：

- 工作区：你在本地编辑器里改动的代码，所见即所得，里面的内容都是最新的
- 暂存区：通过 `git add` 指令，会将你工作区改动的代码提交到暂存区里
- 本地仓库：通过 `git commit` 指令，会将暂存区变动的代码提交到本地仓库中，本地仓库位于你的电脑上
- 远程仓库：远端用来托管代码的仓库，通过 `git push` 指令，会将本地仓库的代码推送到远程仓库中

![git工作区域 (1)](https://user-images.githubusercontent.com/73059627/147815799-95b9f49e-ece3-4d34-ba43-235059450cc4.png)

## 初始配置

### 配置用户信息

首次使用 git 时，设置提交代码时的信息：

```perl
# 配置用户名
git config --global user.name "yourname"

# 配置用户邮箱
git config --global user.email "youremail@xxx.com"

# 查看当前的配置信息
git config --global --list

# 通过 alias 配置简写
## 例如使用 git co 代替 git checkout
git config --global alias.co checkout
```

### ssh key

向远端仓库提交代码时，需要在远端仓库添加本地生成的 ssh key。

1. 生成本地 ssh key，若已有直接到第 2 步:

   ```
   ssh-keygen -t rsa -C "youremail@xxx.com"
   ```

2. 查看本地 ssh key:

   ```
   cat ~/.ssh/id_rsa.pub
   ```

3. 将 ssh key 粘贴到远端仓库：

   ![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/97e83aa5a3064a2bb70b196a17bfc744~tplv-k3u1fbpfcp-watermark.image?)

## 高频命令

以下是最常用的操作，需要任何一个开发者学会的 git 命令：

### git clone: 克隆仓库

```perl
# 克隆远端仓库到本地
git clone <git url>

# 克隆远端仓库到本地，并同时切换到指定分支 branch1
git clone <git url> -b branch1

# 克隆远端仓库到本地并指定本地仓库的文件夹名称为 my-project
git clone <git url> my-project
```

### git add: 提交到暂存区

工作区提交到暂存区，用到的指令为 `git add`：

```perl
# 将所有修改的文件都提交到暂存区
git add .

# 将修改的文件中的指定的文件 a.js 和 b.js 提交到暂存区
git add ./a.js ./b.js

# 将 js 文件夹下修改的内容提交到暂存区
git add ./js
```

### git commit: 提交到本地仓库

将工作区内容提交到本地仓库所用到的指令为 `git commit`：

```perl
# 将工作区内容提交到本地仓库，并添加提交信息 your commit message
git commit -m "your commit message"

# 将工作区内容提交到本地仓库，并对上一次 commit 记录进行覆盖
## 例如先执行 git commit -m "commit1" 提交了文件a，commit_sha为hash1；再执行 git commit -m "commit2" --amend 提交文件b，commit_sha为hash2。最终显示的是a，b文件的 commit 信息都是 "commit2"，commit_sha都是hash2
git commit -m "new message" --amend

# 将工作区内容提交到本地仓库，并跳过 commit 信息填写
## 例如先执行 git commit -m "commit1" 提交了文件a，commit_sha为hash1；再执行 git commit --amend --no-edit 提交文件b，commit_sha为hash2。最终显示的是a，b文件的 commit 信息都是 "commit1"，commit_sha都是hash1
git commit --amend --no-edit

# 跳过校验直接提交，很多项目配置 git hooks 验证代码是否符合 eslint、husky 等规则，校验不通过无法提交
## 通过 --no-verify 可以跳过校验（为了保证代码质量不建议此操作QwQ）
git commit --no-verify -m "commit message"

# 一次性从工作区提交到本地仓库，相当于 git add . + git commit -m
git commit -am
```

### git push: 提交到远程仓库

`git push` 会将本地仓库的内容推送到远程仓库

```perl
# 将当前本地分支 branch1 内容推送到远程分支 origin/branch1
git push

# 若当前本地分支 branch1，没有对应的远程分支 origin/branch1，需要为推送当前分支并建立与远程上游的跟踪
git push --set-upstream origin branch1

# 强制提交
## 例如用在代码回滚后内容
git push -f
```

### git pull: 拉取远程仓库并合并

`git pull` 会拉取远程仓库并合并到本地仓库，相当于执行 `git fetch` + `git merge`

```perl
# 若拉取并合并的远程分支和当前本地分支名称一致
## 例如当前本地分支为 branch1，要拉取并合并 origin/branch1，则直接执行：
git pull

# 若拉取并合并的远程分支和当前本地分支名称不一致
git pull <远程主机名> <分支名>
## 例如当前本地分支为 branch2，要拉取并合并 origin/branch1，则执行：
git pull git@github.com:zh-lx/git-practice.git branch1

# 使用 rebase 模式进行合并
git pull --rebase
```

### git checkout: 切换分支

`git checkout` 用于切换分支及撤销工作区内容的修改

```perl
# 切换到已有的本地分支 branch1
git checkout branch1

# 切换到远程分支 branch1
git checkout origin/branch1

# 基于当前本地分支创建一个新分支 branch2，并切换至 branch2
git checkout -b branch2

# 基于远程分支 branch1 创建一个新分支 branch2，并切换至 branch2
git checkout origin/branch1 -b branch2
## 当前创建的 branch2 关联的上游分支是 origin/branch1，所以 push 时需要如下命令关联到远程 branch2
git push --set-upstream origin branch2

# 撤销工作区 file 内容的修改。危险操作，谨慎使用
git checkout -- <file>

# 撤销工作区所有内容的修改。危险操作，谨慎使用
git checkout .
```

### git restore: 取消缓存

`git restore` 用于将改动从暂存区退回工作区

```perl
# 将 a.js 文件取消缓存（取消 add 操作，不改变文件内容）
git reset --staged a.js

# 将所有文件取消缓存
git reset --staged .
```

### git reset: 回滚代码

`git reset` 用于撤销各种 commit 操作，回滚代码

```perl

# 将某个版本的 commit 从本地仓库退回到工作区（取消 commit 和 add 操作，不改变文件内容）
## 默认不加 -- 参数时时 mixed
git reset --mixed <commit_sha>

# 将某个版本的 commit 从本地仓库退回到缓存区（取消 commit 操作，不取消 add，不改变文件内容）
git reset --soft <commit_sha>

# 取消某次 commit 的记录（取消 commit 和 add，且改变文件内容）
git reset --hard <commit_sha>

## 以上三种操作退回了 commit，都是退回本地仓库的 commit，没有改变远程仓库的 commit。通常再次修改后配合如下命令覆盖远程仓库的 commit：
git push -f
```

## 常用命令

实际的 git 操作场景很多，下面的命令也经常在场景中使用。

### git revert: 取消某次 commit 内容

#### 说明

`git revert` 相比于 `git reset`，会取消某次 commit 更改的内容，但是不会取消掉 commit 记录，而是进行一次新的 commit 去覆盖要取消的那次 commit：

```perl
# 取消某次 commit 内容，但是保留 commit 记录
git revert <commit-sha>
```

#### 场景

某一版需求中，pm 共提了活动功能、分享功能和视频功能三个功能模块，然后开发老哥做完提测了。上线之前，版本的代码都已经合并到主分支了，pm 突然说这一版活动功能不上线了，下一版再上，分享功能和视频功能正常上线，开发老哥心里直呼 mmp。<br />
研发老哥的 commit 记录如下：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ae60cc0efc7849df8c093270a605f5cc~tplv-k3u1fbpfcp-watermark.image?)

现在想要做的就是取消掉第一次活动功能的 commit，但是视频功能和分享功能的 commit 还需要保留，所以肯定不能使用 `git reset` 了, 这时候 `git revert` 就派上用场了。

执行 `git revert 9ec52dc`，再重新 `git push`，活动功能的 commit 内容就会被覆盖掉了：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0841540af0a2460fb1303b0b07b55506~tplv-k3u1fbpfcp-watermark.image?)

### git rebase: 简洁 commit 记录

`git rebase` 命令主要是针对 commit 的，目的是令 commit 记录变得更加简洁清晰。

#### 多次 commit 合并为一次

可以通过 `git rebase -i` 合并多次 commit 为一次。<b>注意：此操作会修改 commit-sha，因此只能在自己的分支上操作，不能在公共分支操作，不然会引起他人的合并冲突</b>

##### 说明

```perl
# 进行 git rebase 可交互命令变基，end-commit-sha 可选，不填则默认为 HEAD
## start 和 end commit-sha 左开右闭原则
git rebase -i <start commit-sha> <end commit-sha>

# 若是中间毫无冲突，变基则一步到位，否则需要逐步调整

# 上次变基为完成，继续上一次的变基操作
git rebase --continue

# 变基有冲突时丢弃有冲突的 commit
git rebase --skip

# 若是变基中途操作错误但是未彻底完成，可以回滚到变基之前的状态
git rebase --abort
```

执行后，会出现可交互命令，界面如下：
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9bee6388d4994a4e9795ba0cf0e564e4~tplv-k3u1fbpfcp-watermark.image?)

- pick: 是保留该 commit(采用)
- edit: 一般你提交的东西多了,可以用这个把东东拿回工作区拆分更细的 commit
- reword: 这个可以重新修改你的 commit msg
- squash: 内容保留，把提交信息往上一个 commit 合并进去
- fixup: 保留变动内容，但是抛弃 commit msg

##### 场景

开发老哥在自己的分支开发一个活动功能，共如下 4 次 commit 记录：
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2ea71e1a0415494287ca367698d758e0~tplv-k3u1fbpfcp-watermark.image?)
要往主分支合并之前，开发老哥决定让 commit 记录简洁一些，于是执行 `git rebase -i edb259`：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d7a89bbede43428fb73cff7175dfd49d~tplv-k3u1fbpfcp-watermark.image?)
上面四行就是我们要进行合并的 commit，我们现在是进入了一个 vim 界面，按 `i` 进行编辑，将活动功能 2, 3, 4 行改为 s(squash) 如下：
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cdb2a3dcfb744cc28600d72c98b6d87b~tplv-k3u1fbpfcp-watermark.image?)
按下 `esc` 退出编辑，再输入 `wq` 退出当前的 vim，会进入到此页面编辑 commit 信息：
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2a9e6569d4ba4bd98abaef19d0914519~tplv-k3u1fbpfcp-watermark.image?)
我们可以修改 `feat: 活动奖励1` 为 `feat: 活动奖励`，然后 `esc` 退出编辑，再输入 `wq!` 退出当前的 vim。再次 `git push -f` 推送分支，可以看到 commit 已经合并为一次：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4fe5d586914b45a48c9b3873eb2e7a34~tplv-k3u1fbpfcp-watermark.image?)

#### 使用 rebase 代替 merge

##### 说明

前面说到过 `git pull` = `git fetch` + `git merge`，通过加 --rebase 参数可以启用 rebase 模式， 实际上 `git pull --rebase` = `git fetch` + `git rebase`。

`git rebase` 代替 `git merge` 是现在许多公司和团队要求使用的一种合并方式。相比于 `git merge`，`git rebase` 可以让分支合并后只显示 master 一条线，并且按照 commit 和时间去排序，使得 git 记录简洁和清晰了许多。

```perl
# 将本地某分支合并至当前分支
git rebase <分支名>

# 将远程某分支合并至当前分支
git rebase <远程主机名> <分支名>
```

##### 场景

假设我们有一个 main 分支，基于 main 分支拉出了一个 feat-1.2 分支。然后在 main 分支先进行了 `feat: 1`、`feat: 2` 两次 commit，再在 feat-1.2 分支进行了 `feat: 3`、`feat: 4` ，最后将 feat-1.2 分支合并至 master 分支。

如果采用 `git merge` 合并，通过 `git log --graph --decorate --all` 查看分支变更图如下：
![merge](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b3ba346519c74dbbb6ad1e966bc5016d~tplv-k3u1fbpfcp-watermark.image?)
如果采用 `git rebase` 合并，通过 `git log --graph --decorate --all` 查看分支变更图如下：
![rebase](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/626e125335b24f3aaf325cfcdfad1340~tplv-k3u1fbpfcp-watermark.image?)

### git cherry-pick: 合并指定 commit

#### 说明

`git cherry-pick` 可以选择某次 commit 的内容合并到当前分支

```perl
# 将 commit-sha1 的变动合并至当前分支
git cherry-pick commit-sha1

# 将多次 commit 变动合并至当前分支
git cherry-pick commit-sha1 commit-sha2

# 将 commit-sha1 到 commit-sha5 中间所有变动合并至当前分支，中间使用..
git cherry-pick commit-sha1..commit-sha5

# pick 时解决冲突后继续 pick
git cherry-pick --continue：
# 多次 pick 时跳过本次 commit 的 pick 进入下一个 commit 的 pick
git cherry-pick --skip
# 完全放弃 pick，恢复 pick 之前的状态
git cherry-pick --abort
# 未冲突的 commit 自动变更，冲突的不要，退出这次 pick
git cherry-pick --quit
```

#### 场景

某开发老哥 A 和开发老哥 B 共同开发一次版本需求，开发老哥 A 拉了一个 `feat-acitivty` 分支开发活动功能，开发老哥 B 拉了一个 `feat-share` 分支开发分享功能，需要分开提交测试。

开发老哥 B 开发了一半发现需要用到一个弹窗组件，此时开发老哥 A 也需要弹窗组件并且已经开发完了，开发老哥 A 的 commit 如下：
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cc6efe004f804f9b9838c11ceb5bcaf4~tplv-k3u1fbpfcp-watermark.image?)

此时 `git cherry-pick` 就起作用了，开发老哥 B 执行如下命令：`git cherry-pick 486885f`，轻松将弹窗组件的代码也合并进了自己的分支。

### git stash：缓存代码

#### 说明

`git stash` 用于将当前的代码缓存起来，而不必提交，便于下次取出。

```perl
# 把本地的改动缓存起来
git stash

# 缓存代码时添加备注，便于查找。强烈推荐
git stash save "message"

# 查看缓存记录
## eg: stash@{0}: On feat-1.1: 活动功能
git stash list

# 取出上一次缓存的代码，并删除这次缓存
git stash pop
# 取出 index 为2缓存代码，并删除这次缓存，index 为对应 git stash list 所列出来的
git stash pop stash@{2}

# 取出上一次缓存的代码，但不删除这次缓存
stash apply
# 取出 index 为2缓存代码，但不删除缓存
git stash apply stash@{2}

# 清除某次的缓存
git stash drop stash@{n}

# 清除所有缓存
git stash clear
```

#### 场景

某日开发老哥正愉快地开发着活动功能的代码，突然 pm 大喊：线上出 bug 了！！于是开发老哥不得不停下手头的工作去修改线上 bug，但是开发老哥又不想将现在的活动代码提交，于是开发老哥执行了 stash 命令：`git stash message "活动功能暂存"`，之后转去修复线上 bug 了。

## 其他常用命令

以下命令在开发中也经常用到，强烈推荐大家学习：

### git init: 初始化仓库

`git init` 会在本地生成一个 .git 文件夹，创建一个新的本地仓库：

```
git init
```

### git remote: 关联远程仓库

`git remote` 用于将本地仓库与远程仓库关联

```perl
# 关联本地 git init 到远程仓库
git remote add origin <git url>

# 新增其他上游仓库
git remote add <git url>

# 移除与远程仓库的管理
git remote remove  <git url>

# 修改推送源
git remote set-url origin <git url>
```

### git status: 查看工作区状态

`git status` 用于查看工作区的文件，有哪些已经添加到了暂存区，哪些没有被添加：

```perl
# 查看当前工作区暂存区变动
git status

# 以概要形式查看工作区暂存区变动
git status -s

# 查询工作区中是否有 stash 缓存
git status --show-stash
```

### git log: 查看 commit 日志

`git log` 用于查看 commit 的日志

```perl
# 显示 commit 日志
git log

# 以简要模式显示 commit 日志
git log --oneline

# 显示最近 n 次的 commit 日志
git log -n

# 显示 commit 及分支的图形化变更
git log --graph --decorate
```

### git branch: 管理分支

`git branch` 常用于删除、重命名分支等

```perl
# 删除分支
git branch -D <分支名>

# 重命名分支
git branch -M <老分支名> <新分支名>

# 将本地分支与远程分支关联
git branch --set-upstream-to=origin/xxx

# 取消本地分支与远程分支的关联
git branch --unset-upstream-to=origin/xxx
```

### git rm：重新建立索引

`git rm` 用于修改 .gitignore 文件的缓存，重新建立索引

```perl
# 删除某个文件索引（不会更改本地文件，只会是 .gitignore 范围重新生效）
git rm --cache -- <文件名>

# 清除所有文件的索引
## 例如你首次提交了很多文件，后来你建立了一个 .gitignore 文件，有些文件不想推送到远端仓库，但此时有的文件已经被推送了
## 使用此命令可以是 .gitignore 重新作用一遍，从远程仓库中取消这些文件，但不会更改你本地文件
git rm -r --cached .
```

### git diff: 对比差异

`git diff` 用于对比工作区、缓存区、本地仓库以及分支之间的代码差异：

```perl
# 当工作区有变动，暂存区无变动，对比工作区和本地仓库间的代码差异
#  当工作区有变动和暂存区都有变动，对比工作区和暂存区的代码差异
git diff

# 显示暂存区和本地仓库间的代码差异
git diff --cached
# or
git diff --staged

# 显示两个分支之间代码差异
git diff <分支名1> <分支名2>
```

### git fetch: 获取更新

`git fetch` 用于本地仓库获取远程仓库的更新，不会 merge 到工作区

```perl
# 获取远程仓库特定分支的更新
git fetch <远程主机名> <分支名>

# 获取远程仓库所有分支的更新
git fetch --all
```

### git merge: 合并代码

`git merge` 前面在 `git rebase` 内容中也提到过，用于合并代码，用法和 `git rebase` 类似：

```perl
# 将本地某分支合并至当前分支
git merge <分支名>

# 将远程某分支合并至当前分支
git merge <远程主机名> <分支名>
```

## 总结

以上基本就涵盖了工作中绝大部分场景的 git 命令，掌握了基本可以应对各种 git 操作了。鲁迅说过：一碗酸辣汤，耳濡目染的，不如亲自呷一口的明白。看了这么多建议大家自己建一个测试仓库，亲自敲一下熟悉一下上面命令的用法。

最后总结一个大图：

![未命名文件 (6).png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/578b90796f1046048162925075deb1d3~tplv-k3u1fbpfcp-watermark.image?)
