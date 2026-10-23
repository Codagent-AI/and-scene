import { render, screen, waitFor } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Landing } from '../../src/Landing'
import { presentations } from '../../src/presentations'
import type { PresentationEntry } from '../../src/presentations/types'
import { resolveRoute } from '../../src/routes'
import { Router } from '../../src/Router'

const make = (slug: string) => {
  const load = vi.fn(async () => ({ default: () => <div data-testid={`pres-${slug}`}>{slug}</div> }))
  return { slug, title: `Title ${slug}`, load } satisfies PresentationEntry
}

describe('router (L-30, I-20)', () => {
  let registry = [make('one'), make('two')]
  beforeEach(() => {
    registry = [make('one'), make('two')]
  })
  it.each(['/', '', '/nope', '/one/extra', '/ONE'])('shows Landing for %j', (p) => {
    render(<Router pathname={p} registry={registry} />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
    expect(screen.queryByTestId('pres-one')).toBeNull()
    expect(registry.every((e) => e.load.mock.calls.length === 0)).toBe(true)
  })
  it.each(['/two', '/two/'])('lazy-loads only the selected presentation for %s', async (p) => {
    render(<Router pathname={p} registry={registry} />)
    expect(await screen.findByTestId('pres-two')).toBeTruthy()
    expect(registry[0]!.load).not.toHaveBeenCalled()
    expect(registry[1]!.load).toHaveBeenCalled()
  })
  it('resolves routes without loading anything', () => {
    expect(resolveRoute('/one/', registry)?.slug).toBe('one')
    expect(resolveRoute('/', registry)).toBeNull()
    expect(registry[0]!.load).not.toHaveBeenCalled()
  })
})

describe('registry and Landing (L-31, I-21, L-32, I-43)', () => {
  it('has unique slugs, titles and loaders that resolve to a component', async () => {
    expect(presentations.length).toBeGreaterThan(0)
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(typeof p.load).toBe('function')
      expect(typeof (await p.load()).default).toBe('function')
      for (const f of ['Talk.tsx', 'entities.ts']) expect(existsSync(`src/presentations/${p.slug}/${f}`), `${p.slug}/${f}`).toBe(true)
      expect(existsSync(`src/presentations/${p.slug}/steps.ts`) || existsSync(`src/presentations/${p.slug}/steps`)).toBe(true)
    }
  })
  it('registers explicitly, without glob auto-registration', () => {
    const src = readFileSync('src/presentations/index.ts', 'utf8')
    expect(src).not.toMatch(/import\.meta\.glob/)
    expect(src).toMatch(/load: \(\) => import\('\.\/how-to-make-a-presentation\/Talk'\)/)
  })
  it('lists every registered presentation with its link', async () => {
    render(<Landing registry={presentations} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual(presentations.map((p) => [p.title, `/${p.slug}`]))
    await waitFor(() => expect(links.length).toBe(presentations.length))
  })
})
