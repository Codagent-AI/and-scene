// @vitest-environment node
import { expect, it } from 'vitest'
// @ts-expect-error executable integration assertion helper
import { assertCleaned } from '../integration/helpers.mjs'
it('I-39 cleanup assertions reject missing Chromium identity and a still-running Chromium PID', () => {
  const cleanup = 'cleanup: browser and preview stopped'
  expect(() => assertCleaned(`${cleanup}\npreview http://127.0.0.1:5000 pid=${process.pid}`)).toThrow('Chromium PID missing')
  expect(() => assertCleaned(`${cleanup}\nchromium pid=${process.pid}`)).toThrow(`subprocess ${process.pid} still running`)
})
