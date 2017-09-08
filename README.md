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

## Arguments

`mockit` command has 3 available arguments. 

    [-p | --port]     with default value `9090`, 
    [-f | --fromPath] with default value `/`,
    [-t | --toPath]   with default value ``

These arguments are optional. You can use `mockit` command with any one of them or any combination of them.

You can see usage examples below:

`mockit --port=8989` or  `mockit -p 8989` for running on port `8989` instead of default port `9090`
`mockit --fromPath=/api` or  `mockit -f '/api'` for running listening paths from `/api` instead from default path ``
`mockit --toPath=/mapi` or  `mockit -t '/mapi'` for forwarding to path `/api` instead of forwarding to default path `/`

Or you can combine any of them like:

`mockit --port=8989 --fromPath=/api --toPath=/mapi` 

Or 

`mockit -p 8989 -f '/api -t '/mapi'`

**Note:** In next title you will notice config file. If there is a config file, config file will be active. But command line arguments are stronger. So if you use both of them together, command line arguments will override config file.

## Configuration with a config file

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

