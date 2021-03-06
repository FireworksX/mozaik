import { TreeNodeInstance } from '../types'
import { deepSubscribe } from './deepSubscribe'

export function onSnapshot(treeNode: TreeNodeInstance, on: (state: any) => void) {
  deepSubscribe(treeNode, on, treeNode)
}
