import {
  AnyState,
  GetState,
  ModelActions,
  ModelNode,
  Subscribe,
  TreeNode,
  TreeNodeEnv, TreeNodeSnapshot
} from '../../types'
import { addHiddenProperty } from '../utils/addHiddenProperty'

export function treeNode(modelNode: ModelNode, options: any): TreeNode {
  const initializers = options.initializers || []

  function actions(cb: (modelNode: any) => ModelActions) {
    const actionsInitializers = (modelNode: ModelNode) => {
      const selfProps = {
        getState: modelNode.getState,
        dispatch: (state: any) =>
          modelNode.dispatchState({ type: 'setSelfState', state })
      }
      createActions(modelNode, cb(selfProps))
      return modelNode
    }
    initializers.push(actionsInitializers)
    return treeNode(modelNode, { initializers })
  }

  function createActions(modelNode: ModelNode, actions: ModelActions) {
    let newState = modelNode.getState()

    Object.keys(actions).forEach(key => {
      const action = actions[key]
      modelNode.addSkipTypeKey(key)
      newState = addHiddenProperty(newState, key, action)
    })

    modelNode.dispatchState({ type: 'setActions', state: newState })
  }

  function create<S extends AnyState, E = TreeNodeEnv>(snapshot: S, env: E): TreeNodeSnapshot<S, E> {
    modelNode.dispatchState({
      type: 'createSetState',
      state: snapshot
    })
    initializers.reduce((self: ModelNode, fn: Function) => fn(self), modelNode)

    let state: AnyState = modelNode.getState()
    state = addHiddenProperty<typeof state, '$subscribe', Subscribe>(
      state,
      '$subscribe',
      modelNode.subscribe
    )
    state = addHiddenProperty<
      typeof state,
      '$getState',
      GetState<typeof state>
    >(state, '$getState', modelNode.getState)
    state = addHiddenProperty<typeof state, '$env', any>(
      state,
      '$env',
      env
    )
    return state as TreeNodeSnapshot<S, E>
  }

  return {
    actions,
    create
  }
}
