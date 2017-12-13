/**
 * 简易服务器，用于测试 http 数据报的转接
 */
'use strict';

const http = require('http');
const server = http.createServer();

server.on('request', (req, res) => {
    res.end(`
        <html>
            <head>
                <meta charset='utf8'>
            </head>
            <body>
                <h1>http to tcp!!!</h1>
            </body>
        </html>
    `);
});

server.listen(3000, () => {
    console.log('web server start ---------');
});