import { render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { Landing } from './Landing.tsx'
import { PRESENTATIONS, type PresentationEntry } from './presentations/index.ts'
import { Router } from './Router.tsx'

function entries() {
  const loaders = { alpha: vi.fn(), beta: vi.fn() }
  const registry: PresentationEntry[] = (['alpha', 'beta'] as const).map((slug) => ({
    slug,
    title: `Title ${slug}`,
    load: () => {
      loaders[slug]()
      return Promise.resolve({ default: () => <p>presentation {slug}</p> })
    },
  }))
  return { registry, loaders }
}

describe('Router', () => {
  it('shows the landing page at the root and for unknown paths without loading anything', () => {
    const { registry, loaders } = entries()
    for (const pathname of ['/', '', '/nope', '/alpha/extra']) {
      const view = render(<Router registry={registry} pathname={pathname} />)
      expect(screen.getByRole('heading', { name: 'Presentations' })).toBeTruthy()
      view.unmount()
    }
    expect(loaders.alpha).not.toHaveBeenCalled()
    expect(loaders.beta).not.toHaveBeenCalled()
  })

  it('lazy-loads the presentation matching each slug', async () => {
    const { registry, loaders } = entries()
    for (const slug of ['alpha', 'beta'] as const) {
      const view = render(<Router registry={registry} pathname={`/${slug}`} />)
      expect(await screen.findByText(`presentation ${slug}`)).toBeTruthy()
      view.unmount()
    }
    expect(loaders.alpha).toHaveBeenCalledTimes(1)
    expect(loaders.beta).toHaveBeenCalledTimes(1)
  })

  it('accepts a trailing slash', async () => {
    const { registry } = entries()
    render(<Router registry={registry} pathname="/beta/" />)
    await waitFor(() => expect(screen.getByText('presentation beta')).toBeTruthy())
  })
})

describe('Landing', () => {
  it('links every registry entry exactly once to its route', () => {
    const { registry } = entries()
    render(<Landing registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Title alpha', '/alpha'],
      ['Title beta', '/beta'],
    ])
    const real = render(<Landing registry={PRESENTATIONS} />)
    expect(real.container.querySelector('a[href="/how-to-make-a-presentation"]')).not.toBeNull()
  })
})

describe('registry and entry point', () => {
  it('lists explicit entries with unique slugs whose loaders resolve to a component', async () => {
    expect(new Set(PRESENTATIONS.map((p) => p.slug)).size).toBe(PRESENTATIONS.length)
    for (const entry of PRESENTATIONS) {
      expect(entry.title.length).toBeGreaterThan(0)
      expect(typeof (await entry.load()).default).toBe('function')
    }
  })

  it('registers presentations explicitly, without globbing or a router dependency', () => {
    const registry = readFileSync(path.join(import.meta.dirname, 'presentations', 'index.ts'), 'utf8')
    expect(registry).not.toContain('import.meta.glob')
    const manifest = JSON.parse(readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8'))
    expect(Object.keys(manifest.dependencies)).not.toContain('react-router-dom')
    expect(readFileSync(path.join(import.meta.dirname, 'Router.tsx'), 'utf8')).toMatch(/lazy\(/)
  })

  it('renders the router inside StrictMode from main.tsx', () => {
    const main = readFileSync(path.join(import.meta.dirname, 'main.tsx'), 'utf8')
    expect(main).toMatch(/<StrictMode>\s*<Router[^>]*registry=\{PRESENTATIONS\}[\s\S]*<\/StrictMode>/)
  })
})
