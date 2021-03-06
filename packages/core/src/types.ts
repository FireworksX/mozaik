import { State, treeNode, TreeNode } from './treeNode'
import { modelNode } from './modelNode'
import { isArray } from './shared'

export type TypeCollection = {
  [key: string]: Type | ExtendType | UtilType
}

export interface Type {
  name: string
  validator: TypeValidator
}

export type ExtendType = (childrenType: Type) => Type
export type UtilType = (...args: any[]) => Type

export type TypeValidator = (
  value: any
) => {
  valid: boolean
  errors?: string[]
}

export function model<S = State>(
  name: string,
  props: TypeCollection
): TreeNode<S> & Type
export function model<S = State>(props: TypeCollection): TreeNode<S> & Type

export function model<S = State>(...args: any) {
  let name = `AnonymousModel`
  let props = {}

  if (args.length === 2) {
    name = args[0]
    props = args[1]
  } else {
    props = args[0]
  }

  const model = modelNode<S>(name, props)
  return treeNode<S>(model, { props })
}

export const string: Type = {
  name: 'string',
  validator: value => ({
    valid: typeof value === 'string',
    errors:
      typeof value === 'string'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not string type.`]
  })
}

export const number: Type = {
  name: 'number',
  validator: value => ({
    valid: typeof value === 'number',
    errors:
      typeof value === 'number'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not number type.`]
  })
}

export const boolean: Type = {
  name: 'boolean',
  validator: value => ({
    valid: typeof value === 'boolean',
    errors:
      typeof value === 'boolean'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not boolean type.`]
  })
}

export const maybe: ExtendType = typeValue => {
  return {
    name: 'maybe',
    validator: value => {
      const isEmpty = typeof value === 'undefined' || value === null
      if (isEmpty) return { valid: true, errors: [] }

      return typeValue.validator(value)
    }
  }
}

export const array: ExtendType = typeValue => {
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

export const enumeration: UtilType = (...values: any[]) => {
  return {
    name: 'enumeration',
    validator: value => {
      const valid = values.findIndex(val => val === value) !== -1
      return {
        valid,
        errors: valid
          ? []
          : [`Value [${value}] does not enumeration type of ${values}.`]
      }
    }
  }
}

export const custom: UtilType = (predicate: (value: any) => boolean) => {
  return {
    name: 'custom',
    validator: value => {
      const valid = predicate(value)
      return {
        valid,
        errors: valid
          ? []
          : [`Value [${value}] does not valid of custom validator.`]
      }
    }
  }
}
