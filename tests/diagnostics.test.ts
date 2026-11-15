import { it, expect, vi } from 'vitest'
import { validateStep } from '../scripts/verify.mjs'
import { visitSteps } from '../scripts/browser-session.mjs'
import reference from '../scripts/reference-outline.json'
it('I-37 malformed reference metadata cannot pass validation', () => {
  for (const field of ['title', 'caption', 'era']) expect(() => validateStep({ ...reference[0], [field]: undefined }, reference[0], 0)).toThrow(field)
  expect(() => validateStep(reference[1], reference[0], 0)).toThrow('step 0')
})

it('I-37 invalid public step counts fail before traversal or capture', async () => {
  for (const count of ['0', '-1', '1.5', 'NaN', '8', '10', null]) {
    const callback = vi.fn()
    const page = {
      on: vi.fn(), goto: vi.fn().mockResolvedValue(undefined),
      locator: () => ({ waitFor: vi.fn().mockResolvedValue(undefined), getAttribute: vi.fn().mockResolvedValue(count) }),
      keyboard: { press: vi.fn() }, waitForTimeout: vi.fn(),
    }
    await expect(visitSteps(page, 'http://127.0.0.1/sample', callback, { expectedCount: 9 })).rejects.toThrow(/render: step 0: sample: invalid step count/)
    expect(callback).not.toHaveBeenCalled()
    expect(page.keyboard.press).not.toHaveBeenCalled()
    expect(page.waitForTimeout).not.toHaveBeenCalled()
  }
})
