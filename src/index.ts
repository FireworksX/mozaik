import types from './checkers'

const routerModel = types
  .model('routerModel', {
    path: types.string
  })
  .actions(() => ({
    push(path: string) {
      console.log(`push new path: ${path}`)
    }
  }))

const rootStore = types
  .model('rootStore', {
    router: routerModel
  })
  .create({
    router: {
      path: '/'
    }
  }, {
    apiVersion: 2
  })

console.log(rootStore)
