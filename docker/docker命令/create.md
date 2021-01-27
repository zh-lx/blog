# docker create

<b>docker create: </b>创建一个新的容器但不启动它

## 语法

```
docker create [OPTIONS] IMAGE [COMMAND] [ARG...]
```

## OPTIONS 配置

options 用法同[docker run](./run.md)

## 实例

使用 docker 镜像 nginx:latest 创建一个容器,并将容器命名为 nginx01

```
docker create  --name nginx01  nginx:latest
```
