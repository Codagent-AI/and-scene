import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Landing } from '../Landing'
import { PRESENTATIONS } from '../presentations'
import type { PresentationEntry } from '../presentations/types'
import { createRouter } from '../Router'
import { resolveRoute } from '../router'

const entry = (slug: string, text = slug): PresentationEntry => ({
  slug,
  title: `Title of ${slug}`,
  load: async () => ({ default: () => <p>presentation {text}</p> }),
})
const registry = [entry('alpha'), entry('beta')]

describe('resolveRoute', () => {
  it.each([
    ['/', 'landing'],
    ['', 'landing'],
    ['/alpha', 'alpha'],
    ['/alpha/', 'alpha'],
    ['/beta', 'beta'],
    ['/gamma', 'landing'],
    ['/Alpha', 'landing'],
    ['/alpha/extra', 'landing'],
  ])('%j -> %s', (path, expected) => {
    const route = resolveRoute(path, registry)
    expect(route.kind === 'landing' ? 'landing' : route.entry.slug).toBe(expected)
  })
})

describe('Router', () => {
  it('shows Landing at / and for unknown paths', () => {
    const Router = createRouter(registry)
    const { unmount } = render(<Router pathname="/" />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
    unmount()
    render(<Router pathname="/nope" />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
  })

  it('lazy-loads the matching presentation and renders its component, not another', async () => {
    const Router = createRouter(registry)
    render(<Router pathname="/beta/" />)
    expect(await screen.findByText('presentation beta')).toBeTruthy()
    expect(screen.queryByText('presentation alpha')).toBeNull()
  })

  it('does not load a presentation until its route is visited', async () => {
    let loads = 0
    const lazyEntry: PresentationEntry = {
      slug: 'lazy',
      title: 'Lazy',
      load: async () => {
        loads += 1
        return { default: () => <p>lazy ready</p> }
      },
    }
    const Router = createRouter([lazyEntry])
    render(<Router pathname="/" />)
    expect(loads).toBe(0)
    render(<Router pathname="/lazy" />)
    expect(await screen.findByText('lazy ready')).toBeTruthy()
    expect(loads).toBe(1)
  })
})

describe('registry', () => {
  it('is an explicit list of unique complete entries', () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of PRESENTATIONS) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(typeof p.load).toBe('function')
    }
  })

  it('has loaders that each resolve a renderable default presentation', async () => {
    for (const p of PRESENTATIONS) {
      const module = await p.load()
      expect(typeof module.default, p.slug).toBe('function')
    }
  })

  it('registers lazily and without globbing', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/presentations/index.ts'), 'utf8')
    expect(source).not.toMatch(/import\.meta\.glob/)
    expect(source).not.toMatch(/^import .* from '\.\/[^']+\/Talk'/m)
    expect((source.match(/load: \(\) => import\(/g) ?? []).length).toBe(PRESENTATIONS.length)
  })

  it('lists every registered route on Landing', () => {
    render(<Landing registry={PRESENTATIONS} />)
    for (const p of PRESENTATIONS) {
      const link = screen.getByRole('link', { name: p.title })
      expect(link.getAttribute('href')).toBe(`/${p.slug}`)
    }
    expect(screen.getAllByRole('link')).toHaveLength(PRESENTATIONS.length)
  })
})

describe('app entry', () => {
  it('keeps StrictMode around the router', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8')
    expect(main).toMatch(/<StrictMode>[\s\S]*<Router[\s\S]*<\/StrictMode>/)
  })
})
