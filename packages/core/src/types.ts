import { State, treeNode, TreeNode } from './treeNode'
import { modelNode } from './modelNode'
import { isArray } from './shared'

export type FullType = Type | ExtendType<any> | UtilType

export type TypeCollection = Record<string, FullType>

export interface Type<T = any> {
  name: string
  validator: TypeValidator<T>
  getDeepModel?: () => any
}

export type ConvertPropsToState<PROPS extends TypeCollection> = {
  [P in keyof PROPS]: GetDeepType<PROPS[P]>
}

type GetDeepType<T extends TypeCollection[string]> = T extends Type<infer R>
  ? R
  : T

export interface Type<T = any> {
  name: string
  validator: TypeValidator<T>
  getDeepModel?: () => any
}
export type ExtendType<T extends any> = (childrenType: T) => T
export type UtilType = (...args: any[]) => Type

export type TypeValidator<T = any> = (
  value: T
) => {
  valid: boolean
  errors?: string[]
}

const getDeepModelFromType = (typeValue: Type) => {
  if (typeValue.getDeepModel) {
    return typeValue.getDeepModel()
  }
  return typeValue
}

type ModelType<PROPS extends TypeCollection> = TreeNode<PROPS, State> &
  Type<PROPS>

export function model<PROPS extends TypeCollection>(
  inputName: string,
  inputProps: PROPS
): ModelType<PROPS> & Type<ConvertPropsToState<PROPS>> {
  let name = inputName || `AnonymousModel`
  let props = inputProps || {}

  const model = modelNode<PROPS, State>(name, props)
  return treeNode<PROPS, State>(model, { props })
}

export const string: Type<string> = {
  name: 'string',
  validator: value => ({
    valid: typeof value === 'string',
    errors:
      typeof value === 'string'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not string type.`]
  })
}

export const number: Type<number> = {
  name: 'number',
  validator: value => ({
    valid: typeof value === 'number',
    errors:
      typeof value === 'number'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not number type.`]
  })
}

export const boolean: Type<boolean> = {
  name: 'boolean',
  validator: value => ({
    valid: typeof value === 'boolean',
    errors:
      typeof value === 'boolean'
        ? []
        : [`Type [${typeof value}] of value [${value}] does not boolean type.`]
  })
}

export const date: Type<Date> = {
  name: 'date',
  validator: value => ({
    valid: value instanceof Date,
    errors:
      value instanceof Date
        ? []
        : [`Type [${typeof value}] of value [${value}] does not Date type.`]
  })
}

export function maybe<T extends Type>(
  typeValue: T
): Type<GetDeepType<T> | undefined | null> {
  return {
    name: 'maybe',
    validator: value => {
      const isEmpty = typeof value === 'undefined' || value === null
      if (isEmpty) return { valid: true, errors: [] }

      return typeValue.validator(value)
    },
    getDeepModel: () => getDeepModelFromType(typeValue)
  }
}

export function array<T extends Type>(typeValue: T): Type<GetDeepType<T>[]> {
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
    },
    getDeepModel: () => getDeepModelFromType(typeValue)
  }
}

export function enumeration<T extends any[]>(...values: T): Type<T[number]> {
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

export function custom(predicate: (value: any) => boolean): Type<any> {
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

