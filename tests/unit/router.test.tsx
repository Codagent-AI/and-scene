import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Landing from '../../src/Landing.tsx'
import type { PresentationEntry } from '../../src/presentations/index.ts'
import { resolveRoute } from '../../src/resolveRoute.ts'
import { Router } from '../../src/router.tsx'

const make = (slug: string): PresentationEntry => ({
  slug,
  title: `Title of ${slug}`,
  load: async () => ({ default: () => <p data-testid="talk">talk {slug}</p> }),
})
const registry = [make('alpha'), make('beta')]

describe('route resolution', () => {
  it('maps / to Landing and each slug to its own entry, tolerating slashes', () => {
    expect(resolveRoute('/', registry)).toBeNull()
    expect(resolveRoute('/alpha', registry)).toBe(registry[0])
    expect(resolveRoute('/beta/', registry)).toBe(registry[1])
  })
  it('falls back to Landing for unknown paths (pinned behavior)', () => {
    expect(resolveRoute('/nope', registry)).toBeNull()
    expect(resolveRoute('/alpha/extra', registry)).toBeNull()
  })
})

describe('Router', () => {
  it('renders Landing at / listing every presentation', () => {
    render(<Router pathname="/" registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/alpha', '/beta'])
    expect(links.map((l) => l.textContent)).toEqual(['Title of alpha', 'Title of beta'])
  })

  it('lazy-loads the matching presentation inside Suspense, not another one', async () => {
    render(<Router pathname="/beta" registry={registry} />)
    await waitFor(() => expect(screen.getByTestId('talk').textContent).toBe('talk beta'))
  })

  it('shows Landing, never a blank page or a presentation, for an unknown route', () => {
    render(<Router pathname="/missing" registry={registry} />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).not.toBeNull()
    expect(screen.queryByTestId('talk')).toBeNull()
  })

  it('keeps earlier routes working after a new entry is added', async () => {
    const extended = [...registry, make('gamma')]
    for (const entry of extended) {
      expect(resolveRoute(`/${entry.slug}`, extended)).toBe(entry)
    }
    render(<Router pathname="/gamma" registry={extended} />)
    await waitFor(() => expect(screen.getByTestId('talk').textContent).toBe('talk gamma'))
  })
})

describe('Landing', () => {
  it('lists an empty registry without links', () => {
    render(<Landing registry={[]} />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})
