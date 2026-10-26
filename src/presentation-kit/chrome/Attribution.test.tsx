import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Attribution, ATTRIBUTION_URL } from './Attribution'

describe('Attribution', () => {
  it('renders a bottom-right link labeled "made by and-scene" pointing to the and-scene GitHub repository', () => {
    render(<Attribution />)
    const link = screen.getByRole('link', { name: /made by and-scene/i })
    expect(link).toHaveAttribute('href', ATTRIBUTION_URL)
  })

  it('points at the real and-scene repository, not a placeholder', () => {
    expect(ATTRIBUTION_URL).toBe('https://github.com/Codagent-AI/and-scene')
  })

  it('exposes a stable hook for presentation-owned styling', () => {
    render(<Attribution />)
    expect(screen.getByRole('link', { name: /made by and-scene/i })).toHaveAttribute(
      'data-presentation-attribution',
      'true',
    )
  })
})
