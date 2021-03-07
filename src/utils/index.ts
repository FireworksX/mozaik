
export const isPrimitive = (value: any) =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null
export const isArray = Array.isArray
export const isObject = (value: any) => !isPrimitive(value) && !isArray(value)
export const isEmpty = (value: any) => !isPrimitive(value) && !isArray(value)

export const isModelTreeNode = (value: any) => isObject(value) && value.hasOwnProperty('create')
export const isTreeNode = (value: any) => isObject(value) && value.hasOwnProperty('$subscribe')

export const safelyState = (state: any, props: any, passEnv?: any) => {
  const newState: any = {}
  Object.keys(state).forEach(key => {
    const propValue = props[key]
    if (isModelTreeNode(propValue)) {
      newState[key] = propValue.create(state[key], passEnv)
    } else {
      newState[key] = state[key];
    }
  })
  return newState
}
