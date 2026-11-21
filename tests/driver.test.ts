import { EventEmitter } from 'node:events'
import { expect, test } from 'vitest'
import { watchBrowserErrors } from '../scripts/driver.mjs'

test('browser error handlers identify the step and fail for either error channel', () => {
  const page = new EventEmitter()
  const errors = watchBrowserErrors(page)
  errors.step(4)
  page.emit('console', { type: () => 'warn', text: () => 'advisory' })
  expect(() => errors.assertClean()).not.toThrow()
  page.emit('console', { type: () => 'error', text: () => 'fixture console error' })
  errors.step(5)
  expect(() => errors.assertClean()).toThrow('Render failed at step index 4: console.error: fixture console error')

  const replacementPage = new EventEmitter()
  const otherErrors = watchBrowserErrors(replacementPage)
  otherErrors.step(7)
  replacementPage.emit('pageerror', new Error('fixture uncaught error'))
  expect(() => otherErrors.assertClean()).toThrow('Render failed at step index 7: pageerror: fixture uncaught error')
})
