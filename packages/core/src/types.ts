import { State, treeNode, TreeNode } from './treeNode'
import { modelNode } from './modelNode'
import { isArray } from './shared'

export type TypeCollection = Record<string, Type>
export type StringLiterals = number | string | Array<any> | Object | Date

export type TypeModifyPredictor<T = any> = (value: T) => T

export interface Type<T = any> {
  name: string
  validator: TypeValidator<T>
  getDeepModel?: () => any
  modifyPredictor?: TypeModifyPredictor<T>
}

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

export type ModelType<PROPS extends TypeCollection, OTHERS> = TreeNode<
  PROPS,
  OTHERS
> &
  Type<PROPS>

export function model<PROPS extends TypeCollection>(
  inputName: string,
  inputProps: PROPS
): ModelType<PROPS, State> {
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

export const any: Type<any> = {
  name: 'any',
  validator: () => ({
    valid: true,
    errors: []
  })
}

export function optional<T extends Type>(
  this: any,
  typeValue: T,
  defaultValue?: GetDeepType<T>
): Type<PropsToStateType<T> | undefined | null> {
  return {
    name: 'optional',
    validator: value => {
      const isEmpty = typeof value === 'undefined' || value === null
      if (isEmpty) return { valid: true, errors: [] }

      return typeValue.validator(value)
    },
    getDeepModel: () => getDeepModelFromType(typeValue),
    modifyPredictor: value =>
      typeof value === 'undefined' || value === null ? defaultValue : value
  }
}

export function array<T extends Type>(
  this: any,
  typeValue: T
): Type<PropsToStateType<T>[]> {
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

export function custom<T extends Type>(baseType: T, predicate: (value: PropsToStateType<T>) => boolean): Type<PropsToStateType<T>> {
  return {
    name: 'custom',
    validator: value => {
      const baseTypeValid = baseType.validator(value)
      const valid = predicate(value) && baseTypeValid.valid
      return {
        valid,
        errors: valid
          ? []
          : [`Value [${value}] does not valid of custom validator.`, ...baseTypeValid.errors || []]
      }
    }
  }
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type ConvertPropsToState<T extends TypeCollection> = PartialBy<
  {
    [P in keyof T]: PropsToStateType<T[P]>
  },
  OptionalKeys<T>
>

export type ConvertModelToState<T extends TypeCollection> = PartialBy<
  {
    [P in keyof T]: ModelToStateType<T[P]>
  },
  OptionalKeys<T>
>

type OptionalKeys<T extends TypeCollection> = {
  [P in keyof T]: PropsToStateType<T[P]> extends StringLiterals ? never : P
}[keyof T]

type PropsToStateType<T> = T extends ModelType<infer PROPS, any>
  ? ConvertPropsToState<PROPS>
  : GetDeepType<T>

type ModelToStateType<T> = T extends ModelType<infer PROPS, infer OTHERS>
  ? ConvertPropsToState<PROPS> & OTHERS
  : GetDeepType<T>

// TODO make recursive types
type GetDeepType<T> = T extends Type<infer R> ? R : T
