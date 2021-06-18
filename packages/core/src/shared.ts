import { Instance, State, TreeNode, treeNode } from './treeNode'
import { ModelNode, modelNode } from './modelNode'
import { TypeCollection } from './types'

export const isPrimitive = (value: any) =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null
export const isArray = Array.isArray
export const isObject = (value: any) => !isPrimitive(value) && !isArray(value)
export const isEmpty = (value: any) => !isPrimitive(value) && !isArray(value)

export const isModelTreeNode = (value: any) =>
  isObject(value) && value.hasOwnProperty('create')
export const isTreeNode = (value: any) =>
  isObject(value) && value.hasOwnProperty('$subscribe')

export const defineReactive = (
  props: any,
  snapshot: any,
  env: any,
  updateChildren: any
) => {
  return Object.keys(props).reduce<any>((result, key) => {
    const value = snapshot[key]
    let propValue = props[key]
    if (propValue.getDeepModel) {
      propValue = propValue.getDeepModel()
    }

    if (isModelTreeNode(propValue) && isObject(value)) {
      const instanceValue = propValue.clone().create(value, env)
      instanceValue.$subscribe(updateChildren)
      result[key] = instanceValue
    } else if (isArray(value)) {
      result[key] = value.map((el: any) => {
        if (isModelTreeNode(propValue)) {
          const instanceValue = propValue.clone().create(el, env)
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

export type AnyInstance = Instance<any, any, any>
export type AnyTreeNode = TreeNode<any, any, any>

export function composeNodes<
  P extends AnyTreeNode = AnyTreeNode,
  T extends AnyTreeNode = AnyTreeNode
>(parent: P, child: T): P & T {
  if (!parent && !child) {
    throw new Error('Compose function cannot be empty')
  }

  const nodes: [P, T] = [parent, child]

  const composeName = nodes.map(({ name }) => name).join('/')

  const initializers = [...parent.initializers, ...child.initializers]
  const plugins = [...parent.pluginsList, ...child.pluginsList]
  const props: TypeCollection = { ...parent.props, ...child.props }
  const modelNodeIns: ModelNode = modelNode(`(${composeName})`, props)
  return treeNode(modelNodeIns, { props, initializers, plugins }) as P & T
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

export function buildState<S = State, A = any, C = any>(
  snapshot: any
): Instance<S, A, C> {
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
