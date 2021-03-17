<div align="center">
</div>

# @mozaikjs/logger

Plugin for mozaikjs logging.


## Install

```sh
npm i @mozaikjs/logger
```

or

```sh
yarn add @mozaikjs/logger
```

## Usage

```js
import loggerPlugin from '@mozaikjs/logger'

const user = types
  .model('userStore', {
    name: types.string
  })
  .actions({
    setName({ dispatch }, name) {
      dispatch({
        name
      })
    }
  })
  .plugins(loggerPlugin())
  .create({
    name: 'arthur'
  })
```
