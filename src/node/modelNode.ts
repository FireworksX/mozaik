import { checkTypes } from '../checkers/checkTypes'
import { Action, ModelNode, SubscribeListener, TypeCollection } from '../types'

let NODE_ID = 0

const SYSTEM_NODE_PROPS = ['$subscribe', '$env', '$getState']

export function modelNode(
  name: string,
  props: TypeCollection,
  initialState?: any
): ModelNode {
  let currentProps = props
  let currentState = initialState
  let currentListeners: SubscribeListener[] = []
  let nextListeners = currentListeners
  let skipTypeKeys: string[] = SYSTEM_NODE_PROPS

  NODE_ID++

  // TODO make errors
  checkTypes(currentProps, currentState)

  function getState() {
    return currentState
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
    const checkResponse = checkTypes(currentProps, action.state, skipTypeKeys)

    if (!checkResponse.valid) {
      // TODO make Errors
      console.error(checkResponse.errors)
    }

    const listeners = (currentListeners = nextListeners)
    currentState = action.state

    listeners.forEach((listener: any) => listener(currentState))
  }

  return {
    name: `${name}@${NODE_ID}`,
    dispatchState,
    getState,
    subscribe,
    addSkipTypeKey: (key: string) => skipTypeKeys.push(key),
    validator: (value: any) => checkTypes(props, value, skipTypeKeys)
  }
}
