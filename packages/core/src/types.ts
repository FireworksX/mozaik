import { State, treeNode, TreeNode } from './treeNode'
import { modelNode } from './modelNode'
import { isArray } from './shared'

export type TypeCollection = Record<string, Type>
export type EmptyTypeValue = null | undefined | Type<undefined> | Type<null> | {}

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

export type ModelType<PROPS extends TypeCollection, OTHERS = State> = TreeNode<
  PROPS,
  OTHERS
> &
  Type<PROPS>

export function model<PROPS extends TypeCollection>(
  inputName: string,
  inputProps: PROPS
): ModelType<PROPS> {
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
  this: any,
  typeValue: T
): Type<GetDeepType<T> | undefined | null> {
  return {
    name: 'maybe',
    validator: value => {
      const isEmpty = typeof value === 'undefined' || value === null
      if (isEmpty) return { valid: true, errors: [] }

      return typeValue.validator(value)
    },
    getDeepModel: () => this.validator(getDeepModelFromType(typeValue))
  }
}

export function optional<T extends Type>(
  this: any,
  typeValue: T,
  defaultValue?: GetDeepType<T>
): Type<GetDeepType<T> | undefined | null> {
  return {
    name: 'optional',
    validator: (value) => {
      const isEmpty = typeof value === 'undefined' || value === null
      if (isEmpty) return { valid: true, errors: [] }

      return typeValue.validator(value)
    },
    getDeepModel: () => this.validator(getDeepModelFromType(typeValue)),
    modifyPredictor: (value) => typeof value === 'undefined' || value === null ? defaultValue : value
  }
}

export function withModify<T extends Type>(
  typeValue: T,
  modifyPredictor: TypeModifyPredictor<GetDeepType<T>>
): Type<GetDeepType<T>> {
  return {
    name: 'withModify',
    validator: typeValue.validator,
    getDeepModel: () => getDeepModelFromType(typeValue),
    modifyPredictor
  }
}

export function array<T extends Type>(this: any, typeValue: T): Type<GetDeepType<T>[]> {
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
    getDeepModel: () => this.validator(getDeepModelFromType(typeValue))
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

export type ConvertPropsToState<T extends TypeCollection> = {
  [P in keyof RequiredProps<T>]: PropsToStateType<T[P]>
}

type PropsToStateType<T> = T extends ModelType<infer PROPS, infer OTHERS>
    ? ConvertPropsToState<PROPS & Partial<OTHERS>>
    : GetDeepType<T>

// TODO make recursive types
type GetDeepType<T> = T extends Type<infer R> ? R : T

type PartialProps<T> = Pick<T, Exclude<PartialKeys<T>, undefined>>
type RequiredProps<T> = Pick<T, Exclude<RequiredKeys<T>, undefined>>

type PartialKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T]
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]

const test: RequiredProps<{
  name: Type<undefined>
  age: Type<number>
  birth: Type<string>
}> = {

}



const routerStore = model('router', {
      path: optional(string),
      history: array(string),
    })
    .create({
      path: undefined,
      history: []
    }).$dispatch({
      type: '',
      state: {
        path: '',
        history: ['']
      }
    })

console.log(routerStore);
