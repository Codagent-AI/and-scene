import { describe, expect, it } from 'vitest'
import { FINAL_DWELL_MS, SETTLE_MS, VerifyError, renderPresentation } from '../../scripts/lib/render.mjs'

const STEPS = 9

/**
 * A browser page on a virtual clock. `sleep` advances time, and `faults` maps a step number to
 * delays (ms after that step renders) at which the page raises a console error.
 */
function fakeBrowser(faults = {}) {
  let now = 0
  let index = 0
  const handlers = {}
  const pending = []
  const emit = (event, payload) => handlers[event]?.(payload)
  const enter = (step) => {
    index = step
    for (const delay of faults[step + 1] ?? []) pending.push({ at: now + delay, text: `late fault ${delay}ms into step ${step + 1}` })
  }
  const sleep = async (ms) => {
    now += ms
    const due = pending.filter((f) => f.at <= now)
    for (const fault of due) pending.splice(pending.indexOf(fault), 1)
    for (const fault of due) emit('console', { type: () => 'error', text: () => fault.text })
  }
  const attrs = () => ({ 'data-step-count': String(STEPS), 'data-presentation-mode': 'browse', 'data-step-index': String(index) })
  const page = {
    on: (event, fn) => (handlers[event] = fn),
    goto: async () => enter(0),
    locator: () => ({ waitFor: async () => {}, getAttribute: async (name) => attrs()[name], textContent: async () => '' }),
    keyboard: { press: async (key) => key === 'ArrowRight' && enter(index + 1) },
    waitForFunction: async () => {},
    close: async () => {},
  }
  return { browser: { newPage: async () => page }, sleep }
}

const render = ({ browser, sleep }) => renderPresentation(browser, 'http://127.0.0.1:1', 'talk', null, { sleep })

describe('renderPresentation error window', () => {
  it('passes a presentation that raises no errors', async () => {
    await expect(render(fakeBrowser())).resolves.toBeUndefined()
  })

  it('fails on a fault raised after the last step has settled, naming that step', async () => {
    const lateMs = SETTLE_MS + 400
    expect(lateMs).toBeLessThan(SETTLE_MS + FINAL_DWELL_MS)
    const error = await render(fakeBrowser({ [STEPS]: [lateMs] })).catch((e) => e)
    expect(error).toBeInstanceOf(VerifyError)
    expect(error.phase).toBe('render')
    expect(error.step).toBe(STEPS)
    expect(error.message).toContain('late fault')
  })

  it('names the step whose own window raised the fault', async () => {
    const error = await render(fakeBrowser({ 4: [500] })).catch((e) => e)
    expect(error).toBeInstanceOf(VerifyError)
    expect(error.step).toBe(4)
  })
})
