// @ts-ignore
import { types } from '../build/mozaikjs'

describe('@mozaikjs/core', () => {
  describe('env', () => {
    const model = types.model({})

    test('hasEnv', () => {
      const instance = model.create(
        {},
        {
          name: 'test'
        }
      )

      expect(instance.$env.name).toBe('test')
    })
  })
})
