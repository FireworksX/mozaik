import { Action, GetState, ModelNode, Subscribe } from './modelNode'
import { TypeCollection, TypeValidator } from './types'
import {
  addHiddenProperty,
  isArray,
  isModelTreeNode,
  isObject,
  isTreeNode,
  safelyState
} from './shared'

export type State = Record<string, any>

export interface DispatchMethod {
  (state: State, forceReplace?: boolean): void
}

export interface ActionCtx<S = State, E = any> {
  dispatch: DispatchMethod
  state: S
  env: E
}

export interface ComputedCtx<S = State, E = any> {
  state: S
  env: E
}

export interface TreeModelActions<S> {
  [key: string]: (this: S, ctx: ActionCtx<S>, ...args: any[]) => any
}

export interface TreeModelComputed<S> {
  [key: string]: (this: S, ctx: ComputedCtx<S>) => any
}

export interface TreeNodeEnv {
  [key: string]: any
}

export type Plugin = (treeNode: TreeNodeInstance) => void

export type TreeNodeHelpers<S> = {
  readonly $subscribe: Subscribe<S>
  readonly $env: any
  readonly $getState: GetState<S>
  readonly $replaceState: (newState: State) => void
  readonly $dispatch: (action: Action) => any
}

export type TreeNodeSnapshot<S> = {
  [T in keyof S]: S[T]
}

export type TreeNodeInstance<S = State> = TreeNodeSnapshot<TreeNodeHelpers<S>>

export interface TreeNode<S extends State> {
  props: TypeCollection
  initializers: any
  pluginsList: Plugin[]
  validator: TypeValidator
  actions(actionsMap: TreeModelActions<S>): TreeNode<S>
  computed(gettersMap: TreeModelComputed<S>): TreeNode<S>
  plugins(...plugins: Plugin[]): TreeNode<S>
  create(snapshot: S, env?: any): TreeNodeInstance<S>
}

export function treeNode<S = State>(
  modelNode: ModelNode<S>,
  options: any
): TreeNode<S>

export function treeNode<S = State>(
  modelNode: ModelNode<S>,
  options: any
): TreeNode<S> {
  const initializers = options.initializers || []
  const selfPlugins = options.plugins || []
  const props = options.props || {}

  function dispatchMethod(
    modelNode: ModelNode<S>,
    state: State,
    methodName?: string,
    forceReplace?: boolean,
    env?: any
  ) {
    const newState = forceReplace
      ? state
      : {
          ...getState(modelNode),
          ...state
        }

    modelNode.dispatchState({
      type: methodName,
      state: safelyState(newState, props, env)
    })
  }

  function plugins(...plugins: Plugin[]) {
    selfPlugins.push(...plugins)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins })
  }

  function actions(actionsMap: TreeModelActions<S>) {
    const actionsInitializers = (modelNode: ModelNode<S>, env: any) => {
      createActions(modelNode, actionsMap, env)
      return modelNode
    }
    initializers.push(actionsInitializers)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins })
  }

  function createActions(
    modelNode: ModelNode<S>,
    actions: TreeModelActions<S>,
    env: any
  ) {
    Object.keys(actions).forEach(key => {
      const action = actions[key]
      modelNode.addHiddenProps(key, (...args: any) =>
        action.call(
          getState(modelNode),
          {
            dispatch: (state: State, forceReplace?: boolean) =>
              dispatchMethod(modelNode, state, key, forceReplace),
            state: getState(modelNode),
            env
          },
          ...args
        )
      )
    })
  }

  function computed(gettersMap: TreeModelComputed<S>) {
    const computedInitializers = (modelNode: ModelNode<S>, env: any) => {
      createComputed(modelNode, gettersMap, env)
      return modelNode
    }
    initializers.push(computedInitializers)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins })
  }

  function createComputed(
    modelNode: ModelNode<S>,
    actions: TreeModelComputed<S>,
    env: any
  ) {
    Object.keys(actions).forEach(key => {
      const action = actions[key]
      modelNode.addGetters(key, () =>
        action.call(getState(modelNode), {
          state: getState(modelNode),
          env
        })
      )
    })
  }

  function getState(model: ModelNode<S> = modelNode): S {
    const modelNodeState: any = model.getState()
    const newState: any = modelNodeState

    if (isObject(modelNodeState)) {
      Object.keys(modelNodeState).forEach(key => {
        const value = modelNodeState[key]

        if (isTreeNode(value)) {
          newState[key] = value.$getState()
        } else {
          newState[key] = value
        }
      })
    }

    return newState
  }

  function create(snapshot: S, env?: any) {
    if (env && !options.env) {
      return treeNode(modelNode, {
        initializers,
        props,
        env,
        plugins: selfPlugins
      }).create(snapshot, env)
    }

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
    initializers.reduce(
      (self: ModelNode<S>, fn: Function) => fn(self, options.env),
      modelNode
    )

    let state = modelNode.getState() as S & TreeNodeHelpers<S>
    addHiddenProperty(state, '$subscribe', modelNode.subscribe)
    addHiddenProperty(state, '$dispatch', (action: Action) =>
      dispatchMethod(modelNode, action.state, action.type, true)
    )
    addHiddenProperty(state, '$getState', getState)
    addHiddenProperty(state, '$env', env)
    addHiddenProperty(state, '$replaceState', (newState: S) =>
      dispatchMethod(modelNode, newState, 'replaceState', true)
    )

    if (selfPlugins && isArray(selfPlugins)) {
      selfPlugins.forEach((plugin: Plugin) => plugin(state))
    }

    return state
  }

  return {
    props,
    initializers,
    pluginsList: selfPlugins,
    validator: modelNode.validator,
    actions,
    computed,
    create,
    plugins
  }
}
