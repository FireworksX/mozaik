declare type TypeCollection = {
    [key: string]: Type
}

declare interface Type {
    name: string
    validator: TypeValidator
}

declare type ExtendType = (childrenType: Type) => Type

declare type TypeValidator = (
    value: any
) => {
    valid: boolean
    errors?: string[]
}

declare interface Action {
    state: any
    type?: string
}

declare type SubscribeListener = (state: any) => void

declare type DispatchState = (action: Action) => void

declare type Unsubscribe = () => void
declare type Subscribe = (listener: SubscribeListener) => Unsubscribe
declare type GetState<S> = () => S & AnyState

declare interface ModelNode {
    name: string
    dispatchState: DispatchState
    addHiddenProps: (key: string, value: any) => void
    getState: GetState<AnyState>
    subscribe: Subscribe
    validator: TypeValidator
}

declare interface AnyState {
    [key: string]: any
}

declare interface ModelActionsProps<S extends AnyState = {}> {
    getState: GetState<S>
    dispatch<N extends AnyState = {}>(state: N): void
}

declare interface ModelActions {
    [key: string]: Function
}

declare interface ModelViews {
    [key: string]: Function | any
}

declare interface TreeNodeEnv {
    [key: string]: any
}

declare type TreeNodeHelpers<S, E> = {
    readonly $subscribe: Subscribe
    readonly $env: E
    readonly $getState: GetState<S>
}

declare type TreeNodeSnapshot<S> = {
    [T in keyof S]: S[T]
}

declare interface TreeNode {
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
