import { State, TreeNode, treeNode } from './treeNode'
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

export const safelyState = (state: any) => {
  const newState: any = {}
  Object.keys(state).forEach(key => {
    const value = state[key]
    if (isTreeNode(value)) {
      newState[key] = state[key].$getState()
    } else {
      newState[key] = state[key]
    }
  })
  return newState
}

export function composeNodes<S = State, A = State, C = State>(...nodes: TreeNode<any>[]): TreeNode<S, A, C>

export function composeNodes(...nodes: TreeNode<any>[]) {
  if (nodes.length === 0) {
    // TODO make error
  }

  if (nodes.length === 1) {
    return nodes[0]
  }

  const composeName = nodes.map(({ name }) => name).join('/')

  return nodes.reduce((resNode, node) => {
    const initializers = [...resNode.initializers, ...node.initializers]
    const plugins = [...resNode.pluginsList, ...node.pluginsList]
    const props: TypeCollection = { ...resNode.props, ...node.props }
    const modelNodeIns: ModelNode = modelNode(`(${composeName})`, props)
    return treeNode(modelNodeIns, { props, initializers, plugins })
  })
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
