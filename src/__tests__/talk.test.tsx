import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../presentation-kit', () => ({
  Presentation: ({ title, designSize }: { title: string; designSize?: { width: number; height: number } }) => (
    <div data-testid="presentation" data-design-size={designSize ? `${designSize.width}x${designSize.height}` : 'default'}>{title}</div>
  ),
}))

import Talk from '../presentations/how-to-make-a-presentation/Talk'

describe('reference presentation responsiveness', () => {
  it('uses the default design size when matchMedia is unavailable', () => {
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined })
    try {
      render(<Talk />)
      expect(screen.getByTestId('presentation')).toHaveAttribute('data-design-size', 'default')
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
    }
  })
})
