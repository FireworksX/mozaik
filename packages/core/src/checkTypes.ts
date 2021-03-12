import { TypeCollection, TypeValidator } from './types'
import { State } from "./treeNode";

export function executeTypeChecker(
  type: TypeCollection[0],
  value: any
): ReturnType<TypeValidator>

export function executeTypeChecker(
  type: TypeCollection[0],
  value: any
): ReturnType<TypeValidator> {
  if (typeof type === 'function') {
    return type(value).validator(value)
  }
  return type.validator(value)
}

export function checkTypes(
  types: TypeCollection,
  data?: State,
  skipKeys?: string[]
): {
  valid: boolean
  errors: any
}

export function checkTypes(
  types: TypeCollection,
  data?: State,
  skipKeys: string[] = []
) {
  if (!data || (data && Object.keys(data).length === 0))
    return {
      valid: false,
      errors: [
        {
          message: 'State can`t be empty'
        }
      ]
    }

  const errors: any = []
  Object.keys(data).forEach(key => {
    if (skipKeys.includes(key)) return
    const value: any = data[key]
    if (types.hasOwnProperty(key)) {
      const validateValue = executeTypeChecker(types[key], value)
      if (!validateValue.valid) {
        errors.push({
          message: `Failed validate property [${key}]`,
          validatorError: validateValue.errors
        })
      }
    } else {
      errors.push({
        message: `Property [${key}] does not allow in this types scheme`,
        types
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
