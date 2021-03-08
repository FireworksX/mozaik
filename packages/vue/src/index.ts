import { TreeNodeInstance } from '../../core/src/types'
// @ts-ignore
import { onSnapshot } from '@mozaikjs/core'

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

export { install }
