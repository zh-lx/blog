# docker start/stop/restart

<b>docker start: </b>启动一个或多个已经被停止的容器

<b>docker stop: </b>停止一个运行中的容器

<b>docker restart: </b>重启容器

## 语法

```
docker start [OPTIONS] CONTAINER [CONTAINER...]
```

```
docker stop [OPTIONS] CONTAINER [CONTAINER...]
```

```
docker restart [OPTIONS] CONTAINER [CONTAINER...]
```

## 实例

指令后面可以跟容器 id 或名称

启动已被停止的容器 nginx01

```
docker start nginx01
```
