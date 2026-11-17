import { StrictMode, Suspense, lazy, type ComponentType } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { PresentationErrorBoundary } from '../src/PresentationErrorBoundary'
import { Presentation } from '../src/presentation-kit'
beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
function expectRecovery() {
  expect(screen.getByRole('alert').textContent).toContain('This presentation could not be loaded.')
  expect(screen.getByRole('link', { name: 'Back to presentations' }).getAttribute('href')).toBe('/')
  // Caught errors must remain observable to the console-error verification gate.
  expect(console.error).toHaveBeenCalled()
}
it('R4 lazy import rejection renders an actionable fallback without hiding the error', async () => {
  const Failed = lazy(() => Promise.reject(new Error('chunk unavailable')))
  render(<StrictMode><PresentationErrorBoundary><Suspense fallback={<p>Loading presentation…</p>}><Failed /></Suspense></PresentationErrorBoundary></StrictMode>)
  await screen.findByRole('alert')
  expectRecovery()
})
it('R4 thrown presentation render shows the index recovery link', () => {
  function Broken(): never { throw new Error('scene failed to render') }
  render(<PresentationErrorBoundary><Broken /></PresentationErrorBoundary>)
  expectRecovery()
})
it('R4 empty Presentation steps is caught instead of blanking the app', () => {
  render(<PresentationErrorBoundary><Presentation title="Empty" steps={[]} /></PresentationErrorBoundary>)
  expectRecovery()
})
it('R4 normal lazy loading still shows Suspense and then the presentation', async () => {
  let complete: (module: { default: ComponentType }) => void = () => {}
  const promise = new Promise<{ default: ComponentType }>(resolve => { complete = resolve })
  const Page = lazy(() => promise)
  render(<PresentationErrorBoundary><Suspense fallback={<p>Loading presentation…</p>}><Page /></Suspense></PresentationErrorBoundary>)
  expect(screen.getByText('Loading presentation…')).toBeTruthy()
  await act(async () => { complete({ default: () => <p>Presentation ready</p> }) })
  expect(screen.getByText('Presentation ready')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
  expect(console.error).not.toHaveBeenCalled()
})
