// @ts-ignore
import { types } from '../build/mozaikjs'

describe('@mozaikjs/core', () => {
  describe('middlewares', () => {
    const model = types
      .model({
        count: types.number
      })
      .actions({
        setCount({ dispatch }: any, count: any) {
          dispatch({
            count
          })
        }
      })
    test('should', () => {
      let updateCount = 0
      model.subscribe(() => updateCount++)

      model.create({
        count: 0
      })

      expect(updateCount).toBe(1)
    })
  })
})
