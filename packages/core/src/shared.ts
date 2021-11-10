import { State, treeNode } from './treeNode'
import { ConvertPropsToState, ModelType, TypeCollection } from './types'
import { modelNode } from './modelNode'

export const isPrimitive = (value: any) =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null
export const isArray = Array.isArray
export const isObject = (value: any) => !isPrimitive(value) && !isArray(value)
export const isEmpty = (value: any) => !isPrimitive(value) && !isArray(value)

export const isModelTreeNode = (value: any) =>
  isObject(value) && value.hasOwnProperty('create')
export const isTreeNode = (value: any) =>
  isObject(value) && value.hasOwnProperty('$subscribe')

export const defineReactive = <PROPS extends TypeCollection, OTHERS>(
  props: PROPS,
  snapshot: Partial<ConvertPropsToState<PROPS>>,
  env: any,
  updateChildren: any
) => {
  return Object.keys(props).reduce<any>((result, key) => {
    const value = snapshot[key]
    let propValue = props[key]
    if (typeof propValue !== 'function' && propValue.getDeepModel) {
      propValue = propValue.getDeepModel()
    }

    if (
      isModelTreeNode(propValue) &&
      isObject(value) &&
      typeof propValue !== 'function' &&
      value
    ) {
      const instanceValue = (propValue as ModelType<PROPS, OTHERS>)
        .clone()
        .create(value as any, env)
      instanceValue.$subscribe(updateChildren)
      result[key] = instanceValue
    } else if (isArray(value)) {
      result[key] = value.map((el: any) => {
        if (isModelTreeNode(propValue)) {
          const instanceValue = (propValue as ModelType<PROPS, OTHERS>)
            .clone()
            .create(el, env)
          instanceValue.$subscribe(updateChildren)
          return instanceValue
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
}

export function composeNodes<
  L extends ModelType<any, any>,
  R extends ModelType<any, any>
>(parent: L, child: R): any {
  if (!parent && !child) {
    throw new Error('Compose function cannot be empty')
  }

  const nodes: ModelType<any>[] = [parent, child].filter(
    el => Boolean(el) && isModelTreeNode(el)
  )
  const composeName = nodes.map(({ name }) => name).join('/')

  const resultData = nodes.reduce<any>(
    (acc, el) => {
      acc.props = { ...acc.props, ...el.props }
      acc.pluginsList = [...acc.pluginsList, ...el.pluginsList]
      acc.initializers = [...acc.initializers, ...el.initializers]
      return acc
    },
    { props: {}, pluginsList: [], initializers: [] }
  )

  const modelNodeIns = modelNode(`(${composeName})`, resultData.props)
  return treeNode(modelNodeIns, resultData)
}

export function addHiddenProperty<S extends State, P extends PropertyKey, V>(
  object: S,
  prop: P,
  value: V
): void

export function addHiddenProperty<S extends State, P extends PropertyKey, V>(
  object: S,
  prop: P,
  value: V
): void {
  Object.defineProperty(object, prop, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: value
  })
}

export function addGetterProperty<V>(
  object: State,
  prop: PropertyKey,
  value: () => V
): void

export function addGetterProperty<V>(
  object: State,
  prop: PropertyKey,
  value: () => V
): void {
  Object.defineProperty(object, prop, {
    get: value
  })
}

export function buildState<T = State>(snapshot: any): T {
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

  return newState
}

export function deprecated(text?: string) {
  console.warn(`Deprecated ${text && `: ${text}`}`)
}
