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
  const innerVue = new Vue({
    data: {
      $$state: initialState
    }
  })

  Vue.mixin({
    beforeCreate() {
      const createdStore = storeModel.create(initialState, {
        vueContext: this,
        ...env
      })

      const proxyState: State = createdStore.$getState()

      onSnapshot(createdStore, (newState: any) => {
        Object.keys(newState).forEach(key => {
          proxyState[key] = newState[key]
        })
      })

      innerVue.$data.$$state = proxyState
      this.$mozaik = proxyState
    }
  })

  Vue.prototype.$mozaik = innerVue.$data.$$state
}

export default { install }
