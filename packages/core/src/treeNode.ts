import {
  Action,
  GetState,
  ModelNode,
  Subscribe,
  SubscribeListener
} from './modelNode'
import { TypeCollection, TypeValidator } from './types'
import {
  isArray,
  isModelTreeNode,
  compose as composeNodes,
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
  state: () => TreeNodeInstance<S>
  env: E
}

export interface ComputedCtx<S = State, E = any> {
  state: () => TreeNodeInstance<S>
  env: E
}

export type TreeModelActions<S, A = State> = {
  [K in keyof A]: (ctx: ActionCtx<S>, ...args: any[]) => any
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

export type TreeNodeHelpers<S> = {
  readonly $subscribe: Subscribe<S>
  readonly $env: any
  readonly $getState: GetState<S>
  readonly $dispatch: (action: Action) => any
}

export type TreeNodeSnapshot<S> = {
  [T in keyof S]: S[T]
}

export type TreeNodeInstance<S = State, A = State> = A & TreeNodeSnapshot<S> & TreeNodeHelpers<S>

export interface ErrorCtx<S> {
  name: string
  methodName: string
  error: Error
  store: TreeNodeInstance<S>
}

export type CatchHandler<S> = (ctx: ErrorCtx<S>) => void

export interface TreeNode<S extends State, A = State> {
  name: string
  props: TypeCollection
  initializers: any
  pluginsList: Plugin[]
  validator: TypeValidator
  modelNode: ModelNode<S>
  parent?: TreeNode<State>
  clone(parent?: TreeNode<S, A>): this
  actions(actionsMap: TreeModelActions<S, A>): TreeNode<S, A>
  subscribe(listener: SubscribeListener<S>): TreeNode<S, A>
  computed(gettersMap: TreeModelComputed<S>): TreeNode<S, A>
  plugins(...plugins: Plugin[]): TreeNode<S, A>
  compose(...nodes: TreeNode<S, A>[]): TreeNode<S, A>
  catch(catchHandler: CatchHandler<S>): TreeNode<S, A>
  create(snapshot: S, env?: any): TreeNodeInstance<S, A>
}

export function treeNode<S = State, A = State>(
  modelNode: ModelNode<S>,
  options: any
): TreeNode<S, A>

export function treeNode<S = State, A = State>(
  modelNode: ModelNode<S>,
  options: any
): TreeNode<S, A> {
  const initializers = options.initializers || []
  const selfPlugins = options.plugins || []
  const props = options.props || {}
  const catchHandler: CatchHandler<S> | undefined = options.catchHandler

  function dispatchMethod(
    modelNode: ModelNode<S>,
    state: State,
    methodName?: string,
    forceReplace?: boolean
  ) {
    const oldState = getState(modelNode.getState())
    const newState = forceReplace
      ? state
      : {
          ...oldState,
          ...state
        }

    const newSafeState = safelyState(newState)

    modelNode.dispatchState({
      type: methodName,
      state: newSafeState
    })
  }

  function plugins(...plugins: Plugin[]) {
    selfPlugins.push(...plugins)
    return treeNode<S, A>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins
    })
  }

  function actions(actionsMap: TreeModelActions<S, A>) {
    const actionsInitializers = (
      modelNode: ModelNode<S>,
      env: any,
      catchHandler: CatchHandler<S>
    ) => {
      Object.keys(actionsMap).forEach(key => {
        const newKey = key as keyof A
        const action = actionsMap[newKey]
        modelNode.addHiddenProps(key, (...args: any) => {
          const proxyState = () => getState(modelNode.getState())
          try {
            action(
              {
                dispatch: (state: State, forceReplace?: boolean) =>
                  dispatchMethod(modelNode, state, key, forceReplace),
                state: proxyState,
                env: getState(env)
              },
              ...args
            )
          } catch (e) {
            if (!catchHandler) throw e

            catchHandler({
              name: modelNode.name,
              error: e,
              store: getState(modelNode.getState()),
              methodName: key
            })
          }
        })
      })
      return modelNode
    }
    initializers.push(actionsInitializers)
    return treeNode<S, A>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
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
    return treeNode<S, A>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
  }

  function subscribe(this: TreeNode<S, A>, listener: SubscribeListener<S>) {
    modelNode.subscribe(listener)
    return this
  }

  function catchError(catchHandler: (ctx: ErrorCtx<S>) => void) {
    return treeNode<S, A>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
  }

  function cloneNode() {
    const newModelNode = modelNode.clone()
    return treeNode<S, A>(newModelNode, {
      initializers,
      props,
      env: options.env,
      plugins: selfPlugins
    })
  }

  function getState(snapshot: any): TreeNodeInstance<S> {
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

    return newState as TreeNodeInstance<S>
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

  function compose(this: TreeNode<S, A>, ...nodes: TreeNode<State>[]) {
    return composeNodes<S, A>(this, ...nodes)
  }

  function create(snapshot: State, env?: any): TreeNodeInstance<S, A> {
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
        (self: ModelNode<S>, fn: Function) => fn(self, env, catchHandler),
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

      return modelState as TreeNodeInstance<S, A>
    }
    throw new Error('Initial state cannot be empty')
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
    compose,
    catch: catchError
  }
}
