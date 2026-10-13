import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
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
it.each(['/demo/', '/demo///'])('loads a presentation from trailing-slash route %s', async pathname => {
  const entries = [{ slug: 'demo', title: 'Demo', load: async () => ({ default: () => <div>Trailing slash presentation</div> }) }]
  render(<Host pathname={pathname} entries={entries} />)
  expect(await screen.findByText('Trailing slash presentation')).toBeInTheDocument()
})

it('recovers from a rejected lazy import and allows navigating to another presentation', async () => {
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const entries = [
      { slug: 'broken', title: 'Broken', load: async () => { throw new Error('Chunk unavailable') } },
      { slug: 'working', title: 'Working', load: async () => ({ default: () => <div>Working presentation</div> }) },
    ]
    const { rerender } = render(<Host pathname="/broken" entries={entries} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to open this presentation')
    expect(screen.getByRole('link', { name: 'Back to presentations' })).toHaveAttribute('href', '/')
    rerender(<Host pathname="/working" entries={entries} />)
    expect(await screen.findByText('Working presentation')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<Host pathname="/" entries={entries} />)
    expect(screen.getByRole('link', { name: 'Working' })).toHaveAttribute('href', '/working')
  } finally { logged.mockRestore() }
})

it('contains render errors when a presentation step list becomes empty', async () => {
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const { Presentation } = await import('../src/presentation-kit/Presentation')
    function AsyncPresentation() {
      const [empty, setEmpty] = useState(false)
      return <>
        <button onClick={() => setEmpty(true)}>Clear steps</button>
        <Presentation title="Async presentation" steps={empty ? [] : [{ id: 'one', era: 'begin', title: 'First', caption: 'Caption', Scene: () => <div>Initial scene</div>, payload: undefined }]} />
      </>
    }
    const entries = [{ slug: 'async', title: 'Async', load: async () => ({ default: AsyncPresentation }) }]
    const { rerender } = render(<Host pathname="/async" entries={entries} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Clear steps' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to open this presentation')
    expect(screen.getByRole('link', { name: 'Back to presentations' })).toHaveAttribute('href', '/')
    rerender(<Host pathname="/" entries={entries} />)
    expect(screen.getByRole('link', { name: 'Async' })).toBeInTheDocument()
  } finally { logged.mockRestore() }
})
