import { State } from "./treeNode";
import { TypeCollection, TypeValidator } from './types'
import { checkTypes } from './checkTypes'
import { addHiddenProperty } from './shared'
import { addGetterProperty } from './addGetterProperty'

let NODE_ID = 0

export interface Action {
  state: any
  type?: string
}

export type SubscribeListener = (state: any) => void

export type DispatchState = (action: Action) => void

export type Unsubscribe = () => void
export type Subscribe = (listener: SubscribeListener) => Unsubscribe
export type GetState<S = State> = () => S

export interface ModelNode<S = State> {
  name: string
  dispatchState: DispatchState
  addHiddenProps: (key: string, value: any) => void
  addGetters: (key: string, value: () => any) => void
  getState: GetState<S>
  subscribe: Subscribe
  validator: TypeValidator
}

export function modelNode<S>(
  name: string,
  props: TypeCollection,
  initialState?: S
): ModelNode<S>

export function modelNode<S>(
  name: string,
  props: TypeCollection,
  initialState?: S
): ModelNode<S> {
  let currentProps = props
  let currentState = initialState
  let currentListeners: SubscribeListener[] = []
  let nextListeners = currentListeners
  const hiddenProps: any = {}
  const getters: any = {}

  NODE_ID++

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

  function wrapHiddenProps(state: any) {
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

  function dispatchState(action: Action) {
    const checkResponse = checkTypes(currentProps, action.state)

    if (!checkResponse.valid) {
      // TODO make Errors
      console.error(checkResponse.errors)
    }

    const listeners = (currentListeners = nextListeners)
    currentState = wrapHiddenProps(action.state)

    listeners.forEach((listener: any) => listener(currentState))
  }

  return {
    name: `${name}@${NODE_ID}`,
    addHiddenProps,
    addGetters,
    dispatchState,
    getState,
    subscribe,
    validator: (value: any) => checkTypes(props, value)
  }
}
