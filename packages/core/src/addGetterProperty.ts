import { State } from "./treeNode";

export function addGetterProperty<V>(
  object: State,
  prop: PropertyKey,
  value: () => V
): void

export function addGetterProperty<V>(
  object: State,
  prop: PropertyKey,
  value: () => V
): void {
  Object.defineProperty(object, prop, {
    get: value
  })
}
