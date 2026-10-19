// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Landing from '../../src/Landing.tsx'
import Router from '../../src/Router.tsx'
import { PRESENTATIONS } from '../../src/presentations/index.ts'
import type { PresentationEntry } from '../../src/presentations/index.ts'

// Suspense + use() resolve through microtasks, so mount inside an async act.
async function mount(ui: ReactElement) {
  let view!: ReturnType<typeof render>
  await act(async () => {
    view = render(ui)
  })
  return view
}

const entry = (slug: string, title: string, text: string): PresentationEntry & { load: ReturnType<typeof vi.fn> } => ({
  slug,
  title,
  load: vi.fn(async () => ({ default: () => <div data-testid="talk">{text}</div> })),
})

describe('router', () => {
  it('shows Landing at the root and for unknown paths', () => {
    const a = entry('a', 'Alpha', 'A talk')
    for (const path of ['/', '', '/nope', '/a/extra']) {
      const { unmount } = render(<Router pathname={path} entries={[a]} />)
      expect(screen.getByText('Alpha').getAttribute('href')).toBe('/a')
      expect(screen.queryByTestId('talk')).toBeNull()
      unmount()
    }
    expect(a.load).not.toHaveBeenCalled()
  })

  it('lazy-loads only the matching presentation for each slug', async () => {
    const a = entry('a', 'Alpha', 'A talk')
    const b = entry('b', 'Beta', 'B talk')
    const { unmount } = await mount(<Router pathname="/b" entries={[a, b]} />)
    await waitFor(() => expect(screen.getByTestId('talk').textContent).toBe('B talk'))
    expect(a.load).not.toHaveBeenCalled()
    expect(b.load).toHaveBeenCalledTimes(1)
    unmount()
    await mount(<Router pathname="/a/" entries={[a, b]} />)
    await waitFor(() => expect(screen.getByTestId('talk').textContent).toBe('A talk'))
  })

  it('registers presentations as an explicit array with unique slugs and lazy loaders', () => {
    expect(new Set(PRESENTATIONS.map((p) => p.slug)).size).toBe(PRESENTATIONS.length)
    for (const p of PRESENTATIONS) {
      expect(typeof p.title).toBe('string')
      expect(p.load).toBeInstanceOf(Function)
    }
  })

  it('loads and routes every registered presentation', async () => {
    for (const p of PRESENTATIONS) {
      const { container, unmount } = await mount(<Router pathname={`/${p.slug}`} />)
      await waitFor(() => expect(container.querySelector('[data-step-count]')).not.toBeNull(), { timeout: 15000 })
      unmount()
    }
  })
})

describe('Landing', () => {
  it('links every registry entry once, and a new entry adds a link without code changes', () => {
    const base = [entry('a', 'Alpha', ''), entry('b', 'Beta', '')]
    const { rerender } = render(<Landing entries={base} />)
    expect(screen.getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([['Alpha', '/a'], ['Beta', '/b']])
    rerender(<Landing entries={[...base, entry('c', 'Gamma', '')]} />)
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByText('Gamma').getAttribute('href')).toBe('/c')
  })
})
