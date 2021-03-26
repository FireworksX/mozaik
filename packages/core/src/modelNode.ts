import { State } from './treeNode'
import { TypeCollection, TypeValidator } from './types'
import { checkTypes } from './checkTypes'
import { addHiddenProperty } from './shared'
import { addGetterProperty } from './addGetterProperty'

let NODE_ID = 0

export interface Action {
  state: any
  type?: string
}
export type SubscribeCtx<S> = {
  state: S
  oldState: S
  name: string
  methodName: string
}

export type SubscribeListener<S> = (ctx: SubscribeCtx<S>) => void

export type DispatchState = (action: Action) => void

export type Unsubscribe = () => void

export type Subscribe<S> = (listener: SubscribeListener<S>) => Unsubscribe
export type GetState<S = State> = () => S

export interface ModelNode<S = State> {
  name: string
  dispatchState: DispatchState
  addHiddenProps: (key: string, value: any) => void
  addGetters: (key: string, value: () => any) => void
  getState: GetState<S>
  subscribe: Subscribe<S>
  validator: TypeValidator
  clone(): ModelNode<S>
}

export function modelNode<S>(
  name: string,
  props: TypeCollection,
  initialState?: S
): ModelNode<S>

export function modelNode<S>(
  name: string,
  props: TypeCollection,
  initialState: S
): ModelNode<S> {
  let currentProps = props
  let currentState = initialState
  let currentListeners: SubscribeListener<S>[] = []
  let nextListeners = currentListeners
  const hiddenProps: any = {}
  const getters: any = {}

  NODE_ID++

  const nodeName = `${name}@${NODE_ID}`

  // TODO make errors
  checkTypes(currentProps, currentState)

  function getState(): S {
    return wrapHiddenProps(currentState)
  }

  function addHiddenProps(key: string, value: any) {
    hiddenProps[key] = value
  }

  function addGetters(key: string, value: any) {
    getters[key] = value
  }

  function wrapHiddenProps(state: any): S {
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
    const newModelNode = modelNode<S>(name, props)
    currentListeners.forEach(listener => newModelNode.subscribe(listener))
    return newModelNode
  }

  function dispatchState(action: Action) {
    const checkResponse = checkTypes(currentProps, action.state)

    if (!checkResponse.valid) {
      // TODO make Errors
      console.error(checkResponse.errors)
    }

    const listeners = (currentListeners = nextListeners)
    const oldState = wrapHiddenProps(currentState)
    currentState = wrapHiddenProps(action.state)

    listeners.forEach((listener: SubscribeListener<S>) =>
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
    addHiddenProps,
    addGetters,
    dispatchState,
    getState,
    subscribe,
    clone,
    validator: (value: any) => checkTypes(props, value)
  }
}
