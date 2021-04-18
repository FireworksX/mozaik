import React from 'react'
import ReactDOM from 'react-dom'
import { types } from '@mozaikjs/core'
import { StoreProvider } from '@mozaikjs/react'
import App from './App'

const counter = types
  .model({
    count: types.number
  })
  .actions({
    increment({ state, dispatch }) {
      dispatch({
        count: state().count + 1
      })
    },
    decrement({ state, dispatch }) {
      dispatch({
        count: state().count - 1
      })
    }
  })
  .create({
    count: 0
  })

ReactDOM.render(
  <React.StrictMode>
    <StoreProvider store={counter}>
      <App />
    </StoreProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
