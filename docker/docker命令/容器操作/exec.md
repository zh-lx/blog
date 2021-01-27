# docker exec

<b>docker exec: </b>在运行的容器中执行命令

## 语法

```
docker exec [OPTIONS] CONTAINER COMMAND [ARG...]
```

## OPTIONS 配置

- -d :分离模式: 在后台运行
- -i :即使没有附加也保持 STDIN 打开
- -t :分配一个伪终端

## 实例

在容器 mynginx 中以交互模式执行容器内 /root/ok.sh 脚本:

```
docker exec -it mynginx /bin/sh /root/ok.sh
```

在容器 mynginx 中开启一个交互模式的终端：

```
docker exec -i -t  mynginx /bin/bash
```
