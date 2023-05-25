import React from 'react';
import './App.css';
import {useStore} from "@mozaikjs/react";
import {rootStore} from "./store/rootStore";

function App() {
  const {todoStore} = useStore<typeof rootStore>()

  return (
    <div className="App">
      <input type="text" />
      <button onClick={() => todoStore.addTodo('test')}>add todo</button>
      <ul>
        {todoStore.listTodo?.map((el) => <li>{el.name}</li>)}
      </ul>
    </div>

  );
}

export default App;
