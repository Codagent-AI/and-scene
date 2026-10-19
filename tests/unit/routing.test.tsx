import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Landing } from '../../src/Landing'
import { Root } from '../../src/Root'
import { presentations, type PresentationEntry } from '../../src/presentations'
import { resolveRoute } from '../../src/route'
import { setViewport } from './helpers'

const entry = (slug: string): PresentationEntry & { load: ReturnType<typeof vi.fn> } => ({
  slug,
  title: `Title ${slug}`,
  load: vi.fn(async () => ({ default: () => <p>loaded {slug}</p> })),
})

describe('resolveRoute', () => {
  const registry = [entry('alpha'), entry('beta')]

  it('maps / to Landing and each known slug to its entry', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha', registry)).toEqual({ kind: 'presentation', entry: registry[0] })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
  })

  it('falls back to Landing for unknown or nested paths', () => {
    for (const path of ['/nope', '/alpha/extra', '/ALPHA', '//']) {
      expect(resolveRoute(path, registry)).toEqual({ kind: 'landing' })
    }
  })
})

describe('Root', () => {
  it('lazy-loads only the selected presentation', async () => {
    const registry = [entry('alpha'), entry('beta')]
    render(<Root pathname="/beta" registry={registry} />)
    expect(await screen.findByText('loaded beta', {}, { timeout: 5000 })).toBeTruthy()
    expect(registry[1].load).toHaveBeenCalledTimes(1)
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('shows Landing at / and for unknown paths without rewriting the URL', () => {
    const registry = [entry('alpha'), entry('beta')]
    window.history.replaceState({}, '', '/mystery')
    render(<Root pathname={window.location.pathname} registry={registry} />)
    expect(document.querySelector('[data-landing]')).not.toBeNull()
    expect(window.location.pathname).toBe('/mystery')
    expect(registry.every((e) => e.load.mock.calls.length === 0)).toBe(true)
  })

  it('renders the real sample at its slug', async () => {
    setViewport(1280, 800)
    render(<Root pathname="/how-to-make-a-presentation" registry={presentations} />)
    expect(await screen.findByRole('region', { name: /how to use this skill/i }, { timeout: 5000 })).toBeTruthy()
    expect(document.querySelector('[data-step-count]')!.getAttribute('data-step-count')).toBe('9')
  })
})

describe('Landing', () => {
  it('links every registered presentation', () => {
    const registry = [entry('alpha'), entry('beta'), entry('gamma')]
    render(<Landing registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/alpha', '/beta', '/gamma'])
    expect(links.map((a) => a.textContent)).toEqual(['Title alpha', 'Title beta', 'Title gamma'])
  })
})

describe('presentation registry', () => {
  it('has unique kebab-case slugs, titles and callable lazy loaders resolving a component', async () => {
    expect(presentations.length).toBeGreaterThan(0)
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.trim()).not.toBe('')
      expect(typeof p.load).toBe('function')
      expect(typeof (await p.load()).default).toBe('function')
    }
  })

  it('is an explicit array literal rather than a glob', () => {
    const source = readFileSync('src/presentations/index.ts', 'utf8')
    expect(source).not.toMatch(/import\.meta\.glob/)
    expect(source).toMatch(/load: \(\) => import\('\.\//)
  })

  it('keeps StrictMode enabled in the app entry', () => {
    expect(readFileSync('src/main.tsx', 'utf8')).toMatch(/<StrictMode>/)
  })
})
