import { addHiddenProperty } from '../utils/addHiddenProperty'
import {
  AnyState,
  ModelActions,
  ModelNode,
  TreeNode,
  TreeNodeEnv,
  TreeNodeSnapshot
} from '../types'
import { isObject } from '../utils'
export function treeNode(modelNode: ModelNode, options: any): TreeNode {
  const initializers = options.initializers || []
  const props = options.props || {}

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
    return treeNode(modelNode, { initializers, props })
  }

  function createActions(modelNode: ModelNode, actions: ModelActions) {
    let newState = modelNode.getState()

    Object.keys(actions).forEach(key => {
      const action = actions[key]
      addHiddenProperty(newState, key, action)
    })

    modelNode.dispatchState({ type: 'setActions', state: newState })
  }

  function getState() {
    const modelNodeState = modelNode.getState()
    const newState: any = {}

    if (isObject(modelNodeState)) {
      Object.keys(modelNodeState).forEach(key => {
        const value = modelNodeState[key]
        if (value.hasOwnProperty('$getState')) {
          newState[key] = value.$getState()
        } else {
          newState[key] = value
        }
      })

      return newState
    }
  }

  function create<S extends AnyState, E = TreeNodeEnv>(
    snapshot: S,
    env?: E
  ): TreeNodeSnapshot<S, E> {
    modelNode.dispatchState({
      type: 'createSetState',
      state: snapshot
    })
    initializers.reduce((self: ModelNode, fn: Function) => fn(self), modelNode)

    let state: AnyState = modelNode.getState()
    addHiddenProperty(state, '$subscribe', modelNode.subscribe)
    addHiddenProperty(state, '$getState', getState)
    addHiddenProperty(state, '$env', env)
    return state as TreeNodeSnapshot<S, E>
  }

  return {
    props,
    initializers,
    validator: modelNode.validator,
    actions,
    create
  }
}
