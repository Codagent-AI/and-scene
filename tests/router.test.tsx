import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Host } from '../src/Host'
import { Landing } from '../src/Landing'
import type { PresentationEntry } from '../src/presentations'

it('enumerates explicit registry entries as presentation links', () => {
  const entries: PresentationEntry[] = [{ slug: 'demo', title: 'Demo', load: async () => ({ default: () => <div>Loaded presentation</div> }) }]
  render(<Landing entries={entries} />)
  expect(screen.getByRole('link', { name: 'Demo' })).toHaveAttribute('href', '/demo')
  expect(screen.getByRole('link', { name: 'Demo' })).toHaveAttribute('data-presentation-link')
})
it('lazy-loads only the exact route, falling back for root and unknown paths', async () => {
  const load = vi.fn(async () => ({ default: () => <div>Loaded presentation</div> }))
  const entries = [{ slug: 'demo', title: 'Demo', load }]
  const { rerender } = render(<Host pathname="/" entries={entries} />)
  expect(load).not.toHaveBeenCalled()
  rerender(<Host pathname="/demo/nested" entries={entries} />)
  expect(load).not.toHaveBeenCalled()
  rerender(<Host pathname="/demo" entries={entries} />)
  expect(await screen.findByText('Loaded presentation')).toBeInTheDocument()
  expect(load).toHaveBeenCalledTimes(1)
})
it('provides an honest empty landing state', () => {
  render(<Landing entries={[]} />)
  expect(screen.getByText(/No presentations yet/)).toBeInTheDocument()
})
it('retains the loaded component instance on host rerenders', async () => {
  const entries: PresentationEntry[] = [{ slug: 'stable', title: 'Stable', load: async () => ({ default: () => <input aria-label="Draft" defaultValue="initial" /> }) }]
  const { rerender } = render(<Host pathname="/stable" entries={entries} />)
  const input = await screen.findByRole('textbox', { name: 'Draft' })
  rerender(<Host pathname="/stable" entries={entries} />)
  expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(input)
})
