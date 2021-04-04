<div align="center">
</div>

# @mozaikjs/vue

Vue plugin for work with mozaikjs

## Install

```sh
npm i @mozaikjs/react
```

or

```sh
yarn add @mozaikjs/react
```

## Usage

index.js

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

App.jsx

```jsx
import { useStore } from './mozaik-react'

function App() {
  const store = useStore()
  return (
    <div className="App">
      <h1>Store name: {store.name}</h1>
      <button onClick={() => store.setName('arthur')}>set name</button>
    </div>
  )
}

export default App
```
