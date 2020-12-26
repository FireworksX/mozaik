import types from './checkers'


const routerModel = types.model('routerModel', {
  path: types.string
})

const rootStore = types.model('rootStore', {
  router: routerModel
}).create({
  router: {
    path: '/'
  }
})

console.log(rootStore);
