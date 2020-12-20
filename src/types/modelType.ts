import { modelNode } from '../node/modelNode'
import { treeNode } from '../node/treeNode'

let MODEL_ID = 0

export function model(...args: any) {
  let name = `AnonymousModel@${MODEL_ID}`
  let props = {}

  if (args.length === 2) {
    name = args[0]
    props = args[1]
  } else {
    props = args[0]
  }

  const model = modelNode(name, props)
  const tree = treeNode(model, {})

  return tree
}
