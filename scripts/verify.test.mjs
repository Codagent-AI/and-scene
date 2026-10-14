import { describe, expect, it } from 'vitest'
import { EXPECTED_STEPS, PhaseError, assertOutlineOrder, formatReport } from './verify.mjs'

const source = EXPECTED_STEPS.map((s) => `{ title: "${s.title}", caption: "${s.caption}" }`).join('\n')

describe('assertOutlineOrder', () => {
  it('accepts titles and captions in order', () => {
    expect(() => assertOutlineOrder(source)).not.toThrow()
  })

  it('reports a missing title with its step', () => {
    const broken = source.replace('The deck grows', 'The deck shrinks')
    expect(() => assertOutlineOrder(broken)).toThrowError(/step 4 title.*missing/)
  })

  it('reports out-of-order steps', () => {
    const [a, b] = [EXPECTED_STEPS[0].title, EXPECTED_STEPS[1].title]
    const swapped = source.replace(a, '@@').replace(b, a).replace('@@', b)
    try {
      assertOutlineOrder(swapped)
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(PhaseError)
      expect(err.phase).toBe('sample')
      expect(err.message).toMatch(/out of order/)
    }
  })
})

describe('formatReport', () => {
  it('prints a PASS summary', () => {
    const out = formatReport([{ phase: 'build', ok: true, detail: 'fine' }])
    expect(out).toContain('PASS  build')
    expect(out).toContain('VERIFY PASS')
  })

  it('names the failed phase and step', () => {
    const out = formatReport([{ phase: 'render', ok: false }], new PhaseError('render', 'boom', 4))
    expect(out).toContain('VERIFY FAIL: phase "render" at step index 4: boom')
    expect(out).not.toContain('VERIFY PASS')
  })
})
