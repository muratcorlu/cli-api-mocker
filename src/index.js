#!/usr/bin/env node
var path = require('path');
var express = require('express');
var apiMocker = require('connect-api-mocker');
var bodyParser = require('body-parser')
var proxy = require('http-proxy-middleware');
var cors = require('cors')

var app = express();

var config = {
    port: 9090,
    map: {
        '/': '.'
    }
};

try {
    config = require(path.resolve(process.cwd() , 'mock.config.js'));
    console.log('Config file found mocking!');
} catch (error) {
    // there is no config
}

app.use(cors())

app.use(bodyParser.json())

for(var path in config.map) {
    var conf = config.map[path];

    if (conf.proxy) {
        conf.nextOnNotFound = true;
    }

    app.use(path, apiMocker(conf));
    console.log(`Mocking enabled: ${path} => ${conf}`);

    if (conf.proxy) {
        app.use(path, proxy(conf.proxy));
    }
}

app.listen(config.port, function () {
  console.log(`Mocking server is up on ${config.port}`)
});
