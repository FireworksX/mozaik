import { AnyState } from '../types'
export function addGetterProperty<V>(
  object: AnyState,
  prop: PropertyKey,
  value: () => V
): void

export function addGetterProperty<V>(
  object: AnyState,
  prop: PropertyKey,
  value: () => V
): void {
  Object.defineProperty(object, prop, {
    get: value
  })
}
