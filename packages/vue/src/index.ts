import { onSnapshot } from '@mozaikjs/core'
import { TreeNodeInstance } from "@mozaikjs/core/build/treeNode";

function install(Vue: any, { store }: { store: TreeNodeInstance }) {
  const proxyState = store.$getState()
  const innerVue = new Vue({ data: proxyState })

  onSnapshot(store, (newState: any) => {
    Object.keys(proxyState).forEach(key => {
      proxyState[key] = newState[key]
    })
  })

  Vue.prototype.$mozaik = innerVue.$data
}

export default { install }
