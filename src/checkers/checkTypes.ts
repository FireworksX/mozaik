import {TypeCollection} from "../../types";

export function checkTypes(types: TypeCollection, data: any, skipKeys: string[] = []) {
  if (!data) return {
    valid: true,
    errors: []
  }

  const errors: any = []
  Object.keys(data).forEach(key => {
    if (skipKeys.includes(key)) return
    const value: any = data[key]
    if (types.hasOwnProperty(key)) {
      const validateValue = types[key].validator(value)
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
