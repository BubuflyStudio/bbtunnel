'use strict';
/**
 * package.json 的预编译文件，用于其无法注释的问题
 * @data 2016/7/18
 *
 * author wujohns
 */
const packageConfig = {
    // 基础配置说明
    name: 'bbtunnel',
    version: '0.0.1',
    description: 'exposes your localhost to the world',
    homepage: 'https://github.com/BubuflyStudio/bbtunnel',
    license: 'MIT',

    /**
     * 代码库
     */
    repository: {
        type: 'git',
        url: 'https://github.com/BubuflyStudio/bbtunnel.git'
    },
    bugs: { url: 'https://github.com/BubuflyStudio/bbtunnel/issues' },
    
    /**
     * 全局命令
     */
    bin: {
        'bbt-server': './bin/server.js',
        'bbt-client': './bin/client.js'
    },

    /**
     * 关键字
     */
    keywords: ['bbtunnel', 'tunnel', 'socksv5', 'bb', 'socket'],

    dependencies: {
        'lodash': '^4.17.4',
        'liftoff': '^2.3.0',
        'minimist': '^1.2.0',
        'socksv5': 'https://github.com/wujohns/socksv5.git'
    }
};

const fs = require('fs');
const ws = fs.createWriteStream('./package.json', {
    encoding: 'utf8',
    flags: 'w',
    mode: '666'
});
ws.end(JSON.stringify(packageConfig, null, 2));