# docker pull

<b>docker pull: </b>从镜像仓库中拉取或者更新指定镜像

## 语法

```
docker pull [OPTIONS] NAME[:TAG|@DIGEST]
```

## OPTIONS 配置

- -a: 拉取所有 tagged 镜像
- --disable-content-trust: 忽略镜像的校验,默认开启

## example

从 Docker Hub 下载最新版 nginx 镜像：

```
docker pull latest
```

从 Docker Hub 下载 REPOSITORY 为 nginx 的所有镜像:

```
docker pull -a latest
```
