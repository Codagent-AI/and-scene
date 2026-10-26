import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Scene } from './Scene'
import { STEPS } from './index'

afterEach(() => {
  vi.restoreAllMocks()
})

/** Renders one canonical step's payload through the shared Scene. */
function renderStep(id: string) {
  const step = STEPS.find((candidate) => candidate.id === id)
  if (!step) throw new Error(`no canonical step with id "${id}"`)
  return render(<Scene payload={step.payload} active />)
}

describe('how-to-make-a-presentation Scene', () => {
  it('renders every canonical step without duplicate React keys', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

    for (const step of STEPS) {
      render(<Scene payload={step.payload} active />)
    }

    const duplicateKeyWarnings = errors.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => message.includes('same key'))
    expect(duplicateKeyWarnings).toEqual([])
  })

  it('draws the ghost card and its dashed gate link as distinct entities on "you set the depth"', () => {
    const { container } = renderStep('you-set-the-depth')

    expect(container.querySelector('.ahs-card--ghost')).not.toBeNull()
    const gateLink = container.querySelector('.ahs-card-link--dashed')
    expect(gateLink).not.toBeNull()
    expect(gateLink?.textContent).toBe('gate')
  })
})
