import { ExtendType, Type } from '../../types'
import {isArray} from "../utils";

const string: Type = {
  name: 'string',
  validator: value => ({
    valid: typeof value === 'string',
    errors:
      typeof value === 'string'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not string type.`]
  })
}

const number: Type = {
  name: 'number',
  validator: value => ({
    valid: typeof value === 'number',
    errors:
      typeof value === 'number'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not number type.`]
  })
}

const boolean: Type = {
  name: 'boolean',
  validator: value => ({
    valid: typeof value === 'boolean',
    errors:
      typeof value === 'boolean'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not boolean type.`]
  })
}

const maybe: ExtendType = (typeValue) => {
  return {
    name: 'maybe',
    validator: value => {
      const isEmpty = typeof value === 'undefined' || value === null
      if (isEmpty) return { valid: true, errors: [] }

      return typeValue.validator(value)
    }
  }
}

const array: ExtendType = (typeValue) => {
  return {
    name: 'array',
    validator: value => {
      const errors: any = []
      const valid =
        isArray(value) &&
        value.every(val => {
          const validate = typeValue.validator(val)
          if (!validate.valid) {
            errors.push(validate.errors)
          }
          return validate.valid
        })
      return {
        valid,
        errors
      }
    }
  }
}

export const types = { string, number, boolean, array, maybe }

export default types
