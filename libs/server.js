/**
 * 内网穿透服务端
 *
 * @author wujohns
 * @date 17/12/8
 */
'use strict';

const _ = require('lodash');
const http = require('http');
const socks = require('socksv5');

const SocketAgent = require('./socketAgent');

class Server {
    /**
     * 构造函数
     *
     * @param {Object} config - Server 配置
     * @param {Object} config.connMap - 连接配置
     * @param {Number} config.httpPort - http 服务端口
     * @param {Number} config.socksPort - socksv5 服务端口
     */
    constructor (config) {
        this.connMap = config.connMap;
        this.httpPort = config.httpPort;
        this.socksPort = config.socksPort;

        this.socketsMap = {};
        this.initSocksServer();
        this.initHttpServer();
    }

    /**
     * http 服务启动
     */
    initHttpServer () {
        this.httpServer = http.createServer();
        this.httpServer.on('request', (req, res) => {
            // 获取 domain
            const domain = _.get(req, 'headers.host');

            // socket 处理相关
            const sockets = _.get(this.socketsMap, domain);
            if (!sockets || _.isEmpty(sockets)) {
                // 连接耗尽
                return res.end('no more sockets, end the connect!!!');
            }

            // 创建使用指定 socket 通道的 agent
            const socket = sockets.shift();
            const agent = new SocketAgent({ socket: socket });
            const options = {
                path: req.url,
                agent: agent,
                method: req.method,
                headers: req.headers
            };

            // http 的转发
            const socketReq = http.request(options, (socketRes) => {
                res.writeHead(socketRes.statusCode, socketRes.headers);
                socketRes.pipe(res);
            });
            req.pipe(socketReq);
        });
        this.httpServer.listen(this.httpPort, () => {
            console.log(`HTTP server listening on prot ${ this.httpPort }`);
        });
    }

    /**
     * socksv5 服务启动
     */
    initSocksServer () {
        this.socksServer = socks.createServer();
        const socksAuth = socks.auth.UserPassword((encodedInfo, pwd, callback) => {
            const userInfo = this.decodeUserInfo(encodedInfo);
            const password = _.get(this.connMap, userInfo.domain);
            return callback(password === pwd);
        });

        this.socksServer.useAuth(socksAuth);

        this.socksServer.on('connection', (connInfo, accept, deny) => {
            const socket = accept(true);
            const userInfo = this.decodeUserInfo(socket.user);
            const domain = userInfo.domain;
            const connLimit = userInfo.connLimit;

            const closeSocket = () => {
                const sockets = _.get(this.socketsMap, domain);
                _.remove(sockets, (sock) => sock === socket);
                socket.end();
            };

            // socket 事件处理
            socket.once('close', () => closeSocket());
            socket.once('error', () => closeSocket());

            // 缓存 socket 对象
            const sockets = _.get(this.socketsMap, domain);
            if (!sockets) {
                // 如果该 domain 属于之前未建立的连接
                this.socketsMap[domain] = [socket];
            } else if (sockets.length <= connLimit) {
                // 如果建立的连接数少于限制数目
                this.socketsMap[domain].push(socket);
            } else {
                socket.end();
            }
        });
        this.socksServer.listen(this.socksPort, '0.0.0.0', () => {
            console.log(`SOCKS server listening on prot ${ this.socksPort }`);
        });
    }

    /**
     * 用户信息解码操作
     * @param {String} encodedInfo - 编码后的字符串
     * @return {Object} 解码后的信息
     */
    decodeUserInfo (encodedInfo) {
        let info;
        try {
            info = JSON.parse(encodedInfo);
        } catch (e) {
            info = {};
        }
        return info;
    }
}

module.exports = Server;