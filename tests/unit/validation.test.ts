// @vitest-environment node
import { expect, it } from 'vitest'
import { assertReference } from '../../scripts/validation.mjs'
import expected from './reference.json'
it('I-36 rejects missing malformed count and out-of-order reference metadata', () => {
  for (const bad of [undefined, {}, [], expected.slice(1), [...expected].reverse(), expected.map((e, i) => i === 4 ? { ...e, caption: 'wrong' } : e)]) expect(() => assertReference(bad, expected)).toThrow()
  expect(() => assertReference(expected, expected)).not.toThrow()
  expect(() => assertReference(expected.map(e => ({ ...e, id: 'another-stable-id-'+e.id })), expected)).not.toThrow()
})
