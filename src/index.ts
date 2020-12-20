import { types } from './types/types'
import { model } from './types/modelType'
import { getEnv } from './utils/getEnv'

const rootStore = model('rootStore', {
  count: types.number
})
  .actions(({ getState, dispatch }) => ({
    add() {
      const oldState = getState()
      const env = getEnv(rootStore)
      console.log(env)
      dispatch({ ...oldState, count: oldState.count + 1 })
    },
    remove() {
      const oldState = getState()
      dispatch({ ...oldState, count: oldState.count - 1 })
    }
  }))
  .create({ count: 0 }, { test: 1 })

rootStore.$subscribe(({ count }) => {
  document.querySelector('.value').innerHTML = count
})

document.querySelector('.add').addEventListener('click', rootStore.add)
document.querySelector('.remove').addEventListener('click', rootStore.remove)
