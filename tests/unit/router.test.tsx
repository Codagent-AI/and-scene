import { readFileSync } from 'node:fs'
import { Suspense, type ComponentType } from 'react'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Landing } from '../../src/Landing'
import { PRESENTATIONS, type PresentationEntry } from '../../src/presentations'
import { Router } from '../../src/router'

function deferred() {
  let resolve!: (c: { default: ComponentType }) => void
  const promise = new Promise<{ default: ComponentType }>((r) => (resolve = r))
  return { promise, resolve }
}

describe('Router', () => {
  const alpha = deferred()
  const beta = deferred()
  const registry: PresentationEntry[] = [
    { slug: 'alpha', title: 'Alpha Talk', load: () => alpha.promise },
    { slug: 'beta', title: 'Beta Talk', load: () => beta.promise },
  ]

  it.each(['/', '', '//', '/nope', '/alpha/extra', '/ALPHA'])('shows Landing for %j', (path) => {
    render(<Router pathname={path} registry={registry} />)
    expect(document.querySelector('[data-landing-list]')).not.toBeNull()
    expect(document.querySelector('[data-route-loading]')).toBeNull()
  })

  it('lazy-loads the matching presentation inside Suspense, tolerating a trailing slash', async () => {
    render(<Router pathname="/alpha/" registry={registry} />)
    expect(screen.getByText('Loading…')).toBeTruthy()
    expect(document.querySelector('[data-landing-list]')).toBeNull()
    await act(async () => alpha.resolve({ default: () => <p>ALPHA LOADED</p> }))
    expect(screen.getByText('ALPHA LOADED')).toBeTruthy()
    expect(screen.queryByText('BETA')).toBeNull()
  })

  it('loads the right entry for each slug', async () => {
    render(<Router pathname="/beta" registry={registry} />)
    await act(async () => beta.resolve({ default: () => <p>BETA LOADED</p> }))
    expect(screen.getByText('BETA LOADED')).toBeTruthy()
  })
})

describe('Landing', () => {
  it('links every registry entry to its own route', () => {
    const registry = PRESENTATIONS.map((p) => ({ ...p }))
    render(<Landing registry={registry} />)
    const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-landing-list] a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(registry.map((p) => `/${p.slug}`))
    expect(links.map((a) => a.textContent)).toEqual(registry.map((p) => p.title))
  })
})

describe('presentation registry', () => {
  it('has unique slugs and explicit entries, with no glob discovery', () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(readFileSync('src/presentations/index.ts', 'utf8')).not.toContain('import.meta.glob')
    for (const p of PRESENTATIONS) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
    }
  })

  it('resolves every entry to a component, including the committed sample', async () => {
    expect(PRESENTATIONS.map((p) => p.slug)).toContain('how-to-make-a-presentation')
    for (const p of PRESENTATIONS) {
      const mod = await p.load()
      expect(typeof mod.default).toBe('function')
    }
  })

  it('keeps earlier entries and their routes when another is added', async () => {
    const before = PRESENTATIONS.map((p) => p.slug)
    const added: PresentationEntry = { slug: 'extra', title: 'Extra', load: async () => ({ default: () => <p>EXTRA</p> }) }
    const next = [...PRESENTATIONS, added]
    expect(next.slice(0, before.length).map((p) => p.slug)).toEqual(before)
    render(<Suspense fallback="x"><Router pathname="/how-to-make-a-presentation" registry={next} /></Suspense>)
    expect(await screen.findByText('You have a topic', {}, { timeout: 4000 })).toBeTruthy()
  })
})

describe('entry point', () => {
  it('keeps StrictMode around the router', () => {
    const main = readFileSync('src/main.tsx', 'utf8')
    expect(main).toMatch(/<StrictMode>[\s\S]*<Router[\s\S]*<\/StrictMode>/)
  })
})
