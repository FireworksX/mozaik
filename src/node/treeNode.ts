import { addHiddenProperty } from '../utils/addHiddenProperty'
import {
  ModelActions,
  ModelNode,
  TreeNode,
  TreeNodeHelpers,
} from '../types'
import { isObject } from '../utils'
export function treeNode(modelNode: ModelNode, options: any): TreeNode {
  const initializers = options.initializers || []
  const props = options.props || {}

  function actions(cb: (modelNode: any) => ModelActions) {
    const actionsInitializers = (modelNode: ModelNode) => {
      const selfProps = {
        getState,
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
    Object.keys(actions).forEach(key => {
      const action = actions[key]
      modelNode.addHiddenProps(key, action)
    })
  }

  function getState() {
    const modelNodeState = modelNode.getState()
    const newState: any = modelNodeState

    if (isObject(modelNodeState)) {
      Object.keys(modelNodeState).forEach(key => {
        const value = modelNodeState[key]
        if (value.hasOwnProperty('$getState')) {
          newState[key] = value.$getState()
        } else {
          newState[key] = value
        }
      })
    }
    return newState
  }

  function create<S, E>(snapshot: S, env?: E): S & TreeNodeHelpers<S, E> {
    modelNode.dispatchState({
      type: 'createSetState',
      state: snapshot
    })
    initializers.reduce((self: ModelNode, fn: Function) => fn(self), modelNode)

    let state: S = modelNode.getState() as S
    addHiddenProperty(state, '$subscribe', modelNode.subscribe)
    addHiddenProperty(state, '$getState', getState)
    addHiddenProperty(state, '$env', env)
    return state as S & TreeNodeHelpers<S, E>
  }

  return {
    props,
    initializers,
    validator: modelNode.validator,
    actions,
    create
  }
}
