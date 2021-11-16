import { State } from './treeNode'
import { ConvertPropsToState, ModelType, TypeCollection } from "./types";

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
    let value = (snapshot as any)[key]
    let propValue = props[key]
    if (typeof propValue !== 'function') {
      if (propValue.modifyPredictor) {
        value = propValue.modifyPredictor(value)
      }

      if (propValue.getDeepModel) {
        propValue = propValue.getDeepModel()
      }
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

// export function composeNodes(parent: P, child: T): P & T {
//   if (!parent && !child) {
//     throw new Error('Compose function cannot be empty')
//   }
//
//   const nodes: [P, T] = [parent, child]
//
//   const composeName = nodes.map(({ name }) => name).join('/')
//
//   const initializers = [...parent.initializers, ...child.initializers]
//   const plugins = [...parent.pluginsList, ...child.pluginsList]
//   const props: TypeCollection = { ...parent.props, ...child.props }
//   const modelNodeIns: ModelNode<any> = modelNode(`(${composeName})`, props)
//   return treeNode(modelNodeIns, { props, initializers, plugins }) as P & T
// }

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

export function buildState<T = State>(
  snapshot: any
): T {
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
