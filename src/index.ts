import types from './checkers'

const routerStoreModel = types
  .model('routerStoreModel', {
    path: types.string,
    history: types.array(types.string)
  })
  .actions(({ dispatch, getState }) => ({
    push(path: string) {
      const state = getState()
      dispatch({
        ...state,
        path: path,
        history: [...state.history, path]
      })
    }
  }))

const routerStore = routerStoreModel.create(
  { path: '/home', history: [] },
  {
    routerV: 1
  }
)


const rootStoreModel = types.model('rootStore', {
  router: routerStoreModel
})

const rootStore = rootStoreModel.create(
  {
    router: routerStore
  }
)


rootStore.router.$subscribe(state => {

  document.querySelector('.path').innerHTML = `Current path: ${state.path}`

  document.querySelector('.list').innerHTML = state.history
    .map(path => `<li>${path}</li>`)
    .join('')
})

document.querySelectorAll('a').forEach(el => {
  const href = el.getAttribute('href')
  el.addEventListener('click', e => {
    e.preventDefault()
    rootStore.router.push(href)
  })
})
