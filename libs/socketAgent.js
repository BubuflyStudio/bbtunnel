/**
 * http 的 socket 绑定实现
 *
 * @author wujohns
 * @date 17/12/11
 */
'use strict';

const Agent = require('http').Agent;

/**
 * 在nodejs中使用 http.request 方法创建http请求的时候同时也会自动的创建一个用于传输该http数据的
 * 通道，会放在其agent字段中的socket属性中（属于私有方法，无法在外部修改），所以这里采用创建新的
 * agent对象的方式方便将已有的socket通道应用到agent中，使得http数据报的传输走我们指定的socket
 */
class SocketAgent extends Agent {
    constructor (options) {
        options = options || {};
        super(options);

        this.socket = options.socket;
    }

    createConnection (port, host, options) {
        return this.socket;
    }
}

module.exports = SocketAgent;