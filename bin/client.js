#!/usr/bin/env node

/**
 * 内网穿透客户端（命令行模式）
 *
 * @author wujohns
 * @date 17/12/11
 */
'use strict';

const _ = require('lodash');
const Liftoff = require('liftoff');
const argv = require('minimist')(process.argv.slice(2));

const Client = require('../libs/client');

// 命令配置
const cli = new Liftoff({
    name: 'bbt-server',
    moduleName: null,
    configName: 'bbt_config',
    extensions: { '.js': null }
});

// 启动命令
cli.launch({
    configPath: argv.f  // 自定义配置文件路径
}, (env) => {
    const configPath = env.configPath;
    let config = {};
    if (configPath) {
        config = require(configPath);
    }

    config = _.defaults({}, config, {
        connMap: {},
        socksPort: 8000,
        localHttpPort: 3000,
        connLimit: 20
    });
    new Client(config);
});