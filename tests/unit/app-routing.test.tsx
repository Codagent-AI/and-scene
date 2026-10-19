import { readFileSync } from 'node:fs'
import { type ComponentType } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Root from '../../src/Root'
import { presentations, type PresentationEntry } from '../../src/presentations'

function fixture(slug: string, title: string) {
  const Talk: ComponentType = () => <p data-testid={`talk-${slug}`}>{title}</p>
  const load = vi.fn(() => Promise.resolve({ default: Talk }))
  return { slug, title, load } satisfies PresentationEntry
}

describe('L-42 routing', () => {
  it('shows the landing page at / and for unknown slugs, linking every entry once', () => {
    const entries = [fixture('a', 'Alpha'), fixture('b', 'Beta')]
    for (const pathname of ['/', '/nope', '/a/b']) {
      const { container, unmount } = render(<Root pathname={pathname} registry={entries} />)
      const links = Array.from(container.querySelectorAll('a'))
      expect(links.map((l) => [l.getAttribute('href'), l.textContent])).toEqual([
        ['/a', 'Alpha'],
        ['/b', 'Beta'],
      ])
      unmount()
    }
    expect(entries[0].load).not.toHaveBeenCalled()
    expect(entries[1].load).not.toHaveBeenCalled()
  })

  it('lazy-loads only the matching entry and renders its component', async () => {
    const entries = [fixture('a', 'Alpha'), fixture('b', 'Beta')]
    render(<Root pathname="/b" registry={entries} />)
    expect(await screen.findByTestId('talk-b')).toBeTruthy()
    expect(entries[1].load).toHaveBeenCalledTimes(1)
    expect(entries[0].load).not.toHaveBeenCalled()
    expect(screen.queryByTestId('talk-a')).toBeNull()
  })

  it('shows the Suspense fallback (nothing) while the loader is pending', async () => {
    let release!: (mod: { default: ComponentType }) => void
    const entry: PresentationEntry = {
      slug: 'slow',
      title: 'Slow',
      load: () => new Promise((resolve) => (release = resolve)),
    }
    const { container } = render(<Root pathname="/slow" registry={[entry]} />)
    expect(container.textContent).toBe('')
    release({ default: () => <p data-testid="slow-loaded">done</p> })
    await waitFor(() => expect(screen.getByTestId('slow-loaded')).toBeTruthy())
  })

  it('does not remount the presentation on re-render', async () => {
    const entries = [fixture('a', 'Alpha')]
    const { rerender } = render(<Root pathname="/a" registry={entries} />)
    const node = await screen.findByTestId('talk-a')
    rerender(<Root pathname="/a" registry={entries} />)
    expect(screen.getByTestId('talk-a')).toBe(node)
    expect(entries[0].load).toHaveBeenCalledTimes(1)
  })
})

describe('L-41 / I-39 registry', () => {
  it('is an explicit array of unique-slug {slug,title,load} entries whose loaders resolve to components', async () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const entry of presentations) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/)
      expect(entry.title.length).toBeGreaterThan(0)
      expect(typeof (await entry.load()).default).toBe('function')
    }
  })

  it('uses a hand-written registry with no glob registration and no router dependency', () => {
    const index = readFileSync('src/presentations/index.ts', 'utf8')
    expect(index).not.toContain('import.meta.glob')
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContain('react-router-dom')
  })

  it('adding an entry leaves earlier entries resolvable and their bytes untouched', () => {
    const before = readFileSync('src/presentations/index.ts', 'utf8')
    const earlier = presentations.map((p) => p.slug)
    const extended = [...presentations, fixture('third', 'Third')]
    for (const slug of earlier) {
      expect(extended.some((p) => p.slug === slug)).toBe(true)
    }
    expect(readFileSync('src/presentations/index.ts', 'utf8')).toBe(before)
  })

  it('keeps the designed layout: placeholder App removed, Landing and sample files present', () => {
    for (const path of [
      'src/main.tsx',
      'src/Landing.tsx',
      'src/index.css',
      'src/presentations/index.ts',
      'src/presentations/how-to-make-a-presentation/entities.ts',
      'src/presentations/how-to-make-a-presentation/Talk.tsx',
      'src/presentation-kit/types.ts',
      'src/presentation-kit/constants.ts',
      'src/presentation-kit/usePresentationNav.ts',
      'src/presentation-kit/useFitScale.ts',
      'src/presentation-kit/Stage.tsx',
      'src/presentation-kit/Presentation.tsx',
      'scripts/verify.mjs',
      'scripts/inspect-presentation.mjs',
      'skills/presentation/SKILL.md',
    ]) {
      expect(() => readFileSync(path), path).not.toThrow()
    }
    expect(() => readFileSync('src/App.tsx')).toThrow()
    expect(readFileSync('src/presentations/how-to-make-a-presentation/Talk.tsx', 'utf8')).toMatch(/initialMode="browse"/)
  })
})

