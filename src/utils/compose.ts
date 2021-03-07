import { TreeNode, TypeCollection } from '../types'
import { treeNode } from '../node/treeNode'
import { modelNode } from '../node/modelNode'

export function compose(...nodes: TreeNode[]): TreeNode;

export function compose(...nodes: TreeNode[]) {
  if (nodes.length === 0) {
    // TODO make error
  }

  if (nodes.length === 1) {
    return nodes[0]
  }

  return nodes.reduce((resNode, node) => {
    const initializers = [...resNode.initializers, ...node.initializers]
    const props: TypeCollection = { ...resNode.props, ...node.props }
    const modelNodeIns = modelNode('ComposeNode', props)
    return treeNode(modelNodeIns, { props, initializers })
  })
}
