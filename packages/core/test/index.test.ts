// @ts-ignore
import { types } from '../build/mozaikjs'

describe('@mozaikjs/core', () => {
  describe('env', () => {
    const model = types
      .model({})
    test('isFunction', () => {
      const instance = model.create({}, {
        name: 'test'
      })

      const env = instance.$

      expect(updateCount).toBe(1)
    })
  })
})
