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
        history: [...state().history, path]
      })
    },
    replace({ dispatch, state }, path) {
      const history = state().history
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

### Get actual state

> Mozaikjs use immutable state

For get actual state you get call `$getState()` on store instance.
Inside `actions and computed` you can take `state()` method for get actual state.

```js
import { types } from '@mozaikjs/core'

const root = types
  .model({
    status: types.string
  })
  .actions({
    async load({ dispatch, state }) {
      dispatch({ status: 'pending' })
      console.log(state().status) // ➜ 'pending'
      setTimeout(() => {
        dispatch({ status: 'done' })
        Promise.resolve()
      })
    }
  })
  .create({
    status: 'default'
  })

await root.load()
console.log(root.status) // ➜ 'default'  State don`t mutable
console.log(root.$getState().status) // ➜ 'done'  State updated
```

### Runtime check types

> Mozaikjs like Mobx State Tree check state when you change

| Type                             | Example                                             | Description                                               |
| -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| **Primitives**                   |
| string                           | types.string                                        |                                                           |
| number                           | types.number                                        |                                                           |
| boolean                          | types.boolean                                       |                                                           |
| Date                             | types.date                                          | Check is Date instance                                    |
| **Complex type**                 |                                                     |                                                           |
| maybe (Deprecated, use optional) | types.maybe(types.string)                           | Value can be empty (null or undefined)                    |
| optional                         | types.optional(types.string, defaultValue?: string) | Value can be empty (null or undefined) with default value |
| array                            | types.array(types.number)                           | Array of values                                           |
| enumeration                      | types.enumeration('admin', 'moderator')             | Value can be one of enums                                 |
| custom                           | types.custom((value) => value > 10)                 | You can write custom validator                            |
| model                            | types.model(name, props)                            |                                                           |

### Subscribe & notify

You have two ways to subscribe on notify.

- chain method before create instances
- method `$subscribe` on created instances

```js
const commentModel = types
  .model('comment', {
    isLiked: types.boolean
  })
  .actions({
    toggleLike({ dispatch, state }) {
      dispatch({
        isLiked: !state().isLiked
      })
    }
  })

const fetcher = types
  .model({
    comments: types.array(commentModel)
  })
  .subscribe(console.log) // call after change state
  .create({
    comments: [
      {
        isLiked: false
      }
    ]
  })

fetcher.$subscribe(console.log)
fetcher.comments[0].$subscribe(console.log)

fetcher.comments[0].toggleLike() // Do toggle inner state
```

### Compose nodes

```js
import { types } from '@mozaikjs/core'

const resetModel = types.model({}).actions({
  reset({ dispatch, state }) {
    const newState = Object.keys(state()).reduce((acc, key) => {
      acc[key] = null
      return acc
    }, {})
    dispatch(newState)
    return newState
  }
})

const userNode = types
  .model({
    name: types.maybe(types.string),
    age: types.maybe(types.number)
  })
  .compose(resetModel)
  .create({
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
    setName({ dispatch }, name) {
      dispatch({
        name
      })
    }
  })
  .computed({
    fullName({ state }) {
      return `${state().name} ${state().lastName}!`
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
const routerModel = types.model({ path: types.string }).actions({ push() {} })

const rootModel = types.model({
  router: routerModel,
  user: userModel
})
```

### Catch errors

You can catch errors in actions. Use `.catch` chain method.

When error be catch you pass error context.

_context_

```js
{
  name: string
  methodName: string
  error: Error
  store: {
  }
}
```

```js
import { types } from '@mozaikjs/core'

const root = types
  .model({
    status: types.string
  })
  .actions({
    fetch() {
      throw new Error('test error')
    }
  })
  .catch(console.log)
  .create({
    status: 'done'
  })

root.fetch()
```

### Dependency Injection

```js
import { types } from '@mozaikjs/core'

const routerStore = types
  .model('router', {
    path: types.string
  })
  .create({
    path: '/'
  })

const fetcherModel = types
  .model({
    isLoading: types.boolean
  })
  .actions({
    fetch({ env }, path) {
      console.log(env) // ➜ { httpClient: {}, localStorage, routerStore }
      console.log(path) // ➜ /users
    }
  })
  .create(
    {
      isLoading: false
    },
    {
      routerStore, // You can pass other model and they be computed
      httpClient: {},
      localStorage: localStorage
    }
  )

console.log(fetcherModel.fetch('/users'))
```

### Middlewares (Deprecated)

Use middleware you can control each dispatch state.
Middleware chain call everytime when you call action.
**If middleware don't return value, state don`t change.**

TODO:

- Add async
- Pass store instance

```js
const toUpperCase = state => {
  return Object.keys(state).reduce((res, key) => {
    res[key] = state[key].toUpperCase()
    return res
  }, {})
}

const user = types
  .model({
    name: types.string
  })
  .actions({
    fetchUser({ dispatch }) {
      dispatch({ name: 'admin' })
    }
  })
  .use(toUpperCase)
  .use('fetchUser', toUpperCase) // Add middleware on specific action
  .create({
    name: ''
  })

user.fetchUser()
user.$getState() // ➜ { name: 'ADMIN' }
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

---

### TODO

1. Add `.named()` method for model
2. Make `treeWalker` for develop plugins
3. Add new features for work with names
4. Pass inside computed function only state without actions
5. Add type for lazy load modules of tree
6. Add hooks for adapters of React + Vue
   1. Data hooks useAction + useValue
   2. Network hooks useQuery + useMutation
7. Make ability to parse default props to types `.model('', { prop: 10 })`
8. Add great support for plugins
   1. Ability to append custom methods and getters
   2. Possibility integrate to model by chain methods
9. Create few plugins
   1. Cache manager
   2. Redo/Undo
   3. Persist
   4. Logger
   5. Connector to Redux dev tools
10. Add new Examples
11. Make site
