import React, {
  createContext,
  FC,
  Reducer,
  useContext,
  useEffect,
  useReducer,
  useRef
} from 'react'

const StoreContext = createContext<any>({})

function useForceUpdate() {
  // dispatch don't have action and don't changes between rerenders
  return useReducer<Reducer<boolean, null>>(s => !s, true)[1] as () => void
}

export const StoreProvider: FC<{ store: any }> = ({ store, children }) => {
  const stateRef = useRef<ReturnType<typeof store>>(store)
  const forceUpdate = useForceUpdate()

  useEffect(() => {
    if (!store.$subscribe) {
      console.error(
        'You can pass only store instance, use .create method for create them'
      )
      return
    }
    const unsubscribe = store.$subscribe(({ state }: any) => {
      if (state !== stateRef.current) {
        stateRef.current = state
        forceUpdate()
      }
    })
    return unsubscribe
  }, [])

  return (
    <StoreContext.Provider value={stateRef.current}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = <T,>() => useContext<T>(StoreContext)

