---
tag: 'docker'
---

# docker build

<b>docker build: </b>使用 Dockerfile 创建镜像

## 语法

```
docker build [OPTIONS] PATH | URL | -
```

## OPTIONS 配置

- --build-arg=[]: 设置镜像创建时的变量
- --cpu-shares: 设置 cpu 使用权重
- --cpu-period: 限制 CPU CFS 周期
- --cpu-quota: 限制 CPU CFS 配额
- --cpuset-cpus: 指定使用的 CPU id
- --cpuset-mems: 指定使用的内存 id
- --disable-content-trust: 忽略校验，默认开启
- -f: 指定要使用的 Dockerfile 路径
- --force-rm: 设置镜像过程中删除中间容器
- --isolation: 使用容器隔离技术
- --label=[]: 设置镜像使用的元数据
- -m: 设置内存最大值
- --memory-swap: 设置 Swap 的最大值为内存+swap，"-1"表示不限 swap
- --no-cache: 创建镜像的过程不使用缓存
- --pull: 尝试去更新镜像的新版本
- --quiet, -q: 安静模式，成功后只输出镜像 ID
- --rm: 设置镜像成功后删除中间容器
- --shm-size: 设置/dev/shm 的大小，默认值是 64M
- --ulimit: Ulimit 配置
- --squash: 将 Dockerfile 中所有的操作压缩为一层
- --tag, -t: 镜像的名字及标签，通常 name:tag 或者 name 格式；可以在一次构建中为一个镜像设置多个标签
- --network: 默认 default。在构建期间设置 RUN 指令的网络模式

## Example

使用当前目录的 Dockerfile 创建镜像，标签为 mynginx

```
docker build -t nginx:01 .
```

使用 URL github.com/creack/docker-firefox 的 Dockerfile 创建镜像

```
docker build github.com/creack/docker-firefox
```

通过/path/to/a/Dockerfile 路径下的 Dockerfile 创建镜像

```
docker build -f /path/to/a/Dockerfile .
```
