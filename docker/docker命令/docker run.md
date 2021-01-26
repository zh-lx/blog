# docker run

<b>docker run：</b>创建一个新的容器并运行一个命令。

## 语法

```
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

## OPTIONS 配置

- -d: 后台运行容器，并返回容器的 id
- -p: 指定端口映射，格式为：`主机端口:容器端口`
- -v: 指定目录映射，格式为：`主机目录:容器目录`
- --name xxx: 将容器 name 命名为 xxx
- -h xxx: 指定容器的 hostname 为 xxx
- -m: 设置容器使用内存最大值
- -e username="xxx": 设置环境变量
- --link=[]: 添加链接到另一个容器
- --expose=[]: 开放一个端口或一组端口
- --env-file=[]: 从指定文件读入环境变量
- -a stdin: 指定标准输入输出内容类型，可选 STDIN/STDOUT/STDERR 三项
- -i: 以交互模式运行容器，通常与 -t 同时使用
- -t: 为容器重新分配一个伪输入终端，通常与 -i 同时使用
- --dns 8.8.8.8: 指定容器使用的 DNS 服务器，默认和宿主一致

## example

使用 docker 镜像 nginx:latest 以后台模式启动一个容器,并将容器命名为 mynginx:

```
docker run --name mynginx -d nginx:latest
```

使用镜像 nginx:latest, 以后台模式启动一个容器, 将容器的 8020 端口映射到主机的 80 端口, 并将主机的目录 /www/wwwroot/rap 映射到容器的 /use/share/nginx/html 目录

```
docker run -p 8020:80 -v $PSD/www/wwwroot/rap:/usr/share/nginx/html nginx:latest
```

使用镜像 nginx:latest 以交互模式启动一个容器, 并在容器内执行/bin/bash 命令。

```
docker run -it nginx:latest /bin/bash
```
