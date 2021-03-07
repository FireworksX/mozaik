import { checkTypes } from '../checkers/checkTypes'
import { Action, GetState, ModelNode, SubscribeListener, TypeCollection } from "../types";
import {addHiddenProperty} from "../utils/addHiddenProperty";

let NODE_ID = 0


export function modelNode<S>(name: string, props: TypeCollection, initialState?: S): ModelNode;

export function modelNode<S>(
  name: string,
  props: TypeCollection,
  initialState?: S
): ModelNode {
  let currentProps = props
  let currentState = initialState
  let currentListeners: SubscribeListener[] = []
  let nextListeners = currentListeners
  const hiddenProps: any = {}

  NODE_ID++

  // TODO make errors
  checkTypes(currentProps, currentState)

  function getState(): GetState<S> {
    return wrapHiddenProps(currentState)
  }

  function addHiddenProps(key: string, value: any) {
    hiddenProps[key] = value
  }

  function wrapHiddenProps(state: any) {
    const newState = {...state}
    Object.keys(hiddenProps).forEach((key) => {
      addHiddenProperty(newState, key, hiddenProps[key])
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
    dispatchState,
    getState,
    subscribe,
    validator: (value: any) => checkTypes(props, value)
  }
}
