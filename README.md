<div align="center">

![Mozaik](https://user-images.githubusercontent.com/22668125/111180071-ba8c4480-85bd-11eb-801d-fc0f07e85ca6.png)
<br/>
<br/>
[![npm](https://img.shields.io/npm/v/@mozaikjs/core?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/core)
![npm type definitions](https://img.shields.io/npm/types/@mozaikjs/core?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/core?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/core)

<br/>
<br/>
</div>

# Mozaikjs

- 🐣 **simple abstraction** and friendly DX: minimum boilerplate and tiny API
- ⚡ **performance**: performant updates for partial state changes
- 🗜 **small size**: [2 KB](https://bundlephobia.com/result?p=@mozaikjs/core) gzipped
- 📦 **modular**: reusable instances (SSR)
- 🔌 **framework-agnostic**: independent and self-sufficient
- 🧪 **testing**: simple mocking
- 🛠 **debugging**: immutable data, logger
- 🔮 **deterministic**: declarative and predictable specification of state shape and its mutations
- 👴 **ES5 support**
- 🧯 **reliable**: predictable flow exceptions
- easy to write good code

> MozaikJS is **declarative** and **reactive** state manager, designed for both simple and complex applications.

## Install

```sh
npm i @mozaikjs/core
```

or

```sh
yarn add @mozaikjs/core
```

## Usage

```js
import { types } from '@mozaikjs/core'

/*
 * types.model ➜ actions() ➜ create()
 */

/**
 * Step 1.
 * Declare node (like reducers or models)
 */
const router = types
  .model({
    history: types.array(types.string),
    path: types.string
  })
  .actions({
    push({ dispatch, state }, path) {
      dispatch({
        path,
        history: [...state, path]
      })
    },
    replace({ dispatch, state }, path) {
      const history = state.history
      history.splice(history.length - 1, 1, path)
      dispatch({
        path,
        history
      })
    }
  })

/**
 * Step 2.
 * Create instace & set default values
 */
const routerInstance = router.create({
  history: ['/'],
  path: '/'
})

/**
 * Step 3.
 * Call action
 */
routerInstance.push('/about')

/**
 * Step 5.
 * Get action results
 */
console.log(routerInstance.$getState())
// ➜ { history: ['/', '/about'], path: '/about' }

/**
 * Subscribe on notify
 */

routerInstance.$subscribe(({ state }) => console.log(state))
routerInstance.replace('/faq')
// ➜ { history:  ['/', '/faq'], path: '/faq' }

// Also you can use onSnapshot function for detect deep notify
onSnapshot(routerInstance, console.log)
routerInstance.replace('/home')
// ➜ { history:  ['/', '/home'], path: '/home' }
```

### Compose nodes

```js
import { types, compose } from '@mozaikjs/core'

const resetModel = types
  .model({
    isLoading: types.boolean
  })
  .actions(({ dispatch, getState }) => ({
    reset() {
      const newState = Object.keys(getState()).reduce((acc, key) => {
        acc[key] = null
        return acc
      }, {})
      dispatch(newState)
      return newState
    }
  }))

const userNode = compose(
  resetModel,
  types.model({
    name: types.maybe(types.string),
    age: types.maybe(types.number)
  })
).create({
  name: 'Arthur',
  age: 24
})

console.log(userNode.$getState()) // ➜ { name: 'Arthur', age: 24 }
userNode.reset()
console.log(userNode.$getState()) // ➜ { name: null, age: null }
```

### Computed props

```js
import { types } from '@mozaikjs/core'

const user = types
  .model({
    name: types.string,
    lastName: types.string
  })
  .actions({
    setName({ dispatch, state }, name) {
      dispatch({
        name
      })
    }
  })
  .computed({
    fullName({ state }) {
      return `${state.name} ${state.lastName}!`
    }
  })
  .create({
    name: 'Arthur',
    lastName: 'Test'
  })

console.log(user.$getState().fullName) // ➜ Arthur Test!
```

### Shape models (modules)

```js
import { types } from '@mozaikjs/core'

const userModel = types.model({ name: types.string })
const routerModel = types
  .model({ path: types.string })
  .actions(() => ({ push() {} }))

const rootModel = types.model({
  router: routerModel,
  user: userModel
})
```

### Dependency Injection

```js
import { types } from '@mozaikjs/core'

const fetcherModel = types
  .model({
    isLoading: types.boolean
  })
  .actions({
    fetch({ env }, path) {
      console.log(env) // ➜ { httpClient: {}, localStorage }
      console.log(path) // ➜ /users
    }
  })
  .create(
    {
      isLoading: false
    },
    {
      httpClient: {},
      localStorage: localStorage
    }
  )

console.log(fetcherModel.fetch('/users'))
```

### Plugins

```js
const myPlugin = store => {
  // call after create store
  store.$subscribe(ctx => {
    // call after every mutation
    // ctx = { state: any, oldState: any, name: string, methodName: string }
  })
}
```

```js
import { types } from '@mozaikjs/core'

const model = types
  .model({})
  .plugins(myPlugin) // Add plugins
  .create({})
```

## Packages

| Package                                                                              | Version                                                                                                                   | Size                                                                                                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@mozaikjs/core`](https://github.com/FireworksX/mozaik/tree/main/packages/core)     | [![npm](https://img.shields.io/npm/v/@mozaikjs/core?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/core)     | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/core?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/core)     |
| [`@mozaikjs/vue`](https://github.com/FireworksX/mozaik/tree/main/packages/vue)       | [![npm](https://img.shields.io/npm/v/@mozaikjs/vue?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/vue)       | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/vue?style=flat-square)](https://bundlephobia.com/result?p=@mozaiks/vue)        |
| [`@mozaikjs/logger`](https://github.com/FireworksX/mozaik/tree/main/packages/logger) | [![npm](https://img.shields.io/npm/v/@mozaikjs/logger?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/logger) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/logger?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/logger) |
