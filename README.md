# cli-api-mocker

CLI wrapper for [connect-api-mocker](https://github.com/muratcorlu/connect-api-mocker)

## Installation

```sh
npm i -g cli-api-mocker
```

## Usage

After you created your mock files like defined in [connect-api-mocker documents](https://github.com/muratcorlu/connect-api-mocker) you can simply start your mock server with running `mockit` command inside the root folder of your mocks:

```sh
$ mockit
```

That command will start to serve your mocks on port `9090` by default.

## Configuration

You can set your configuration with file `mock.config.js` file in the root of your project directory.

```js
module.exports = {
    port: 9090,
    map: {
        '/api': 'mocks/api'
    }
}
```

Configuration above will create a mocking server on running port `9090` and serve an api that defined with files in the mocks/api folder with a base url of '/api'. So after running your `mockit` command in the same folder with that configuration, if you make a request to `http://localhost:9090/api/users`, api mocker will respond request with file(if exists) in `mocks/api/users/GET.json`.

### Using a proxy

If you also want to use a proxy for requests that you didn't have a mock file, you can define your mock config like that:

```js
module.exports = {
    port: 9090,
    map: {
        '/api': {
            target: 'mocks/api',
            proxy: 'https://api.yourdomain.com'
        }
    }
}
```

Proxy definition object is a [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) options object. So you can take advantage of all options of http-proxy-middleware library here. Here a more detailed proxy definition example:

```js
module.exports = {
    port: 9090,
    map: {
        '/api': {
            target: 'mocks/api',
            proxy: {
                target: 'https://api.yourdomain.com',
                pathRewrite: {
                    '^/api': ''
                },
                changeOrigin: true,
                secure: false
            }
        }
    }
}
```

