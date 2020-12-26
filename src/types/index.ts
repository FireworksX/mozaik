export type TypeCollection = {
  [key: string]: Type
}

export interface Type {
  name: string
  validator: TypeValidator
}

export type ExtendType = (childrenType: Type) => Type

export type TypeValidator = (
  value: any
) => {
  valid: boolean
  errors?: string[]
}

export interface Action {
  state: any
  type?: string
}

export type SubscribeListener = (state: any) => void

export type DispatchState = (action: Action) => void

export type Unsubscribe = () => void
export type Subscribe = (listener: SubscribeListener) => Unsubscribe
export type GetState<S> = () => S & AnyState

export interface ModelNode {
  name: string
  dispatchState: DispatchState
  addHiddenProps: (key: string, value: any) => void
  getState: GetState<AnyState>
  subscribe: Subscribe
  validator: TypeValidator
}

export interface AnyState {
  [key: string]: any
}

export interface ModelActionsProps<S extends AnyState = {}> {
  getState: GetState<S>
  dispatch<N extends AnyState = {}>(state: N): void
}

export interface ModelActions {
  [key: string]: Function
}

export interface ModelViews {
  [key: string]: Function | any
}

export interface TreeNodeEnv {
  [key: string]: any
}

export type TreeNodeHelpers<S, E> = {
  readonly $subscribe: Subscribe
  readonly $env: E
  readonly $getState: GetState<S>
}

export type TreeNodeSnapshot<S> = {
  [T in keyof S]: S[T]
}

export interface TreeNode {
  props: TypeCollection
  initializers: any
  validator: TypeValidator
  actions(cb: (self: ModelActionsProps) => ModelActions): TreeNode
  views(cb: (self: any) => ModelActions): TreeNode
  create<S extends {}, E extends TreeNodeEnv = any>(
    snapshot: S,
    env?: E
  ): TreeNodeSnapshot<S & TreeNodeHelpers<S, E> & AnyState>
}
