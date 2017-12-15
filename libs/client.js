/**
 * 内网穿透客户端
 *
 * @author wujohns
 * @date 17/12/11
 */
'use strict';

const _ = require('lodash');
const socks = require('socksv5');
const net = require('net');
const EventEmitter = require('events').EventEmitter;

class Client extends EventEmitter {
    /**
     * 构造函数
     *
     * @param {Object} config - Client 配置
     * @param {Object} config.connMap - 连接配置
     * @param {Number} config.socksHost - sockv5 地址
     * @param {Number} config.socksPort - sockv5 服务端口
     * @param {Number} config.localHttpPort - 本地 http 服务端口
     * @param {Number} config.connLimit - 连接数限制
     */
    constructor (config) {
        super();
        this.connMap = config.connMap;
        this.socksHost = config.socksHost;
        this.socksPort = config.socksPort;
        this.localHttpHost = config.localHttpHost || '127.0.0.1';
        this.localHttpPort = config.localHttpPort;
        this.connLimit = config.connLimit;

        this.clientsMap = {};
        this.initSocksClient();
        console.log('bbt-client start');
    }

    /**
     * socksv5 客户端启动
     */
    initSocksClient () {
        // 创建指定 socket 连接
        _.forEach(this.connMap, (value, domain) => {
            this.clientsMap[domain] = [];
            for(let i = 0; i < this.connLimit; i++) {
                const client = this.createClient(domain);
                this.clientsMap[domain].push(client);
            }
        });

        // 对 socket 关闭的处理（移除老的，创建新的）
        this.on('close', (domain, dropClient) => {
            _.remove(this.clientsMap[domain], (client) => client === dropClient);
            
            const newClient = this.createClient(domain);
            this.clientsMap[domain].push(newClient);
        });
    }

    /**
     * 创建 client
     */
    createClient (domain) {
        const userInfo = JSON.stringify({
            domain: domain,
            connLimit: this.connLimit
        });
        const password = _.get(this.connMap, domain);
        const socksAuth = socks.auth.UserPassword(userInfo, password);
        const client = socks.connect({
            port: 80,   // 该参数属于 sockv5 依赖的参数，在这里不发挥作用
            proxyHost: this.socksHost,
            proxyPort: this.socksPort,
            auths: [socksAuth]
        });

        client.once('close', () => {
            this.emit('close', domain, client);
        });

        client.once('error', (err) => {
            const errCode = err.code;
            if (
                errCode === 'ECONNREFUSED' ||
                errCode === 'ECONNRESET'
            ) {
                // 连接失败则延时重启该 client
                console.log('socksv5 服务连接失败');
                setTimeout(() => {
                    this.emit('close', domain, client);
                }, 3000);
            } else {
                // 其他错误则直接重启该 client
                this.emit('close', domain, client);
            }
        });

        client.on('connect', (socket) => {
            const local = net.connect({
                host: this.localHttpHost,
                port: this.localHttpPort
            });

            local.on('connect', () => {
                socket.pipe(local).pipe(socket);
            });
            local.on('error', (err) => {
                const errCode = err.code;
                if (
                    errCode === 'ECONNREFUSED' ||
                    errCode === 'ECONNRESET'
                ) {
                    console.log('请确保本地的 http 服务已经启动!!!');
                    process.exit(1);
                } else {
                    this.emit('close', domain, client);
                }
            });

            socket.on('end', () => {
                this.emit('close', domain, client);
            });
        });

        return client;
    }
}

module.exports = Client;