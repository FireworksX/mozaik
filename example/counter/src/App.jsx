import { useStore } from '@mozaikjs/react'

function App() {
  const store = useStore()
  return (
    <div className="App">
      <h1>Count: {store.count}</h1>
      <button onClick={store.increment}>+1</button>
      <button onClick={store.decrement}>-1</button>
    </div>
  )
}

export default App
