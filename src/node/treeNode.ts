import { addHiddenProperty } from '../utils/addHiddenProperty'
import {
  AnyState,
  ModelActions,
  ModelNode,
  TreeNode,
  TreeNodeHelpers
} from '../types'
import { isObject } from '../utils'
export function treeNode(modelNode: ModelNode, options: any): TreeNode {
  const initializers = options.initializers || []
  const props = options.props || {}

  function actions(cb: (modelNode: any) => ModelActions) {
    const actionsInitializers = (modelNode: ModelNode) => {
      const selfProps = {
        getState: () => getState(modelNode),
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

  function views(cb: (modelNode: any) => ModelActions) {
    const viewsInitializers = (modelNode: ModelNode) => {
      const selfProps = {
        getState: () => getState(modelNode),
      }
      createViews(modelNode, cb(selfProps))
      return modelNode
    }
    initializers.push(viewsInitializers)
    return treeNode(modelNode, { initializers, props })
  }

  function createViews(modelNode: ModelNode, views: ModelActions) {
    Object.keys(views).forEach(key => {
      const action = views[key]
      modelNode.addHiddenProps(key, action)
    })

    modelNode.addHiddenProps('computedViews', Object.keys(views))

    modelNode.subscribe((state) => {
      Object.keys(views).forEach((key) => {
        // state[key](state)
      })
    })
  }

  function getState(model: ModelNode = modelNode) {
    const modelNodeState = model.getState()
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

  function create<S, E>(snapshot: S, env?: E) {
    modelNode.dispatchState({
      type: 'createSetState',
      state: snapshot
    })
    initializers.reduce((self: ModelNode, fn: Function) => fn(self), modelNode)

    let state = modelNode.getState()
    addHiddenProperty(state, '$subscribe', modelNode.subscribe)
    addHiddenProperty(state, '$getState', getState)
    addHiddenProperty(state, '$env', env)
    return state as S & TreeNodeHelpers<S, E> & AnyState
  }

  return {
    props,
    initializers,
    validator: modelNode.validator,
    actions,
    views,
    create
  }
}
