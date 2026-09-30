import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { PresentationLoadBoundary } from './AppRouter'
import { loadPresentationModule, resetPresentationModule } from './presentationLoader'
import type { PresentationEntry } from './presentations'

afterEach(cleanup)

describe('PresentationRoute', () => {
  test('shows a recoverable fallback when a presentation render fails', () => {
    let broken = true
    const retry = vi.fn(() => { broken = false })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenPresentation() {
      if (broken) throw new Error('stale chunk')
      return <p>Recovered presentation</p>
    }

    render(<PresentationLoadBoundary onRetry={retry}><BrokenPresentation /></PresentationLoadBoundary>)

    expect(screen.getByRole('alert').textContent).toContain('Unable to load this presentation.')
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading presentation' }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Recovered presentation')).toBeTruthy()
    consoleError.mockRestore()
  })

  test('drops failed cached presentation modules so loading can retry', () => {
    const firstLoad = Promise.resolve({ default: (() => null) as ComponentType })
    const secondLoad = Promise.resolve({ default: (() => null) as ComponentType })
    const entry: PresentationEntry = {
      slug: 'broken',
      title: 'Broken',
      load: vi.fn()
        .mockReturnValueOnce(firstLoad)
        .mockReturnValueOnce(secondLoad),
    }

    expect(loadPresentationModule(entry)).toBe(firstLoad)
    expect(loadPresentationModule(entry)).toBe(firstLoad)
    resetPresentationModule(entry)
    expect(loadPresentationModule(entry)).toBe(secondLoad)
    expect(entry.load).toHaveBeenCalledTimes(2)
  })
})
