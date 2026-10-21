import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Landing } from './Landing'
import { Router } from './Router'
import { resolveSlug } from './resolveSlug'
import { presentations } from './presentations'
import type { PresentationEntry } from './presentations/types'

function entries() {
  const loadA = vi.fn(async () => ({ default: () => <p>presentation A</p> }))
  const loadB = vi.fn(async () => ({ default: () => <p>presentation B</p> }))
  const registry: PresentationEntry[] = [
    { slug: 'a', title: 'Alpha', load: loadA },
    { slug: 'b', title: 'Beta', load: loadB },
  ]
  return { registry, loadA, loadB }
}

describe('routing', () => {
  it('shows Landing at / and links every registry entry', () => {
    const { registry, loadA, loadB } = entries()
    render(<Router pathname="/" registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => [l.getAttribute('href'), l.textContent])).toEqual([
      ['/a', 'Alpha'],
      ['/b', 'Beta'],
    ])
    expect(loadA).not.toHaveBeenCalled()
    expect(loadB).not.toHaveBeenCalled()
  })

  it.each(['/a', '/a/', '//a//'])('lazy-loads only the matching presentation at %s', async (path) => {
    const { registry, loadA, loadB } = entries()
    render(<Router pathname={path} registry={registry} />)
    expect(await screen.findByText('presentation A')).toBeTruthy()
    expect(loadA).toHaveBeenCalledTimes(1)
    expect(loadB).not.toHaveBeenCalled()
  })

  it('renders the second entry at its own route', async () => {
    const { registry, loadA } = entries()
    render(<Router pathname="/b" registry={registry} />)
    expect(await screen.findByText('presentation B')).toBeTruthy()
    expect(loadA).not.toHaveBeenCalled()
  })

  it('falls back to Landing for an unknown slug without loading anything', async () => {
    const { registry, loadA, loadB } = entries()
    render(<Router pathname="/nope" registry={registry} />)
    await waitFor(() => expect(screen.getByRole('heading')).toBeTruthy())
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(loadA).not.toHaveBeenCalled()
    expect(loadB).not.toHaveBeenCalled()
  })

  it('resolves slugs', () => {
    const { registry } = entries()
    expect(resolveSlug('/', registry)).toBeNull()
    expect(resolveSlug('/a', registry)).toBe('a')
    expect(resolveSlug('/a/b', registry)).toBeNull()
    expect(resolveSlug('/A', registry)).toBeNull()
  })

  it('Landing renders an empty registry', () => {
    render(<Landing registry={[]} />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})

describe('registry', () => {
  const source = readFileSync(join(__dirname, 'presentations/index.ts'), 'utf8')

  it('is an explicit array literal, not a glob', () => {
    expect(source).not.toMatch(/import\.meta\.glob/)
    expect(source).toMatch(/export const presentations: PresentationEntry\[\] = \[/)
    expect(source.match(/load: \(\) => import\('\.\//g)).toHaveLength(presentations.length)
  })

  it('has unique non-empty slugs and titles and a loader per entry', () => {
    expect(presentations.length).toBeGreaterThan(0)
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    expect(new Set(presentations.map((p) => p.title)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(typeof p.load).toBe('function')
    }
  })

  it('every loader resolves to a renderable component', async () => {
    for (const p of presentations) {
      const mod = await p.load()
      expect(typeof mod.default).toBe('function')
    }
  })
})
