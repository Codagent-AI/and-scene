import { EventEmitter } from 'node:events'
import { expect, it } from 'vitest'
// @ts-expect-error Runtime JavaScript helper shared by production verifier.
import { browserErrors, verificationFailure } from '../scripts/render-errors.mjs'
it('attributes console and pageerror channels to the failed phase and step while ignoring non-error console output', () => {
  const page = new EventEmitter()
  const errors = browserErrors(page)
  page.emit('console', { type: () => 'log', text: () => 'ordinary log' })
  expect(errors).toEqual([])
  page.emit('console', { type: () => 'error', text: () => 'broken console' })
  expect(errors).toEqual(['console: broken console'])
  expect(verificationFailure('render', 2, new Error(errors.join('; ')))).toBe('FAIL verification phase=render step=2: console: broken console')
  page.emit('pageerror', new Error('uncaught scene exception'))
  expect(errors).toEqual(['console: broken console', 'pageerror: uncaught scene exception'])
  expect(verificationFailure('render', 5, new Error(errors[1]))).toBe('FAIL verification phase=render step=5: pageerror: uncaught scene exception')
  expect(verificationFailure('transition', 4, new Error('stalled'))).toBe('FAIL verification phase=transition step=4: stalled')
  expect(verificationFailure('build', 0, new Error('compiler error'))).toBe('FAIL verification phase=build step=0: compiler error')
})
