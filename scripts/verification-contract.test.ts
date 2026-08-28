// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { canonicalSteps, validateReferenceSample } from './verify-contract.mjs'

describe('reference verification contract', () => {
  test('accepts the registered canonical sample and rejects malformed order', () => {
    const source = `export const presentationRegistry = [{ slug: 'how-to-make-a-presentation' }]
      const STEPS = ${JSON.stringify(canonicalSteps)}`

    expect(validateReferenceSample(source)).toEqual([])
    expect(validateReferenceSample(source.replace(canonicalSteps[0].title, 'Different title'))).toEqual([
      'reference sample step 1 has an unexpected title or caption',
    ])
  })
})
