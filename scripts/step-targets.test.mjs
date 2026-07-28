import { describe, expect, it } from 'vitest'
import { resolveTargetSteps, screenshotFileName } from './step-targets.mjs'

describe('resolveTargetSteps', () => {
  it('defaults to every step when none were requested', () => {
    expect(resolveTargetSteps(null, 3)).toEqual([0, 1, 2])
  })

  it('sorts requested steps ascending so the forward-only walk cannot fall behind', () => {
    expect(resolveTargetSteps([8, 0, 4], 9)).toEqual([0, 4, 8])
  })

  it('drops duplicates rather than capturing the same step twice', () => {
    expect(resolveTargetSteps([2, 2, 1], 3)).toEqual([1, 2])
  })

  it('rejects out-of-range indices instead of mislabelling a capture', () => {
    expect(() => resolveTargetSteps([0, 9], 9)).toThrow(/out of range/i)
    expect(() => resolveTargetSteps([-1], 9)).toThrow(/out of range/i)
  })

  it('rejects an empty step selection', () => {
    expect(() => resolveTargetSteps([], 9)).toThrow(/no valid step/i)
  })

  it('rejects a presentation that reports an unusable step count', () => {
    expect(() => resolveTargetSteps(null, 0)).toThrow(/step-count/i)
    expect(() => resolveTargetSteps(null, Number.NaN)).toThrow(/step-count/i)
  })
})

describe('screenshotFileName', () => {
  it('names desktop captures by zero-padded step index', () => {
    expect(screenshotFileName(0, false)).toBe('step-00.png')
    expect(screenshotFileName(8, false)).toBe('step-08.png')
  })

  it('keeps narrow captures from overwriting the desktop ones', () => {
    expect(screenshotFileName(8, true)).toBe('step-08-narrow.png')
    expect(screenshotFileName(8, true)).not.toBe(screenshotFileName(8, false))
  })
})
