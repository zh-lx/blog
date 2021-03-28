# docker-compose

## docker-compose 是什么

- Docker Compose 是一个工具，命令行工具。
- 这个工具可以通过 yml 文件定义多容器的 docker 应用
- 通过一条命令就可以根据 yml 文件的定义去创建或者管理这多个容器

## 安装

Linux 上我们可以从 Github 上下载它的二进制包来使用，最新发行的版本地址：[docker compose](https://github.com/docker/compose/releases)

通过以下命令使用 daocloud 加速下载

```go
sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/1.28.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

将可执行权限应用于二进制文件：

```
sudo chmod +x /usr/local/bin/docker-compose
```

创建软链：

```
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

测试是否安装成功：

```
docker-compose --version
cker-compose version 1.24.1, build 4667896b
```

## Example

1.编写 docker-compose.yml 文件，例如：

```yml
version: '3.1'
services:
  mongo:
    image: mongo
    restart: always
    ports:
      - 27017:27017
  mongo-express:
    image: mongo-express
    restart: always
    ports:
      - 8000:8081
```

2.执行构建

```
docker-compose up
```
