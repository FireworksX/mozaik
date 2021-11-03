<div align="center">

![Mozaik](https://user-images.githubusercontent.com/22668125/113721052-db951080-96f7-11eb-8198-1fdfba9b3e41.png)
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
- ⚡ **types**: deep type definitions
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

## Packages

| Package                                                                                      | Version                                                                                                                   | Docs                                                                                                      | Size                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@mozaikjs/core`](https://github.com/FireworksX/mozaik/tree/main/packages/core/#readme)     | [![npm](https://img.shields.io/npm/v/@mozaikjs/core?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/core)     | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/core)   | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/core?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/core)     |
| [`@mozaikjs/react`](https://github.com/FireworksX/mozaik/tree/main/packages/react/#readme)   | [![npm](https://img.shields.io/npm/v/@mozaikjs/react?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/react)   | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/react)  | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/react?style=flat-square)](https://bundlephobia.com/result?p=@mozaiks/react)    |
| [`@mozaikjs/vue`](https://github.com/FireworksX/mozaik/tree/main/packages/vue/#readme)       | [![npm](https://img.shields.io/npm/v/@mozaikjs/vue?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/vue)       | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/vue)    | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/vue?style=flat-square)](https://bundlephobia.com/result?p=@mozaiks/vue)        |
| [`@mozaikjs/logger`](https://github.com/FireworksX/mozaik/tree/main/packages/logger/#readme) | [![npm](https://img.shields.io/npm/v/@mozaikjs/logger?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/logger) | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/logger) | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mozaikjs/logger?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/logger) |

## Examples

- [Counter](/example/counter) 

## Base usage

### Install

```sh
npm i @mozaikjs/core @mozaikjs/react
```

or

```sh
yarn add @mozaikjs/core @mozaikjs/react
```

### Usage

**index.js**

```jsx
import ReactDOM from 'react-dom'
import { StoreProvider } from '@mozaikjs/react'
import { types } from '@mozaikjs/core'

const rootStore = types
  .model('rootStore', {
    name: types.string
  })
  .actions({
    setName({ dispatch }, name) {
      dispatch({
        name
      })
    }
  })
  .create({
    name: 'test'
  })

ReactDOM.render(
  <React.StrictMode>
    <StoreProvider store={rootStore}>
      <App />
    </StoreProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
```

**App.jsx**

```jsx
import { useStore } from '@mozaikjs/react'

const App = () => {
  const store = useStore()

  return <h1>{store.name}</h1>
}
```
