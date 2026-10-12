import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RouteErrorBoundary } from './RouteErrorBoundary'

function BrokenRoute(): never { throw new Error('chunk unavailable') }

describe('route error boundary', () => {
  it('shows a recovery link when a route throws during rendering', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      render(<RouteErrorBoundary><BrokenRoute /></RouteErrorBoundary>)
      expect(screen.getByRole('alert').textContent).toContain('Couldn’t load this presentation')
      expect(screen.getByRole('link', { name: 'Back to all presentations' }).getAttribute('href')).toBe('/')
    } finally {
      report.mockRestore()
    }
  })
})
