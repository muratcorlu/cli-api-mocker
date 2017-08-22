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

// TOOD: Multipart request support https://github.com/muratcorlu/cli-api-mocker/issues/1
app.use(bodyParser.json())

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
        conf.proxy.onProxyReq = function (proxyReq, req, res, options) {
            if(req.body) {
                // TOOD: Multipart request support https://github.com/muratcorlu/cli-api-mocker/issues/1
                var bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type','application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
        app.use(path, proxy(conf.proxy));
    }
}

app.listen(config.port, function () {
  console.log(`Mocking server is up on ${config.port}`)
});
