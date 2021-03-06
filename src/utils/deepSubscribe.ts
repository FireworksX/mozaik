import { TreeNodeInstance } from '../types'
import { isTreeNode } from './index'

export function deepSubscribe(
  treeNode: TreeNodeInstance,
  on: (state: any) => void,
  safe: TreeNodeInstance = treeNode
) {
  if (isTreeNode(treeNode)) {
    treeNode.$subscribe(on)
  }

  Object.keys(treeNode).forEach(key => {
    // @ts-ignore
    const node = treeNode[key]
    if (isTreeNode(node)) {
      deepSubscribe(node, () => on(safe.$getState()), safe)
    }
  })
}
