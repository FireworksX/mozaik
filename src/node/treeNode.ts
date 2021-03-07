import { addHiddenProperty } from '../utils/addHiddenProperty'
import {
  AnyState,
  ModelActions,
  ModelNode,
  TreeNode,
  TreeNodeInstance
} from '../types'
import { isModelTreeNode, isObject, safelyState } from '../utils'

export function treeNode(modelNode: ModelNode, options: any): TreeNode

export function treeNode(modelNode: ModelNode, options: any): TreeNode {
  const initializers = options.initializers || []
  const props = options.props || {}

  function dispatchMethod(
    modelNode: ModelNode,
    state: any,
    forceReplace: boolean
  ) {
    const newState = forceReplace
      ? state
      : {
          ...getState(modelNode),
          ...state
        }
    // TODO Add pass env for new nodes
    modelNode.dispatchState({
      type: 'setSelfState',
      state: safelyState(newState, props)
    })
  }

  function actions(cb: (modelNode: any) => ModelActions) {
    const actionsInitializers = (modelNode: ModelNode) => {
      const selfProps = {
        getState: () => getState(modelNode),
        dispatch: (state: any, forceReplace: boolean) =>
          dispatchMethod(modelNode, state, forceReplace)
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
      modelNode.addHiddenProps(key, (...args: any) =>
        action.call(getState(modelNode), ...args)
      )
    })
  }

  function getState(model: ModelNode = modelNode) {
    const modelNodeState = model.getState()
    const newState: any = modelNodeState

    if (isObject(modelNodeState)) {
      Object.keys(modelNodeState).forEach(key => {
        const value = modelNodeState[key]

        if (isModelTreeNode(value)) {
          newState[key] = value.$getState()
        } else {
          newState[key] = value
        }
      })
    }

    return newState
  }

  function create<S, E>(snapshot: S, env?: E) {
    const initialState: any = { ...snapshot }
    if (isObject(initialState) && isObject(props)) {
      Object.keys(props).forEach(key => {
        if (isModelTreeNode(props[key]) && initialState[key]) {
          initialState[key] = props[key].create(initialState[key], env)
        }
      })
    }

    modelNode.dispatchState({
      type: 'createSetState',
      state: initialState
    })
    initializers.reduce((self: ModelNode, fn: Function) => fn(self), modelNode)

    let state = modelNode.getState()
    addHiddenProperty(state, '$subscribe', modelNode.subscribe)
    addHiddenProperty(state, '$getState', getState)
    addHiddenProperty(state, '$env', env)
    addHiddenProperty(state, '$replaceState', (newState: AnyState) =>
      dispatchMethod(modelNode, newState, true)
    )

    return state as TreeNodeInstance<S, E>
  }

  return {
    props,
    initializers,
    validator: modelNode.validator,
    actions,
    create
  }
}
