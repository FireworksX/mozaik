import {TreeNodeSnapshot} from "../types";

export function getEnv(treeNode: TreeNodeSnapshot<any, any>) {
    // TODO Сделать возможность получать env внутри actions
    if (treeNode && treeNode.$env) return treeNode.$env
}
