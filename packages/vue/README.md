<div align="center">
</div>

# @mozaikjs/vue

Vue plugin for work with mozaikjs

## Install

```sh
npm i @mozaikjs/vue
```

or

```sh
yarn add @mozaikjs/vue
```

## Usage

### Template

```html
<div id="app">
  <h1>{{ $mozaik.fullMsg }}</h1>
  <ul>
    <li v-for="todo in $mozaik.list">{{ todo }}</li>
  </ul>
  <input
    :value="$mozaik.msg"
    @input="({ target: { value } }) => $mozaik.inputText(value)"
  />
  <button @click="$mozaik.addTodo">add todo</button>
</div>
```

### Scripts
```js
import { types } from '@mozaikjs/core'

const { types } = core
const rootStore = types
  .model({
    msg: types.string,
    list: types.array(types.string)
  })
  .actions(({ dispatch }) => ({
    inputText(text) {
      dispatch({
        msg: text
      })
    },
    addTodo() {
      dispatch({
        list: [...this.list, this.fullMsg]
      })
    }
  }))
  .computed(() => ({
    fullMsg() {
      return `Computed prop: ${this.msg}`
    }
  }))
  .create({
    msg: '',
    list: []
  })

Vue.use(mozaikjsVue, { store: rootStore })

const vm = new Vue({
  el: '#app'
})
```
