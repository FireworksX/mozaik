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
  composeNodes,
  isObject,
  isTreeNode,
  safelyState
} from './shared'

export type State = Record<string, any>

export interface DispatchMethod {
  (state: State, forceReplace?: boolean): void
}

export interface ActionCtx<I, E = any> {
  dispatch: DispatchMethod
  state: () => I
  env: E
}

export interface ComputedCtx<I, E = any> {
  state: () => I
  env: E
}

export type TreeModelActions<S, A = State, C = State> = {
  [K in keyof A]: (ctx: ActionCtx<Instance<S, A, C>>, ...args: any[]) => any
}

export type TreeModelComputed<S, C = State, A = State> = {
  [K in keyof C]: (ctx: ComputedCtx<Instance<S, A, C>>) => any
}

export interface TreeNodeEnv {
  [key: string]: any
}

export type Plugin = (treeNode: Instance & TreeNodeHelpers<State, State, State>) => void

export type TreeNodeHelpers<S, A, C> = {
  readonly $subscribe: Subscribe<Instance<S, A, C>>
  readonly $env: any
  readonly $getState: GetState<Instance<S, A, C>>
  readonly $dispatch: (action: Action) => any
}

export type TreeNodeSnapshot<S> = {
  [T in keyof S]: S[T]
}

export type Instance<S = State, A = State, C = State> = A &
  C &
  TreeNodeSnapshot<S> &
  TreeNodeHelpers<S, A, C>

export interface ErrorCtx<I> {
  name: string
  methodName: string
  error: Error
  store: I
}

export type CatchHandler<I> = (ctx: ErrorCtx<I>) => void

export interface TreeNode<S extends State, A = State, C = State> {
  name: string
  props: TypeCollection
  initializers: any
  pluginsList: Plugin[]
  validator: TypeValidator
  modelNode: ModelNode<S>
  parent?: TreeNode<State>
  clone(parent?: TreeNode<S, A>): this
  actions(actionsMap: TreeModelActions<S, A, C>): TreeNode<S, A, C>
  subscribe(listener: SubscribeListener<S>): TreeNode<S, A, C>
  computed(gettersMap: TreeModelComputed<S, C, A>): TreeNode<S, A, C>
  plugins(...plugins: Plugin[]): TreeNode<S, A, C>
  compose(...nodes: TreeNode<S, A, C>[]): TreeNode<S, A, C>
  catch(catchHandler: CatchHandler<Instance<S, A, C>>): TreeNode<S, A, C>
  create(snapshot: S, env?: any): Instance<S, A, C>
}

export function treeNode<S = State, A = State, C = State>(
  modelNode: ModelNode<S>,
  options: any
): TreeNode<S, A, C>

export function treeNode<S = State, A = State, C = State>(
  modelNode: ModelNode<S>,
  options: any
): TreeNode<S, A, C> {
  const initializers = options.initializers || []
  const selfPlugins = options.plugins || []
  const props = options.props || {}
  const catchHandler: CatchHandler<Instance<S, A, C>> | undefined =
    options.catchHandler

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
    return treeNode<S, A, C>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins
    })
  }

  function actions(actionsMap: TreeModelActions<S, A, C>) {
    const actionsInitializers = (
      modelNode: ModelNode<S>,
      env: any,
      catchHandler: CatchHandler<Instance<S, A, C>>
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
    return treeNode<S, A, C>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
  }

  function computed(gettersMap: TreeModelComputed<S, C, A>) {
    const computedInitializers = (modelNode: ModelNode<S>, env: State) => {
      Object.keys(gettersMap).forEach(key => {
        const newKey = key as keyof C
        const getter = gettersMap[newKey]
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
    return treeNode<S, A, C>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
  }

  function subscribe(this: TreeNode<S, A, C>, listener: SubscribeListener<S>) {
    modelNode.subscribe(listener)
    return this
  }

  function catchError(catchHandler: (ctx: ErrorCtx<Instance<S, A, C>>) => void) {
    return treeNode<S, A, C>(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
  }

  function cloneNode() {
    const newModelNode = modelNode.clone()
    return treeNode<S, A, C>(newModelNode, {
      initializers,
      props,
      env: options.env,
      plugins: selfPlugins
    })
  }

  function getState(snapshot: any): Instance<S, A, C> {
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

    return newState as Instance<S, A, C>
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

  function compose(this: TreeNode<S, A, C>, ...nodes: TreeNode<S, A, C>[]) {
    return composeNodes<S, A, C>(this, ...nodes)
  }

  function create(snapshot: State, env?: any): Instance<S, A, C> {
    if (isObject(snapshot) && isObject(props)) {
      const newState = Object.keys(props).reduce<any>((result, key) => {
        const value = snapshot[key]
        let propValue = props[key]
        if (propValue.getDeepModel) {
          propValue = propValue.getDeepModel()
        }

        // TODO remove check prop type if prop is model dont create instance
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

      return modelState as Instance<S, A, C>
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
