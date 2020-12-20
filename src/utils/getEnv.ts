import { TreeNodeSnapshot } from '../../types/index'

export function getEnv<T = TreeNodeSnapshot<any, any>>(treeNode: T) {
    if (treeNode && treeNode.$env) return treeNode.$env
}
