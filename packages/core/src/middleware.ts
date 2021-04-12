import { State } from './treeNode'

export interface MiddlewareManager {
  use(methodName: string, middleware: Middleware): void
  use(middleware: Middleware): void
  run<S = State>(methodName: string, state: S): S
}
export type Middleware<S = State> = (state: State) => S | void

function compose<S>(...funcs: Middleware<S>[]) {
  if (funcs.length === 0) {
    return (arg: any) => arg
  }

  funcs = funcs.filter((func: any) => typeof func === 'function')

  if (funcs.length === 1) {
    return funcs[0]
  }

  funcs.reverse()

  const last = funcs[funcs.length - 1]
  const rest = funcs.slice(0, -1)
  return (state: S) =>
    rest.reduceRight((composed: any, f: any) => f(composed), last(state))
}

export function middlewareManager(): MiddlewareManager

export function middlewareManager() {
  const collectionByMethods: any = {
    all: []
  }
  const use = (...args: any) => {
    let methodName = 'all'
    let middleware = args[0]
    if (args.length === 2) {
      methodName = args[0]
      middleware = args[1]
    }

    if (methodName in collectionByMethods) {
      collectionByMethods[methodName].push(middleware)
    } else {
      collectionByMethods[methodName] = [middleware]
    }
  }

  function run<S = State>(methodName: string = 'all', initialState: any) {
    const list = [
      ...collectionByMethods.all,
      ...(collectionByMethods[methodName] || [])
    ]

    if (list) {
      return compose<S>(...list)(initialState)
    }
    return undefined
  }

  return {
    use,
    run
  }
}
