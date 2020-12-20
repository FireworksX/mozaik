export const isPrimitive = (value: any) =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null
export const isArray = Array.isArray
export const isObject = (value: any) => !isPrimitive(value) && !isArray(value)
