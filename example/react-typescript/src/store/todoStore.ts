import types from '@mozaikjs/core'

const todoModel = types.model('todo', {
    name: types.string,
    isFinished: types.boolean
}).actions({
    onFinish({dispatch}) {
        dispatch({
            isFinished: true
        })
    }
})

export const todoStore = types.model('todoStore', {
    listTodo: types.optional(types.array(todoModel), [])
}).actions({
    addTodo({dispatch, state}, todoName: string) {
        dispatch({
            listTodo: [...state().listTodo || [], {
                name: todoName,
                isFinished: false
            }]
        })
    }
}).computed({
    finishedCount({state}) {
        return state().listTodo?.filter(({isFinished}) => isFinished)
    }
})
