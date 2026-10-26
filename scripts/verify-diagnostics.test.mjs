import { describe, expect, it } from 'vitest'
import {
  describeDetachedChrome,
  formatStepLocation,
  readStepIndexSafely,
} from './verify-diagnostics.mjs'

describe('formatStepLocation', () => {
  // spec: presentation-verification "Console or page error fails verification"
  // — failure must identify the failing step, not just the presentation.
  it('names the presentation and the step', () => {
    expect(formatStepLocation('how-to-make-a-presentation', 4)).toBe(
      '/how-to-make-a-presentation step 4',
    )
  })

  it('keeps step 0 explicit rather than falsy-blank', () => {
    expect(formatStepLocation('demo', 0)).toBe('/demo step 0')
  })
})

describe('readStepIndexSafely', () => {
  it('returns the parsed step index when the chrome is present', async () => {
    const chrome = { getAttribute: async () => '3' }
    expect(await readStepIndexSafely(chrome)).toBe(3)
  })

  // spec: "Step error fails verification" — a crashed step detaches the chrome.
  // Inheriting Playwright's 30s auto-wait buries the real page error under an
  // opaque locator timeout, so the read must be bounded and must not throw.
  it('returns null instead of throwing when the chrome has detached', async () => {
    const chrome = {
      getAttribute: async () => {
        throw new Error('locator.getAttribute: Timeout 30000ms exceeded.')
      },
    }
    expect(await readStepIndexSafely(chrome)).toBeNull()
  })

  it('bounds the read with an explicit short timeout', async () => {
    const seen = []
    const chrome = {
      getAttribute: async (name, options) => {
        seen.push({ name, options })
        return '0'
      },
    }
    await readStepIndexSafely(chrome, 1500)
    expect(seen).toHaveLength(1)
    expect(seen[0].name).toBe('data-step-index')
    expect(seen[0].options.timeout).toBe(1500)
  })

  it('defaults to a timeout far below Playwright’s 30s auto-wait', async () => {
    const seen = []
    const chrome = {
      getAttribute: async (name, options) => {
        seen.push(options)
        return '0'
      },
    }
    await readStepIndexSafely(chrome)
    expect(seen[0].timeout).toBeGreaterThan(0)
    expect(seen[0].timeout).toBeLessThanOrEqual(5000)
  })

  it('treats a non-numeric attribute as unreadable', async () => {
    const chrome = { getAttribute: async () => null }
    expect(await readStepIndexSafely(chrome)).toBeNull()
  })

  // Number('') and Number('  ') are both 0, which would sail past a plain
  // Number.isInteger guard and read as a valid step 0.
  it.each(['', '   ', '\n', '1.5', '-1', '0x2', 'abc', '+3'])(
    'rejects the malformed step index %j instead of coercing it',
    async (raw) => {
      const chrome = { getAttribute: async () => raw }
      expect(await readStepIndexSafely(chrome)).toBeNull()
    },
  )

  it('still accepts well-formed indices', async () => {
    for (const raw of ['0', '7', '12']) {
      const chrome = { getAttribute: async () => raw }
      expect(await readStepIndexSafely(chrome)).toBe(Number(raw))
    }
  })
})

describe('describeDetachedChrome', () => {
  it('identifies the failing step and points at a render crash', () => {
    const message = describeDetachedChrome('how-to-make-a-presentation', 4)
    expect(message).toContain('/how-to-make-a-presentation step 4')
    expect(message).toMatch(/crash/i)
  })
})
