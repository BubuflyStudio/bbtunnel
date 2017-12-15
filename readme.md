# bbtunnel 内网穿透

## 使用
执行 `npm install -g bbtunnel` 安装 `bbtunnel` 内网穿透工具。

### 服务端
服务端需要在公网的服务器上安装（服务端执行 `npm install -g bbtunnel` 安装 `bbtunnel`）

安装完成后，执行 `bbt-server -f <服务端配置文件路径>` 即可启动服务端，其中配置文件
路径默认为执行该命令时所在目录下的 `bbt_config.js` 文件，使用 `-f` 参数可以指定自定
义的文件路径。

需要注意的是配置文件为 `.js` 文件，格式如下：
```js
module.exports = {
    // 客户端连接配置，格式为 <host>: <password>（客户端连接时需要指定监听的域与对应的密码）
    connMap: {
        'aaa.test.com': '123456',
        'bbb.test.com': '123456'
    },
    httpPort: 80,       // 监听来自外网的 http 服务，默认80端口
    socksPort: 8000     // 监听来自内网的 socksv5 连接服务，默认8000端口
};
```

启动后即会启动监听 `80` 端口的 `http` 服务，与监听 `8000` 端口的 `socksv5` 连接。

### 客户端
客户端在为本地安装（本地执行 `npm install -g bbtunnel` 安装 `bbtunnel`）

安装完成后，执行 `bbt-client -f <客户端配置文件路径>` 即可启动客户端。需要注意的是在
启动 `bbt-client` 之前，需要先启动本地计划暴露到公网的 `http` 服务，否则客户端会启动
失败（会有相应提示）。

客户端默认的配置文件路径为执行该命令时所在目录下的 `bbt_config.js` 文件，使用 `-f` 参
数可以指定自定义的文件路径。

需要注意的是配置文件为 `.js` 文件，格式如下：
```js
module.exports = {
    // 连接配置，可以同时连接多个域（服务端的 connMap 需要包含这些域）
    connMap: {
        'aaa.test.com': '123456'
    },
    socksHost: 'aaa.test.com',  // bbt-server 所在的地址
    socksPort: 8000,            // bbt-server 监听的 socksv5 服务端口，默认为 8000
    localHttpPort: 3000,        // 本地 http 服务所监听的端口，默认为 3000
    connLimit: 20               // 最大并发连接数，默认为 20
};
```

位于公网的服务端与位于内网的本地 http 服务、客户端启动后，内网的 http 服务即暴露到了公
网，可以直接从公网访问内网的 http 服务。

## 原理说明
如图：
![desc.png](https://raw.githubusercontent.com/BubuflyStudio/bbtunnel/master/desc.png)

1. `bbt-client` 会主动通过 `socksv5` 的方式与公网的 `bbt-server` 建立连接通道  
2. 当 `bbt-server` 收到相应的 `http` 请求时，它会将该 `http` 请求通过建立的 `socksv5` 通
道发给 `bbt-client`  
3. `bbt-client` 会将该请求进一步转发给本地的 `http` 服务，得到请求结果后将结果通过 `socksv5`
通道返回给 `bbt-server`  
4. `bbt-server` 将请求结果返回给访问的浏览器
