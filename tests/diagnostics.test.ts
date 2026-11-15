import { it, expect } from 'vitest'
import { validateStep } from '../scripts/verify.mjs'
import reference from '../scripts/reference-outline.json'
it('I-37 malformed reference metadata cannot pass validation', () => {
  for (const field of ['title', 'caption', 'era']) expect(() => validateStep({ ...reference[0], [field]: undefined }, reference[0], 0)).toThrow(field)
  expect(() => validateStep(reference[1], reference[0], 0)).toThrow('step 0')
})
