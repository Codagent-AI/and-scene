// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Landing } from './Landing'
import { lazyPresentations, resolveRoute, type PresentationEntry } from './registry'
import { Router } from './Router'

function fakeEntry(slug: string, label: string) {
  const load = vi.fn(async () => ({ default: (() => <p data-testid={`mounted-${slug}`}>{label}</p>) as ComponentType }))
  const entry: PresentationEntry = { slug, title: `Title ${slug}`, load }
  return { entry, load }
}

describe('route resolution', () => {
  const alpha = fakeEntry('alpha', 'Alpha')
  const beta = fakeEntry('beta', 'Beta')
  const registry = [alpha.entry, beta.entry]

  it('maps the root to Landing', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
  })

  it('maps each known slug to its own entry, with or without a trailing slash', () => {
    expect(resolveRoute('/alpha', registry)).toEqual({ kind: 'presentation', entry: alpha.entry })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: beta.entry })
  })

  it('maps unknown paths to Landing', () => {
    expect(resolveRoute('/missing', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha/extra', registry)).toEqual({ kind: 'landing' })
  })
})

describe('Router', () => {
  it('renders Landing with links that match the registry exactly', () => {
    const { entry } = fakeEntry('alpha', 'Alpha')
    const { entry: other } = fakeEntry('beta', 'Beta')
    render(<Landing registry={[entry, other]} />)
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(links).toEqual(['/alpha', '/beta'])
  })

  it('renders Landing on unknown paths and mounts no presentation', () => {
    const alpha = fakeEntry('alpha', 'Alpha')
    const beta = fakeEntry('beta', 'Beta')
    render(<Router pathname="/nope" registry={[alpha.entry, beta.entry]} components={lazyPresentations([alpha.entry, beta.entry])} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(alpha.load).not.toHaveBeenCalled()
    expect(beta.load).not.toHaveBeenCalled()
  })

  it('lazily loads only the matched presentation and mounts it', async () => {
    const alpha = fakeEntry('alpha', 'Alpha')
    const beta = fakeEntry('beta', 'Beta')
    await act(async () => {
      render(<Router pathname="/beta" registry={[alpha.entry, beta.entry]} components={lazyPresentations([alpha.entry, beta.entry])} />)
    })
    expect(beta.load).toHaveBeenCalledTimes(1)
    expect(alpha.load).not.toHaveBeenCalled()
    expect(await screen.findByTestId('mounted-beta')).toBeTruthy()
    expect(screen.queryByTestId('mounted-alpha')).toBeNull()
  })

  it('shows a loading fallback while a presentation module is pending', async () => {
    let resolveLoad: (value: { default: ComponentType }) => void = () => {}
    const pending: PresentationEntry = {
      slug: 'slow',
      title: 'Slow',
      load: () => new Promise((resolve) => (resolveLoad = resolve)),
    }
    await act(async () => {
      render(<Router pathname="/slow" registry={[pending]} components={lazyPresentations([pending])} />)
    })
    expect(screen.getByRole('status').textContent).toContain('Loading')
    await act(async () => {
      resolveLoad({ default: () => <p>loaded</p> })
    })
    await waitFor(() => expect(screen.getByText('loaded')).toBeTruthy())
  })
})
