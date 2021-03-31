import { TreeNodeInstance, State } from '@mozaikjs/core/build/treeNode'
import { SubscribeCtx } from '@mozaikjs/core/build/modelNode'

export const isPrimitive = (value: any) =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null

export const isObject = (value: any) =>
  !isPrimitive(value) && !Array.isArray(value)

export const isTreeNode = (value: any) =>
  isObject(value) && value.hasOwnProperty('$subscribe')

export type LoggerOptions = {
  onlyClient?: boolean
  skipChildrenUpdate?: boolean
}

const log = (ctx: SubscribeCtx<State>, options: LoggerOptions) => {
  if (options?.skipChildrenUpdate && ctx.methodName === 'childrenUpdated') {
    return
  }
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

function isServer() {
  return !(typeof window != 'undefined' && window.document)
}

export const loggerPlugin = (
  options: LoggerOptions = { onlyClient: true, skipChildrenUpdate: true }
) => {
  return (treeNode: TreeNodeInstance) => {
    if (options.onlyClient) {
      if (!isServer()) {
        treeNode.$subscribe(ctx => log(ctx, options))
      }
    } else {
      treeNode.$subscribe(ctx => log(ctx, options))
    }
  }
}
