import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppRouter } from '../../src/AppRouter.tsx'
import { presentations } from '../../src/presentations/index.ts'
import type { PresentationEntry } from '../../src/presentations/index.ts'
import { resolveRoute } from '../../src/router.ts'

const ROOT = path.resolve(__dirname, '../..')

const fake = (slug: string, title: string) => {
  const Component = () => <p data-testid="loaded">{`loaded ${slug}`}</p>
  const load = vi.fn(async () => ({ default: Component }))
  return { slug, title, load } satisfies PresentationEntry
}

describe('registry', () => {
  it('has unique slugs and titles and a loader per entry', () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    expect(new Set(presentations.map((p) => p.title)).size).toBe(presentations.length)
    for (const entry of presentations) {
      expect(entry.slug).toMatch(/^[a-z0-9][a-z0-9-]*$/)
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.load).toBeTypeOf('function')
    }
  })

  it('is an explicit array: no glob auto-registration, no router dependency', () => {
    const source = readFileSync(path.join(ROOT, 'src/presentations/index.ts'), 'utf8')
    expect(source).not.toContain('import.meta.glob')
    expect(source).toMatch(/slug:\s*'how-to-make-a-presentation'/)
    const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    expect(Object.keys(pkg.dependencies).filter((d) => /router/.test(d))).toEqual([])
  })

  it('loads the committed sample through its registry entry', async () => {
    const mod = await presentations[0].load()
    expect(mod.default).toBeTypeOf('function')
  })
})

describe('resolveRoute', () => {
  const registry = [fake('alpha', 'Alpha'), fake('beta', 'Beta')]

  it('maps "/" to the landing page and slugs to their entries', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha', registry)).toEqual({ kind: 'presentation', entry: registry[0] })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
  })

  it('falls back to the landing page for unknown paths', () => {
    for (const p of ['/nope', '/alpha/extra', '//', '/ALPHA']) expect(resolveRoute(p, registry)).toEqual({ kind: 'landing' })
  })
})

describe('AppRouter and Landing', () => {
  it('lists every registry entry as a link to its route', () => {
    const registry = [fake('alpha', 'Alpha Talk'), fake('beta', 'Beta Talk')]
    render(<AppRouter pathname="/" registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Alpha Talk', '/alpha'],
      ['Beta Talk', '/beta'],
    ])
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('lazy-loads the matching presentation inside Suspense, and only that one', async () => {
    const registry = [fake('alpha', 'Alpha'), fake('beta', 'Beta')]
    render(<AppRouter pathname="/beta" registry={registry} />)
    expect(screen.queryByTestId('loaded')).toBeNull()
    await waitFor(() => expect(screen.getByTestId('loaded').textContent).toBe('loaded beta'))
    expect(registry[1].load).toHaveBeenCalledTimes(1)
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('shows the landing page for unknown paths', () => {
    const registry = [fake('alpha', 'Alpha')]
    render(<AppRouter pathname="/missing" registry={registry} />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
  })

  it('renders the committed sample route end to end in the component tree', async () => {
    render(<AppRouter pathname="/how-to-make-a-presentation" registry={presentations} />)
    await waitFor(() => expect(document.querySelector('[data-presentation-root]')).not.toBeNull(), { timeout: 5000 })
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('9')
  })

  it('keeps StrictMode at the application root', () => {
    expect(readFileSync(path.join(ROOT, 'src/main.tsx'), 'utf8')).toMatch(/<StrictMode>[\s\S]*<AppRouter/)
  })
})
