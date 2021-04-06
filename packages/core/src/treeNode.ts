import {
  Action,
  GetState,
  ModelNode,
  Subscribe, SubscribeCtx,
  SubscribeListener
} from "./modelNode";
import { TypeCollection, TypeValidator } from './types'
import {
  isArray,
  isModelTreeNode,
  // isArray,
  // isModelTreeNode,
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
  state: () => S
  env: E
}

export interface ComputedCtx<S = State, E = any> {
  state: () => S
  env: E
}

export interface TreeModelActions<S> {
  [key: string]: (ctx: ActionCtx<S>, ...args: any[]) => any
}

export interface TreeModelComputed<S> {
  [key: string]: (ctx: ComputedCtx<S>) => any
}

export interface TreeNodeEnv {
  [key: string]: any
}

export type Plugin = (
  treeNode: TreeNodeInstance & TreeNodeHelpers<State>
) => void

export type Middleware<S = State> = (ctx: SubscribeCtx<S>) => boolean

export type TreeNodeHelpers<S> = {
  readonly $subscribe: Subscribe<S>
  readonly $env: any
  readonly $getState: GetState<S>
  readonly $dispatch: (action: Action) => any
}

export type TreeNodeSnapshot<S> = {
  [T in keyof S]: S[T]
}

export type TreeNodeInstance<S = State> = TreeNodeSnapshot<TreeNodeHelpers<S>>

export interface TreeNode<S extends State> {
  name: string
  props: TypeCollection
  initializers: any
  pluginsList: Plugin[]
  validator: TypeValidator
  modelNode: ModelNode<S>
  parent?: TreeNode<State>
  clone(parent?: TreeNode<S>): this
  actions(actionsMap: TreeModelActions<S>): TreeNode<S>
  subscribe(listener: SubscribeListener<S>): TreeNode<S>
  computed(gettersMap: TreeModelComputed<S>): TreeNode<S>
  plugins(...plugins: Plugin[]): TreeNode<S>
  middleware(...middlewares: Middleware[]): TreeNode<S>
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
  const selfMiddleware = options.middleware || []
  const props = options.props || {}

  function dispatchMethod(
    modelNode: ModelNode<S>,
    state: State,
    methodName?: string,
    forceReplace?: boolean
  ) {
    const newState = forceReplace
      ? state
      : {
          ...getState(modelNode.getState()),
          ...state
        }
    modelNode.dispatchState({
      type: methodName,
      state: safelyState(newState)
    })
  }

  function plugins(...plugins: Plugin[]) {
    selfPlugins.push(...plugins)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins, middleware: selfMiddleware })
  }

  function middleware(...middlewares: Middleware[]) {
    selfMiddleware.push(...middlewares)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins, middleware: selfMiddleware })
  }

  function actions(actionsMap: TreeModelActions<S>) {
    const actionsInitializers = (modelNode: ModelNode<S>, env: any) => {
      Object.keys(actionsMap).forEach(key => {
        const action = actionsMap[key]
        modelNode.addHiddenProps(key, (...args: any) =>
          action({
              dispatch: (state: State, forceReplace?: boolean) =>
                dispatchMethod(modelNode, state, key, forceReplace),
              state: () => getState(modelNode.getState()),
              env: getState(env)
            },
            ...args
          )
        )
      })
      return modelNode
    }
    initializers.push(actionsInitializers)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins })
  }

  function computed(gettersMap: TreeModelComputed<S>) {
    const computedInitializers = (modelNode: ModelNode<S>, env: State) => {
      Object.keys(gettersMap).forEach(key => {
        const getter = gettersMap[key]
        modelNode.addGetters(key, () =>
          getter({
            state: () => getState(modelNode.getState()),
            env: getState(env)
          })
        )
      })
      return modelNode
    }
    initializers.push(computedInitializers)
    return treeNode<S>(modelNode, { initializers, props, plugins: selfPlugins })
  }

  function subscribe(this: TreeNode<S>, listener: SubscribeListener<S>) {
    modelNode.subscribe(listener)
    return this
  }

  function cloneNode() {
    const newModelNode = modelNode.clone()
    return treeNode(newModelNode, {
      initializers,
      props,
      env: options.env,
      plugins: selfPlugins
    })
  }

  function getState(snapshot: any): S {
    const modelNodeState: any = snapshot
    const newState: any = modelNodeState

    if (isObject(modelNodeState)) {
      Object.keys(modelNodeState).forEach(key => {
        const value = modelNodeState[key]
        if (isTreeNode(value)) {
          newState[key] = value.$getState()
        } else if (isArray(value)) {
          newState[key] = value.map(el => {
            if (isTreeNode(el)) {
              return el.$getState()
            }
            return el
          })
        } else {
          newState[key] = value
        }
      })
    }

    return newState as S
  }

  function defineChildren(modelNode: ModelNode<S>) {
    const snapshot: State = modelNode.getState()

    if (isObject(snapshot)) {
      Object.keys(snapshot).forEach((key: any) => {
        const nodeValue = snapshot[key]

        if (isTreeNode(nodeValue)) {
          nodeValue.$subscribe(() => {
            snapshot.$dispatch({
              type: 'childrenUpdated',
              state: snapshot.$getState()
            })
          })
        } else if (isArray(nodeValue)) {
          nodeValue.forEach(el => {
            if (isTreeNode(el)) {
              el.$subscribe(() => {
                snapshot.$dispatch({
                  type: 'childrenUpdated',
                  state: snapshot.$getState()
                })
              })
            }
          })
        }
      })
    }
  }

  function create(snapshot: State, env?: any) {
    if (isObject(snapshot) && isObject(props)) {
      const newState = Object.keys(props).reduce<any>((result, key) => {
        const value = snapshot[key]
        let propValue = props[key]
        if (propValue.getDeepModel) {
          propValue = propValue.getDeepModel()
        }

        if (isModelTreeNode(propValue) && isObject(value)) {
          result[key] = propValue.clone().create(value, env)
        } else if (isArray(value)) {
          result[key] = value.map((el: any) => {
            if (isModelTreeNode(propValue)) {
              return propValue.clone().create(el, env)
            }
            return el
          })
        } else {
          result[key] = value
        }

        if (isObject(env) && Object.keys(env).includes(key)) {
          env[key] = result[key]
        }
        return result
      }, {})

      initializers.reduce(
        (self: ModelNode<S>, fn: Function) => fn(self, env),
        modelNode
      )

      modelNode.addHiddenProps('$subscribe', modelNode.subscribe)
      modelNode.addHiddenProps('$env', env)
      modelNode.addHiddenProps('$getState', () =>
        getState(modelNode.getState())
      )
      modelNode.addHiddenProps('$dispatch', (action: Action) =>
        dispatchMethod(modelNode, action.state, action.type, true)
      )

      modelNode.dispatchState({
        type: 'createSetState',
        state: newState
      })

      defineChildren(modelNode)

      const modelState = modelNode.getState()
      if (selfPlugins && isArray(selfPlugins)) {
        selfPlugins.forEach((plugin: Plugin) => plugin(modelState as any))
      }

      return modelState as any
    }
  }

  return {
    name: modelNode.name,
    props,
    initializers,
    pluginsList: selfPlugins,
    validator: modelNode.validator,
    modelNode,
    clone: cloneNode,
    actions,
    subscribe,
    computed,
    create,
    plugins,
    middleware
  }
}
