import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { buildFixtureSteps } from './fixtures'

describe('step enumeration hooks', () => {
  it('exposes data-step-count and data-step-index for external verification', () => {
    const { container } = render(<Presentation steps={buildFixtureSteps(5)} title="Fixture" />)
    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-count', '5')
    expect(root).toHaveAttribute('data-step-index', '0')
  })
})
