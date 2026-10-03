// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EvolvingScene } from './how-to-make-a-presentation/steps/EvolvingScene'

afterEach(cleanup)

describe('reference scene continuity', () => {
  it('keeps each accumulated step card as a stable scene-kit box', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const view = render(<EvolvingScene payload={{ through: 3 }} />)
    const firstCard = document.querySelector('[data-entity-id="ref-card-1"]')
    expect(firstCard?.hasAttribute('data-presentation-box')).toBe(true)
    expect(document.querySelectorAll('[data-entity-id^="ref-card-"]')).toHaveLength(1)

    view.rerender(<EvolvingScene payload={{ through: 4 }} />)
    expect(document.querySelector('[data-entity-id="ref-card-1"]')).toBe(firstCard)
    expect(document.querySelectorAll('[data-entity-id^="ref-card-"]')).toHaveLength(2)
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  }, 15000)
})
