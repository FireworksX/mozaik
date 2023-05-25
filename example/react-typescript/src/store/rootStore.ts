import types from '@mozaikjs/core'
import {todoStore} from "./todoStore";

export const rootStore = types.model('rootStore', {
    todoStore
}).create({
    todoStore: {}
})
