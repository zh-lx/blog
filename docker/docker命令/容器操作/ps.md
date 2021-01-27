# docker ps

<b>docker ps: </b>列出容器

## 语法

```
docker ps [OPTIONS]
```

## OPTIONS 配置

- -a: 显示所有的容器，包括未运行的
- -f: 根据条件过滤显示的内容
- -n: 列出最近创建的 n 个容器
- -l: 显示最近创建的容器
- -q: 静默模式，只显示容器编号
- -s: 显示总的文件大小
- --format: 指定返回值的模板文件
- --no-trunc: 不截断输出

## Example

列出所有的容器信息

```
docker ps -a
```

![](https://sf6-ttcdn-tos.pstatp.com/img/edux-data/1611674860526ef4762b465~0x0.jpg)

列出正在运行的容器信息

```
docker ps
```

列出最近创建的 5 个容器信息

```
docker ps -n 5
```

列出所有创建的容器 id

```
docker ps -a -q
```

## 参数说明

针对此图的各种参数说明
![](https://sf6-ttcdn-tos.pstatp.com/img/edux-data/1611674860526ef4762b465~0x0.jpg)

- CONTAINER ID: 容器 ID
- IMAGE: 使用的镜像
- COMMAND: 启动容器时运行的命令
- CREATED: 容器的创建时间
- STATUS: 容器状态
- PORTS: 容器的端口信息和使用的连接类型（tcp\udp）
- NAMES: 自动分配的容器名称
