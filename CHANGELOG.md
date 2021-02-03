## 1.1.0 (2021-02-03)

### Feature:

- Ability to use custom config file instead of `mock.config.js` (Thanks to @cantsdmr)

## 1.0.8 (2019-08-06)

### Fix:

- CLI Api mocker is not working without proxy.


## 1.0.4 (2018-02-06)

### Features:

- **Capture Mode**: Now you can automatically generate mock files from your api responses.
- **Verbose Mode**: `--verbose` cli parameter added to use verbose mode of connect-api-mocker.

## 1.0.3 (2018-01-12)

### Features:

- Body parser removed from cli-connect-mocker. Because from v 1.3.5, connect-api-mocker supports parsing json requests internally.

## 1.0.2 (2017-09-08)

### Features:

- Command line parameters added

## 1.0.1 (2017-08-22)

### Fixes:

- Requests with a JSON body doesn't proxying properly #fixed