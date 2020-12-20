import {AnyState} from "../../types";

export function addHiddenProperty<S extends AnyState, P extends PropertyKey, V>(
  object: S,
  prop: P,
  value: V
): AnyState & {
  [key: string]: V
} {
  const newState = { ...object }
  Object.defineProperty(newState, prop, {
    configurable: false,
    enumerable: true,
    writable: false,
    value: value
  })

  return newState
}
