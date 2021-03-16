import { State, TreeNode, treeNode, TreeNodeInstance } from './treeNode'
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

export const safelyState = (state: any, props: any, passEnv?: any) => {
  const newState: any = {}
  Object.keys(state).forEach(key => {
    const propValue = props[key]
    if (isModelTreeNode(propValue)) {
      newState[key] = propValue.create(state[key], passEnv)
    } else {
      newState[key] = state[key]
    }
  })
  return newState
}

export function deepSubscribe(
  treeNode: TreeNodeInstance,
  on: (state: any) => void,
  safe?: TreeNodeInstance
): void

export function deepSubscribe(
  treeNode: TreeNodeInstance,
  on: (state: any) => void,
  safe: TreeNodeInstance = treeNode
) {
  if (isTreeNode(treeNode)) {
    treeNode.$subscribe(({ state }) => on(state))
  }

  Object.keys(treeNode).forEach(key => {
    // @ts-ignore
    const node = treeNode[key]
    if (isTreeNode(node)) {
      deepSubscribe(node, () => on(safe.$getState()), safe)
    }
  })
}

export function onSnapshot(
  treeNode: TreeNodeInstance,
  on: (state: State) => void
): void

export function onSnapshot(
  treeNode: TreeNodeInstance,
  on: (state: State) => void
) {
  if (isTreeNode(treeNode)) {
    deepSubscribe(treeNode, on, treeNode)
  }
}

export function applySnapshot(treeNode: TreeNodeInstance, newState: State): void

export function applySnapshot(treeNode: TreeNodeInstance, newState: State) {
  if (isTreeNode(treeNode)) {
    treeNode.$replaceState(newState)
  }
}

export function compose<S = State>(...nodes: TreeNode<any>[]): TreeNode<S>

export function compose(...nodes: TreeNode<any>[]) {
  if (nodes.length === 0) {
    // TODO make error
  }

  if (nodes.length === 1) {
    return nodes[0]
  }

  return nodes.reduce((resNode, node) => {
    const initializers = [...resNode.initializers, ...node.initializers]
    const props: TypeCollection = { ...resNode.props, ...node.props }
    const modelNodeIns: ModelNode = modelNode('ComposeNode', props)
    return treeNode(modelNodeIns, { props, initializers })
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
