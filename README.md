<div align="center">
</div>

# mozaikjs

Core package of MozaikJS state manager.

> MozaikJS is **declarative** and **reactive** state manager, designed for both simple and complex applications.

## Install

```sh
npm i mozaikjs
```

or

```sh
yarn add mozaikjs
```

## Usage

```js
import { types } from 'mozaikjs'

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
  .actions(({ dispatch, getState }) => ({
    push(path) {
      dispatch({
        path,
        history: [...getState().history, path]
      })
    },
    replace(path) {
      const history = getState().history
      history.splice(history.length - 1, 1, path)
      dispatch({
        path,
        history
      })
    }
  }))

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

routerInstance.$subscribe(console.log)
routerInstance.replace('/faq')
// ➜ { history:  ['/', '/faq'], path: '/faq' }

// Also you can use onSnapshot function for detect deep notify
onSnapshot(routerInstance, console.log)
routerInstance.replace('/home')
// ➜ { history:  ['/', '/home'], path: '/home' }
```

### Compose nodes

```js
const { types, compose } = Mozaik

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

### Shape models (modules)

```js
const { types } = Mozaik

const userModel = types.model({ name: types.string })
const routerModel = types
  .model({ path: types.string })
  .actions(() => ({ push() {} }))

const rootModel = types.model({
  router: routerModel,
  user: userModel
})
```
