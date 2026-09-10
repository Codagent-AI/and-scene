import { expect, test } from 'vitest'
import { canonicalSteps, findCanonicalStepEnd, validateReferenceSample } from './reference-sample.mjs'

const registration = {
  slug: 'how-to-make-a-presentation',
  title: 'How to Use This Skill to Make a Presentation',
}

test('accepts the registered canonical reference sample in order', () => {
  expect(() => validateReferenceSample([registration], canonicalSteps)).not.toThrow()
})

test('reports the precise missing canonical step', () => {
  expect(() => validateReferenceSample([registration], canonicalSteps.slice(0, -1))).toThrow('reference sample step 9')
})

test('does not resume source validation after a missing canonical field', () => {
  const [era, title, caption] = canonicalSteps[0]
  expect(findCanonicalStepEnd(`${era}\n${caption}\n${title}`, [era, title, caption], -1)).toBe(-1)
})
