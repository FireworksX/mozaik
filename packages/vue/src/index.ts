import { onSnapshot } from '@mozaikjs/core'
import {
  State,
  TreeNode,
  TreeNodeSnapshot
} from '@mozaikjs/core/build/treeNode'

function install(
  Vue: any,
  {
    storeModel,
    initialState,
    env
  }: {
    storeModel: TreeNode<State>
    initialState: TreeNodeSnapshot<State>
    env: any
  }
) {
  const __SIDE_EFFECT_ENV: any = {
    vueContext: undefined,
    ...env
  }

  const createdStore: any = storeModel.create(initialState, __SIDE_EFFECT_ENV)

  const innerVue = new Vue({
    data: {
      $$state: createdStore
    }
  })

  onSnapshot(createdStore, state => {
    Object.keys(state).forEach(key => {
      innerVue.$data.$$state[key] = state[key]
    })
  })

  Vue.mixin({
    beforeCreate() {
      __SIDE_EFFECT_ENV.vueContext = this
    }
  })

  Vue.prototype.$mozaik = innerVue.$data.$$state
}

export default { install }
