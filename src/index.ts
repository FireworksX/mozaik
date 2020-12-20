import types from './checkers'
import compose from './utils/compose'

const loadingModel = types
  .model('LoadingModel', {
    isLoading: types.boolean
  })
  .actions(({ getState, dispatch }) => ({
    setLoading(value: any) {
      const state = getState()
      dispatch({ ...state, isLoading: value })
    }
  }))

const userModel = compose(
  loadingModel,
  types
    .model('UserModel', {
      name: types.string
    })
    .actions(({ getState, dispatch }) => ({
      fetchUser(login: string) {
        const state = getState()
        state.setLoading(true)

        setTimeout(() => {
          state.setLoading(false)
          dispatch({ ...state, name: `Artur Admin (${login})` })
        }, 1000)
      }
    }))
).create({ name: 'artur', isLoading: false }, {})

userModel.$subscribe(({ isLoading, name }) => {
  console.log(isLoading ? 'Loading...' : `Load finished: ${name}`)
})

userModel.fetchUser('admin')
