import { AnyState, TreeNodeInstance } from '../types'
import { deepSubscribe } from './deepSubscribe'
import { isTreeNode } from './index'

export function onSnapshot(
  treeNode: TreeNodeInstance,
  on: (state: AnyState) => void
): void

export function onSnapshot(
  treeNode: TreeNodeInstance,
  on: (state: AnyState) => void
) {
  if (isTreeNode(treeNode)) {
    deepSubscribe(treeNode, on, treeNode)
  }
}

export function applySnapshot(
  treeNode: TreeNodeInstance,
  newState: AnyState
): void

export function applySnapshot(treeNode: TreeNodeInstance, newState: AnyState) {
  if (isTreeNode(treeNode)) {
    treeNode.$replaceState(newState)
  }
}
