#!/usr/bin/env node
var path = require('path');
var express = require('express');
var apiMocker = require('connect-api-mocker');
var bodyParser = require('body-parser')
var proxy = require('http-proxy-middleware');
var cors = require('cors');
var commandLineArgs = require('command-line-args');
var defaultPortValue = 9090;
var defaultFromPathValue = '/';
var defaultToPathValue = '';
var optionDefinitions = [
 { name: 'port', alias: 'p', type: Number, defaultValue: defaultPortValue },
 { name: 'fromPath', alias: 'f', type: String, defaultValue: defaultFromPathValue },
 { name: 'toPath', alias: 't', type: String, defaultValue: defaultToPathValue }
];

var options = commandLineArgs(optionDefinitions);

var app = express();

var mapping = {};

mapping[options.fromPath] = options.toPath;

var  defaultConfig = {
    port: options.port,
    map: mapping
};
var config = defaultConfig;

try {
    var loadedConfig = require(path.resolve(process.cwd() , 'mock.config.js'));
    console.log('Config file found mocking!');

    if (config.port === defaultPortValue && loadedConfig.port) {
        config.port = loadedConfig.port;
    }

    var mapKeys = Object.keys(config.map);
    if (loadedConfig.map) {
        mapKeys.forEach(function (mapKey) {
            loadedConfig.map[mapKey] = config.map[mapKey];
        });
        config.map = loadedConfig.map;
    }
} catch (error) {
    // there is no config
}

app.use(cors())

for(var path in config.map) {

    var conf = config.map[path];

    if (conf.proxy) {
        conf.nextOnNotFound = true;
    }

    app.use(path, apiMocker(conf));
    console.log(`Mocking enabled: ${path} => ${conf}`);

    if (conf.proxy) {
        console.log(`Proxy enabled: ${path} => ${conf.proxy}`);
        if (typeof conf.proxy == 'string') {
            config.proxy = {
                target: conf.proxy
            }
        }
        app.use(path, proxy(conf.proxy));
    }
}

app.listen(config.port, function () {
  console.log(`Mocking server is up on ${config.port}`)
});
