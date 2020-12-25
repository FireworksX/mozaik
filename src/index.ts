import types from './checkers'
import compose from './utils/compose'

const loadUser = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve({
      name: 'Artur',
      role: 'admin'
    })
  }, 2000)
})

const loadingModel = types
  .model('LoadingModel', {
    loadingState: types.string
  })
  .actions(({ dispatch, getState }) => ({
    setLoadingState(state: string) {
      const oldState = getState()
      dispatch({ ...oldState, loadingState: state })
    },

    async awaitPromise(promise: Promise<any>) {
      const state = getState()
      state.setLoadingState('pending')

      try {
        const response = await promise
        state.setLoadingState('done')

        return response
      } catch (e) {
        state.setLoadingState('error')
        return {
          isError: true,
          error: e
        }
      }
    }
  }))

const userStore = compose(
  loadingModel,
  types
    .model('userStore', {
      name: types.maybe(types.string)
    })
    .actions(({ dispatch, getState }) => ({
      async loadUser() {
        const state = getState()
        const data = await state.awaitPromise(loadUser)

        if (data.isError) {
          console.error(data.error)
          return
        }

        dispatch({ ...state, name: data.name })
      }
    }))
).create({
  name: '',
  loadingState: 'done'
})

userStore.$subscribe(({ loadingState }) => {
  console.log(loadingState)
})

console.log(userStore.loadUser())
