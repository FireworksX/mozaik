import { TreeNodeInstance, State } from '@mozaikjs/core/build/treeNode'
import { SubscribeCtx } from '@mozaikjs/core/build/modelNode'

export const isPrimitive = (value: any) =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null

export const isObject = (value: any) =>
  !isPrimitive(value) && !Array.isArray(value)

export const isTreeNode = (value: any) =>
  isObject(value) && value.hasOwnProperty('$subscribe')

const log = (ctx: SubscribeCtx<State>) => {
  console.log(
    '%c prev state',
    'color: #9E9E9E; font-weight: bold',
    ctx.oldState
  )
  console.log(
    '%c mutation',
    'color: #03A9F4; font-weight: bold',
    `${ctx.name} / ${ctx.methodName}`
  )
  console.log('%c next state', 'color: #4CAF50; font-weight: bold', ctx.state)
}

const deepSubscribe = (
  treeNode: TreeNodeInstance,
  event: (ctx: SubscribeCtx<State>) => void
) => {
  treeNode.$subscribe(event)

  const state = treeNode.$getState()
  if (isObject(state)) {
    Object.keys(state).forEach(key => {
      const value = state[key]
      if (isTreeNode(value)) {
        deepSubscribe(value, event)
      }
    })
  }
}

export const loggerPlugin = ({ onlyClient = true }) => {
  return (treeNode: TreeNodeInstance) => {
    if (onlyClient) {
      if (window || document) {
        deepSubscribe(treeNode, log)
      }
    } else {
      deepSubscribe(treeNode, log)
    }
  }
}
