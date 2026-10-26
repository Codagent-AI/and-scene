// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { canonicalSteps, validateRenderedStep } from './verify-contract.mjs'

describe('reference verification contract', () => {
  test('accepts public chrome for a canonical step and rejects malformed content', () => {
    expect(validateRenderedStep(canonicalSteps[0], canonicalSteps[0], 0)).toBeNull()
    expect(validateRenderedStep(canonicalSteps[0], { ...canonicalSteps[0], title: 'Different title' }, 0)).toContain('expected title')
  })
})
