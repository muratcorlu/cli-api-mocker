#!/usr/bin/env node
var path = require('path');
var express = require('express');
var apiMocker = require('connect-api-mocker');
var bodyParser = require('body-parser')
var proxy = require('http-proxy-middleware');
var cors = require('cors');
var fs = require('fs');
var pth = require('path');
var mkdirp = require('mkdirp');
var commandLineArgs = require('command-line-args');
var defaultPortValue = 9090;
var defaultFromPathValue = '/';
var defaultToPathValue = '';
var optionDefinitions = [
 { name: 'port', alias: 'p', type: Number, defaultValue: defaultPortValue },
 { name: 'fromPath', alias: 'f', type: String, defaultValue: defaultFromPathValue },
 { name: 'toPath', alias: 't', type: String, defaultValue: defaultToPathValue },
 { name: 'capture', alias: 'c', type: Boolean, defaultValue: false },
 { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false }
];

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var options = commandLineArgs(optionDefinitions);

var app = express();

var mapping = {};

mapping[options.fromPath] = {
  target: options.toPath
};

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

if (options.verbose) {
  Object.keys(config.map).forEach(function (key) {
    config.map[key].verbose = true;
  });
}

app.use(cors());

for(var path in config.map) {
  (function (basePath) {
    var conf = config.map[basePath];

    if (conf.proxy) {
      conf.nextOnNotFound = true;
    }

    app.use(basePath, apiMocker(conf));
    console.log(`Mocking enabled: ${basePath} => ${conf.target || conf}`);

    if (conf.proxy) {
      console.log(`Proxy enabled: ${basePath} => ${conf.proxy}`);
      if (typeof conf.proxy == 'string') {
        conf.proxy = {
          target: conf.proxy
        }
      }

      if (conf.capture || options.capture) {
        console.log('Capture Mode enabled for mocks!');

        conf.proxy.onProxyRes = function(proxyRes, req, res) {
          var body = "";
          if (proxyRes.statusCode < 404) {
            proxyRes.on('data', function(data) {
              data = data.toString('utf-8');
              body += data;
            });

            proxyRes.on('end', function() {
              var requestedFilePath = req.path.replace(new RegExp('^(\/)?' + escapeRegExp(basePath)), '')
              var targetPath = pth.join(conf.target || conf, requestedFilePath);

              var contentType = 'json';
              if (proxyRes.headers['content-type'].indexOf('xml') > -1) {
                contentType = 'xml';
              }

              mkdirp.sync(targetPath);

              var targetFile = pth.join(targetPath, req.method + '.' + contentType);

              if (!fs.existsSync(targetFile)) {
                fs.writeFileSync(targetFile, body);
                console.log('[Capture Mode] New mock file saved to ' + targetFile);
              }
            });
          }
        }
      }

      app.use(basePath, proxy(conf.proxy));
    } else {
      if (conf.capture || options.capture) {
        console.error('You can not use capture mode without defining a proxy.');
      }
    }
  })(path);
}

app.listen(config.port, function () {
  console.log(`Mocking server is up on ${config.port}`)
});
