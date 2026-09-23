import { describe, expect, it } from 'vitest'
import { parseActiveStepIndex } from '../active-step-index.mjs'

describe('active step hook validation', () => {
  it('rejects a missing or malformed active-step attribute', () => {
    expect(() => parseActiveStepIndex(null, 1)).toThrow('step 1: missing or invalid data-step-index')
    expect(() => parseActiveStepIndex('NaN', 1)).toThrow('step 1: missing or invalid data-step-index')
  })

  it('parses a valid non-negative integer hook', () => {
    expect(parseActiveStepIndex('0', 1)).toBe(0)
    expect(parseActiveStepIndex('8', 9)).toBe(8)
  })
})
