import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Landing } from '../Landing'
import { PRESENTATIONS, type PresentationEntry } from '../presentations'
import { Router } from '../Router'
import { resolveRoute } from '../route'

afterEach(cleanup)

function entry(slug: string, title: string): PresentationEntry {
  return {
    slug,
    title,
    load: async () => ({ default: () => <div data-testid={`loaded-${slug}`}>{title}</div> }),
  }
}

const registry = [entry('alpha', 'Alpha Talk'), entry('beta', 'Beta Talk'), entry('gamma', 'Gamma Talk')]

describe('resolveRoute', () => {
  it('sends / to the landing page', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
  })

  it('resolves each registered slug, tolerating slashes', () => {
    for (const e of registry) {
      for (const path of [`/${e.slug}`, `/${e.slug}/`]) {
        expect(resolveRoute(path, registry)).toEqual({ kind: 'presentation', entry: e })
      }
    }
  })

  it('falls back to landing for unknown paths', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha/extra', registry)).toEqual({ kind: 'landing' })
  })
})

describe('Router', () => {
  it('renders the landing page listing every entry with its href', () => {
    render(<Router pathname="/" registry={registry} />)
    for (const e of registry) {
      const link = screen.getByRole('link', { name: e.title })
      expect(link.getAttribute('href')).toBe(`/${e.slug}`)
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('lazy-loads the matching presentation for each slug', async () => {
    for (const e of registry) {
      let view!: ReturnType<typeof render>
      await act(async () => {
        view = render(<Router pathname={`/${e.slug}`} registry={registry} />)
      })
      expect((await screen.findByTestId(`loaded-${e.slug}`)).textContent).toBe(e.title)
      view.unmount()
    }
  })

  it('shows the landing page for unknown routes', () => {
    render(<Router pathname="/missing" registry={registry} />)
    expect(screen.getByRole('heading', { name: 'And Scene' })).toBeTruthy()
  })

  it('renders Landing for the committed registry', () => {
    render(<Landing registry={PRESENTATIONS} />)
    expect(screen.getAllByRole('link')).toHaveLength(PRESENTATIONS.length)
  })
})
