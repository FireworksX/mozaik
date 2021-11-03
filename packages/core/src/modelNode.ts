import { State } from './treeNode'
import { ConvertPropsToState, TypeCollection, TypeValidator } from './types'
import { checkTypes } from './checkTypes'
import { addGetterProperty, addHiddenProperty } from './shared'

let NODE_ID = 0

export interface Action<T> {
  state: T
  type?: string
}
export type SubscribeCtx<S> = {
  state?: S
  oldState?: S
  name: string
  methodName: string
}

export type SubscribeListener<S> = (ctx: SubscribeCtx<S>) => void

export type DispatchState<T extends State> = (action: Action<T>) => void

export type Unsubscribe = () => void

export type Subscribe<S> = (listener: SubscribeListener<S>) => Unsubscribe
export type GetState<S = State> = () => S

export interface ModelNode<PROPS extends TypeCollection, OTHERS = State> {
  name: string
  props: PROPS
  dispatchState: DispatchState<ConvertPropsToState<PROPS>>
  addHiddenProps: (key: string, value: any) => void
  addGetters: (key: string, value: () => any) => void
  getState: GetState<ConvertPropsToState<PROPS> & OTHERS>
  subscribe: Subscribe<ConvertPropsToState<PROPS> & OTHERS>
  validator: TypeValidator
  clone(): ModelNode<PROPS, OTHERS>
}

export function modelNode<PROPS extends TypeCollection, OTHERS>(
  name: string,
  props: PROPS,
  initialState?: ConvertPropsToState<PROPS>
): ModelNode<PROPS> {
  let currentProps = props
  let currentState = initialState as ConvertPropsToState<PROPS> & OTHERS
  let currentListeners: SubscribeListener<ConvertPropsToState<PROPS>>[] = []
  let nextListeners = currentListeners
  const hiddenProps: any = {}
  const getters: any = {}

  NODE_ID++

  const nodeName = `${name}@${NODE_ID}`

  // TODO make errors
  checkTypes(currentProps, currentState)

  function getState(): ConvertPropsToState<PROPS> & OTHERS {
    return wrapHiddenProps(currentState)
  }

  function addHiddenProps(key: string, value: any) {
    hiddenProps[key] = value
  }

  function addGetters(key: string, value: any) {
    getters[key] = value
  }

  function wrapHiddenProps(state: any): ConvertPropsToState<PROPS> & OTHERS {
    const newState = { ...state }
    Object.keys(hiddenProps).forEach(key => {
      addHiddenProperty(newState, key, hiddenProps[key])
    })
    Object.keys(getters).forEach(key => {
      addGetterProperty(newState, key, getters[key])
    })
    return newState
  }

  function subscribe(listener: (state: any) => void) {
    let isSubscribed = true
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = []
    }
  }

  function clone() {
    const newModelNode = modelNode<PROPS, OTHERS>(name, props)
    currentListeners.forEach(listener => newModelNode.subscribe(listener))
    return newModelNode
  }

  function dispatchState(action: Action<ConvertPropsToState<PROPS>>) {
    const checkResponse = checkTypes(currentProps, action.state)

    if (!checkResponse.valid) {
      // TODO make Errors
      console.error(checkResponse.errors)
    }

    const listeners = (currentListeners = nextListeners)
    const oldState = wrapHiddenProps(currentState)
    currentState = wrapHiddenProps(action.state)

    listeners.forEach(
      (listener: SubscribeListener<ConvertPropsToState<PROPS> & OTHERS>) =>
        listener({
          state: currentState,
          oldState: oldState,
          name: nodeName,
          methodName: action.type || 'AnonymousAction'
        })
    )
  }

  return {
    name: nodeName,
    props,
    addHiddenProps,
    addGetters,
    dispatchState,
    getState,
    subscribe,
    clone,
    validator: (value: any) => checkTypes(props, value)
  }
}
