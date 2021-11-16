import {
  Action,
  GetState,
  ModelNode,
  Subscribe,
  SubscribeListener
} from './modelNode'
import {
  ConvertPropsToState,
  ConvertModelToState,
  ModelType,
  TypeCollection,
  TypeValidator
} from './types'
import { isArray, isObject, buildState, defineReactive } from './shared'

export type State = Record<string, any>
export type EnvDefault = State | undefined

export interface DispatchMethod<T extends State> {
  (state: Partial<T>, forceReplace?: boolean): void
}

export interface ActionCtx<I = Instance<any, any>, E = any> {
  dispatch: DispatchMethod<I>
  state: () => I
  env: E
}

export interface ComputedCtx<I, E = any> {
  state: () => I
  env: E
}

export type ActionMethod<PROPS extends TypeCollection, OTHERS> = (
  ctx: ActionCtx<Instance<PROPS, OTHERS>>,
  ...args: any[]
) => any

export type TreeModelActions<
  PROPS extends TypeCollection,
  OTHERS,
  ACTIONS extends State
> = {
  [K in keyof ACTIONS]: ActionMethod<PROPS, OTHERS>
}

type ActionsToMethods<T> = {
  [P in keyof T]: T[P] extends (ctx: ActionCtx, ...args: infer ARGS) => infer R
    ? (...args: ARGS) => R
    : T[P]
}

export type TreeModelComputed<
  PROPS extends TypeCollection,
  OTHERS,
  COMPUTED extends State
> = {
  [K in keyof COMPUTED]: (ctx: ComputedCtx<Instance<PROPS, OTHERS>>) => any
}

type ComputedToGetters<T> = {
  [P in keyof T]: T[P] extends (ctx: ComputedCtx<any>) => infer R ? R : T[P]
}

export interface TreeNodeEnv {
  [key: string]: any
}

export type Plugin<PROPS extends TypeCollection, OTHERS, ENV = EnvDefault> = (
  treeNode: Instance<PROPS, OTHERS> & TreeNodeHelpers<PROPS, OTHERS, ENV>
) => void

export type TreeNodeHelpers<
  PROPS extends TypeCollection,
  OTHERS,
  ENV extends EnvDefault
> = {
  readonly $subscribe: Subscribe<Instance<PROPS, OTHERS, ENV>>
  readonly $env: ENV
  readonly $getState: GetState<Instance<PROPS, OTHERS, ENV>>
  readonly $dispatch: (action: Action<ConvertPropsToState<PROPS>>) => any
}

export type TreeNodeSnapshot<S> = {
  [T in keyof S]: S[T]
}

export type Instance<
  PROPS extends TypeCollection,
  OTHERS,
  ENV = EnvDefault
> = OTHERS &
  TreeNodeSnapshot<ConvertModelToState<PROPS>> &
  TreeNodeHelpers<PROPS, OTHERS, ENV>

export interface ErrorCtx<I> {
  name: string
  methodName: string
  error: Error
  store: I
}

export type CatchHandler<I> = (ctx: ErrorCtx<I>) => void

export interface TreeNode<PROPS extends TypeCollection, OTHERS> {
  name: string
  props: PROPS
  initializers: any
  pluginsList: Plugin<PROPS, OTHERS>[]
  validator: TypeValidator
  modelNode: ModelNode<PROPS>
  parent?: ModelType<State, State>
  clone(parent?: ModelType<PROPS, OTHERS>): this

  actions<ACTIONS extends TreeModelActions<PROPS, OTHERS, ACTIONS>>(
    actionsMap: ACTIONS
  ): ModelType<PROPS, OTHERS & ActionsToMethods<ACTIONS>>
  computed<COMPUTED extends TreeModelComputed<PROPS, OTHERS, COMPUTED>>(
    gettersMap: COMPUTED
  ): ModelType<PROPS, OTHERS & ComputedToGetters<COMPUTED>>

  plugins(...plugins: Plugin<PROPS, OTHERS>[]): ModelType<PROPS, OTHERS>
  subscribe(
    listener: SubscribeListener<ConvertPropsToState<PROPS>>
  ): ModelType<PROPS, OTHERS>
  compose(): ModelType<PROPS, OTHERS>
  catch(
    catchHandler: CatchHandler<Instance<PROPS, OTHERS>>
  ): ModelType<PROPS, OTHERS>
  create<ENV extends EnvDefault>(
    snapshot: ConvertPropsToState<PROPS>,
    env?: ENV
  ): Instance<PROPS, OTHERS, ENV>
}

type TreeNodeOptions<PROPS> = {
  props: PROPS
  initializers?: any[]
  plugins?: any[]
  catchHandler?: any
  env?: any
}

export function treeNode<PROPS extends TypeCollection, OTHERS>(
  modelNode: ModelNode<PROPS, OTHERS>,
  options: TreeNodeOptions<PROPS>
): TreeNode<PROPS, OTHERS> {
  const initializers = options.initializers || []
  const selfPlugins = options.plugins || []
  const props = options.props || {}
  const catchHandler: CatchHandler<Instance<PROPS, OTHERS>> | undefined =
    options.catchHandler

  function dispatchMethod(
    modelNode: ModelNode<PROPS>,
    state: Partial<ConvertPropsToState<PROPS>>,
    methodName?: string,
    forceReplace?: boolean,
    env?: any
  ) {
    const oldState = buildState(modelNode.getState())
    const newState = forceReplace
      ? state
      : {
          ...oldState,
          ...state
        }

    const newSafeState = defineReactive(props, newState, env, updateChildren)

    modelNode.dispatchState({
      type: methodName,
      state: newSafeState
    })
  }

  function plugins(...plugins: Plugin<PROPS, OTHERS>[]) {
    selfPlugins.push(...plugins)
    return treeNode(modelNode, {
      initializers,
      props,
      plugins: selfPlugins
    })
  }

  function actions<ACTIONS extends TreeModelActions<PROPS, OTHERS, State>>(
    actionsMap: ACTIONS
  ) {
    const actionsInitializers = (
      modelNode: ModelNode<PROPS>,
      env: any,
      catchHandler: CatchHandler<Instance<PROPS, OTHERS & ACTIONS>>
    ) => {
      Object.keys(actionsMap).forEach(key => {
        const newKey = key as any
        const action = actionsMap[newKey]
        modelNode.addHiddenProps(key, (...args: any) => {
          const proxyState = () =>
            buildState<Instance<PROPS, OTHERS & ACTIONS>>(modelNode.getState())
          try {
            return action(
              {
                dispatch: (
                  state: Partial<ConvertPropsToState<PROPS>>,
                  forceReplace?: boolean
                ) => dispatchMethod(modelNode, state, key, forceReplace, env),
                state: proxyState,
                env: buildState(env)
              },
              ...args
            )
          } catch (e) {
            if (!catchHandler) throw e

            catchHandler({
              name: modelNode.name,
              error: e,
              store: buildState<Instance<PROPS, OTHERS & ACTIONS>>(
                modelNode.getState()
              ),
              methodName: key
            })
          }
        })
      })
      return modelNode
    }

    initializers.push(actionsInitializers)
    return treeNode(
      modelNode as ModelNode<PROPS, OTHERS & ActionsToMethods<ACTIONS>>,
      {
        initializers,
        props,
        plugins: selfPlugins,
        catchHandler
      }
    )
  }

  function computed<COMPUTED extends TreeModelComputed<PROPS, OTHERS, State>>(
    gettersMap: COMPUTED
  ) {
    const computedInitializers = (modelNode: ModelNode<PROPS>, env: State) => {
      Object.keys(gettersMap).forEach(key => {
        const newKey = key as any
        const getter = gettersMap[newKey]
        modelNode.addGetters(key, () =>
          getter({
            state: () => buildState(modelNode.getState()),
            env: buildState(env)
          })
        )
      })
      return modelNode
    }

    initializers.push(computedInitializers)
    return treeNode<PROPS, OTHERS & ComputedToGetters<COMPUTED>>(
      modelNode as ModelNode<PROPS, OTHERS & ComputedToGetters<COMPUTED>>,
      {
        initializers,
        props,
        plugins: selfPlugins,
        catchHandler
      }
    )
  }

  function subscribe(
    this: TreeNode<PROPS, OTHERS>,
    listener: SubscribeListener<ConvertPropsToState<PROPS>>
  ) {
    modelNode.subscribe(listener)
    return this
  }

  function catchError(
    catchHandler: (ctx: ErrorCtx<Instance<PROPS, OTHERS>>) => void
  ) {
    return treeNode(modelNode, {
      initializers,
      props,
      plugins: selfPlugins,
      catchHandler
    })
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

  function updateChildren() {
    modelNode.dispatchState({
      type: 'childrenUpdated',
      state: buildState(modelNode.getState())
    })
  }

  function compose(this: TreeNode<PROPS, OTHERS>) {
    return this //composeNodes<TreeNode<PROPS, OTHERS>, T>(this, node)
  }

  function create<ENV extends EnvDefault>(
    snapshot: ConvertPropsToState<PROPS>,
    env?: ENV
  ): Instance<PROPS, OTHERS, ENV> {
    if (isObject(snapshot) && isObject(props)) {
      const newState = defineReactive(props, snapshot, env, updateChildren)

      initializers.reduce(
        (self: ModelNode<PROPS>, fn: Function) => fn(self, env, catchHandler),
        modelNode
      )

      modelNode.addHiddenProps('$subscribe', modelNode.subscribe)
      modelNode.addGetters('$env', (): ENV => buildState(env))
      modelNode.addHiddenProps('$getState', () =>
        buildState(modelNode.getState())
      )
      modelNode.addHiddenProps(
        '$dispatch',
        (action: Action<ConvertPropsToState<PROPS>>) =>
          dispatchMethod(modelNode, action.state, action.type, true, env)
      )

      modelNode.dispatchState({
        type: 'createSetState',
        state: newState
      })

      const modelState = modelNode.getState()
      if (selfPlugins && isArray(selfPlugins)) {
        selfPlugins.forEach((plugin: Plugin<PROPS, OTHERS>) =>
          plugin(modelState as any)
        )
      }

      return modelState as Instance<PROPS, OTHERS, ENV>
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
