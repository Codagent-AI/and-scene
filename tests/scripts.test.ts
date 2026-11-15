import { test, expect } from 'vitest'
// @ts-expect-error JavaScript module is tested directly.
import { validateSample } from '../scripts/sample-validation.mjs'
import expected from '../scripts/reference.json'
test('I-41 validation rejects missing malformed reordered title caption era and id', () => {
  expect(() => validateSample(expected, expected)).not.toThrow()
  expect(() => validateSample([], expected)).toThrow('count')
  expect(() => validateSample([...expected].reverse(), expected)).toThrow('step 0')
  for (const key of ['id', 'era', 'title', 'caption']) {
    const actual = structuredClone(expected); Object.assign(actual[1], { [key]: 'wrong' })
    expect(() => validateSample(actual, expected)).toThrow(`step 1: incorrect ${key}`)
  }
})
