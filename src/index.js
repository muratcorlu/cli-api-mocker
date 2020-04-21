#!/usr/bin/env node
var path = require('path');
var express = require('express');
var apiMocker = require('connect-api-mocker');
var proxy = require('http-proxy-middleware');
var cors = require('cors');
var fs = require('fs');
var pth = require('path');
var mkdirp = require('mkdirp');
var defaultPortValue = 9090;
var defaultFromPathValue = '/';
var defaultToPathValue = '';

var program = require('commander');
var package = require('../package.json');

program
  .description('mockit is a tool for creating a mocks for a REST API.')
  .version(package.version)
  .option('-p, --port <port>', 'Port number to serve mocks', parseInt, defaultPortValue)
  .option('-f, --from-path <path>', 'Target url path for mocking', defaultFromPathValue)
  .option('-t, --to-path <path>', 'Target folder path for mocks', defaultToPathValue)
  .option('-c, --capture', 'Enable capture mode')
  .option('-v, --verbose', 'Enable verbose mode')
  .option('-d, --disable-mocks', 'Temporary disable mocks to just use proxy')
  .parse(process.argv);

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var app = express();

var mapping = {};

mapping[program.fromPath] = {
  target: program.toPath
};

var defaultConfig = {
  port: program.port,
  map: mapping
};
var config = defaultConfig;

try {
  var loadedConfig = require(path.resolve(process.cwd(), 'mock.config.js'));
  console.log('Config file found mocking!');

  config.map = {};

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

if (program.verbose) {
  Object.keys(config.map).forEach(function (key) {
    config.map[key].verbose = true;
  });
}

var corsOptionsDelegate = function (req, callback) {
  var corsOptions = { 
    origin: true, 
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  callback(null, corsOptions);
};

/*By default "cors()" set the Access-Control-Allow-Origin to "*" which Chrome will reject when the request was made with "credentials" flag enabled. It throws error something like:
A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true. */

app.use(cors(corsOptionsDelegate));

//app.use(cors());

for (var path in config.map) {
  (function (basePath) {
    var conf = config.map[basePath];

    if (conf.proxy) {
      conf.nextOnNotFound = true;
    }

    if (!conf.disableMocks && !program.disableMocks) {
      app.use(basePath, apiMocker(conf));
      console.log(`Mocking enabled: ${basePath} => ${conf.target || conf}`);
    }

    if (conf.proxy) {
      console.log(`Proxy enabled: ${basePath} => ${conf.proxy}`);
      if (typeof conf.proxy == 'string') {
        conf.proxy = {
          target: conf.proxy
        }
      }

      if (conf.capture || program.capture) {
        console.log('Capture Mode enabled for mocks!');

        conf.proxy.onProxyRes = function (proxyRes, req, res) {
          var body = "";
          if (proxyRes.statusCode < 404) {
            proxyRes.on('data', function (data) {
              data = data.toString('utf-8');
              body += data;
            });

            proxyRes.on('end', function () {
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
      if (conf.capture || program.capture) {
        console.error('You can not use capture mode without defining a proxy.');
      }
      if (conf.disableMocks || program.disableMocks) {
        console.error('You can not disable mocks without defining a proxy.');
      }
    }
  })(path);
}

app.listen(config.port, function () {
  console.log(`Mocking server is up on ${config.port}`)
});
