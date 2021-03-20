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
import mozaikjsVue from '@mozaikjs/vue'

const { types } = core
const rootStore = types
  .model({
    msg: types.string,
    list: types.array(types.string)
  })
  .actions({
    inputText({ dispatch }, text) {
      dispatch({
        msg: text
      })
    },
    addTodo({ dispatch, env }) {
      console.log(env); // { apiV: 2, vueContext }
      dispatch({
        list: [...this.list, this.fullMsg]
      })
    }
  })
  .computed({
    fullMsg() {
      return `Computed prop: ${this.msg}`
    }
  })

/*
* Don`t pass created store
* Its make for add vueContext on env
*/

Vue.use(mozaikjsVue, {
  storeModel: rootStore,
  initialState: {
    msg: '',
    list: []
  },
  env: {
    apiV: 2
  }
})

const vm = new Vue({
  el: '#app'
})
```

### Plugin options

| Type         |
| ------------ |
| storeModel   |
| initialState |
| env          |
