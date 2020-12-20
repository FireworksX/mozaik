import {TreeNodeSnapshot} from "../types";

export function getEnv(treeNode: TreeNodeSnapshot<any, any>) {
    if (treeNode && treeNode.$env) return treeNode.$env
}
