import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { EXPECTED_OUTLINE, checkSample } from '../../../scripts/verify-outline.mjs'
import {
  VerifyFailure,
  attachErrorCollectors,
  isFatalConsoleType,
  isFatalResponse,
  waitForStepIndex,
} from '../../../scripts/verify-lib.mjs'

const registry = [{ slug: 'how-to-make-a-presentation' }]
const outline = EXPECTED_OUTLINE.map((row) => ({ ...row }))

describe('checkSample', () => {
  it('accepts the canonical sample', () => {
    expect(checkSample({ registry, outline })).toEqual([])
    expect(EXPECTED_OUTLINE).toHaveLength(9)
  })

  it('rejects a sample that is not registered', () => {
    expect(checkSample({ registry: [], outline })[0]).toMatch(/not registered/)
    expect(checkSample({ registry: undefined, outline })[0]).toMatch(/not registered/)
    expect(checkSample({ registry: [{ slug: 'other' }], outline })[0]).toMatch(/not registered/)
  })

  it('rejects a missing outline', () => {
    expect(checkSample({ registry, outline: undefined })).toEqual([expect.stringMatching(/outline is missing/)])
  })

  it('rejects a wrong step count', () => {
    expect(checkSample({ registry, outline: outline.slice(0, 8) }).join('\n')).toMatch(/8 steps, expected 9/)
    expect(checkSample({ registry, outline: [...outline, outline[0]] }).join('\n')).toMatch(/10 steps, expected 9/)
  })

  it('rejects reordered steps', () => {
    const swapped = [...outline]
    ;[swapped[2], swapped[3]] = [swapped[3], swapped[2]]
    const problems = checkSample({ registry, outline: swapped })
    expect(problems.some((p) => p.startsWith('step 3 title'))).toBe(true)
    expect(problems.some((p) => p.startsWith('step 4 title'))).toBe(true)
  })

  it.each(['era', 'title', 'caption'])('rejects a changed %s independently', (field) => {
    const changed = outline.map((row, i) => (i === 5 ? { ...row, [field]: `${row[field]}!` } : row))
    const problems = checkSample({ registry, outline: changed })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(new RegExp(`^step 6 ${field}:`))
  })

  it('compares against strings independent of the sample data', async () => {
    const { OUTLINE } = await import('../../presentations/how-to-make-a-presentation/outline')
    expect(checkSample({ registry, outline: OUTLINE })).toEqual([])
  })
})

describe('fault classification', () => {
  it('fails on console errors only, not warnings or logs', () => {
    expect(isFatalConsoleType('error')).toBe(true)
    for (const type of ['warning', 'log', 'info', 'debug']) expect(isFatalConsoleType(type)).toBe(false)
  })

  it('fails on same-origin asset errors only', () => {
    const origin = 'http://127.0.0.1:5000'
    expect(isFatalResponse(`${origin}/assets/a.js`, 404, origin)).toBe(true)
    expect(isFatalResponse(`${origin}/assets/a.js`, 200, origin)).toBe(false)
    expect(isFatalResponse('https://elsewhere.test/x', 500, origin)).toBe(false)
    expect(isFatalResponse(`${origin}/favicon.ico`, 404, origin)).toBe(false)
  })
})

function fakePage() {
  const page = new EventEmitter()
  page.timeouts = []
  page.waitForFunction = async (_fn, index, { timeout }) => {
    page.timeouts.push(timeout)
    if (page.stall) throw new Error(`timed out waiting for ${index}`)
  }
  return page
}

describe('attachErrorCollectors', () => {
  it('records console errors, page errors, and failed same-origin requests against the current step', () => {
    const page = fakePage()
    const records = []
    let step = 0
    attachErrorCollectors(page, { origin: 'http://127.0.0.1:1', getStep: () => step, record: (s, m) => records.push([s, m]) })
    page.emit('console', { type: () => 'warning', text: () => 'ignored' })
    page.emit('console', { type: () => 'error', text: () => 'boom' })
    step = 3
    page.emit('pageerror', new Error('kaput'))
    page.emit('requestfailed', { url: () => 'http://127.0.0.1:1/a.js' })
    page.emit('requestfailed', { url: () => 'https://other.test/a.js' })
    page.emit('response', { url: () => 'http://127.0.0.1:1/b.js', status: () => 500 })
    expect(records).toEqual([
      [0, 'console.error: boom'],
      [3, 'uncaught error: kaput'],
      [3, 'request failed: http://127.0.0.1:1/a.js'],
      [3, 'HTTP 500: http://127.0.0.1:1/b.js'],
    ])
  })
})

describe('waitForStepIndex', () => {
  it('waits with a bounded timeout and passes when the index appears', async () => {
    const page = fakePage()
    await waitForStepIndex(page, 2, 1234)
    expect(page.timeouts).toEqual([1234])
  })

  it('fails with the offending step when a transition stalls', async () => {
    const page = fakePage()
    page.stall = true
    const failure = await waitForStepIndex(page, 4, 50, 'deck').catch((error) => error)
    expect(failure).toBeInstanceOf(VerifyFailure)
    expect(failure).toMatchObject({ phase: 'render', step: 4 })
    expect(failure.message).toMatch(/deck: transition did not advance to step index 4/)
  })
})
