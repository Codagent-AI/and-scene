import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type ComponentType } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Root from '../../src/Root'
import { presentations, type PresentationEntry } from '../../src/presentations'
import { resolveRoute } from '../../src/route'

function snapshot(dir: string, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) Object.assign(out, snapshot(full, `${prefix}${name}/`))
    else out[`${prefix}${name}`] = readFileSync(full, 'utf8')
  }
  return out
}

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

  it('adding a presentation changes only the new folder and one registry line, and earlier routes still resolve', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'registry-'))
    try {
      cpSync('src/presentations', join(dir, 'presentations'), { recursive: true })
      const earlierBefore = snapshot(join(dir, 'presentations', 'how-to-make-a-presentation'))
      const registryPath = join(dir, 'presentations', 'index.ts')
      const registryBefore = readFileSync(registryPath, 'utf8')

      // The documented "create" operation: new folder from the template + one appended entry.
      cpSync('skills/presentation/templates/presentation', join(dir, 'presentations', 'third'), { recursive: true })
      writeFileSync(
        registryPath,
        registryBefore.replace(
          /\n\]\s*$/,
          "\n  { slug: 'third', title: 'Third', load: () => import('./third/Talk') },\n]\n",
        ),
      )

      const registryAfter = readFileSync(registryPath, 'utf8')
      expect(registryAfter).toContain("slug: 'third'")
      const removed = registryBefore.split('\n').filter((line) => !registryAfter.split('\n').includes(line))
      expect(removed).toEqual([])
      expect(snapshot(join(dir, 'presentations', 'how-to-make-a-presentation'))).toEqual(earlierBefore)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }

    // Earlier routes keep resolving and loading once a further entry exists.
    const extended = [...presentations, fixture('third', 'Third')]
    for (const earlier of presentations) {
      const { container, unmount } = render(<Root pathname={`/${earlier.slug}`} registry={extended} />)
      await waitFor(() => expect(container.querySelector('[data-presentation-root]')).not.toBeNull())
      unmount()
    }
    expect(resolveRoute('/third', extended).kind).toBe('presentation')
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

