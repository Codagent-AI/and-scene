import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { presentations } from '../../src/presentations'
import { ROOT } from './helpers'

describe('presentation registry', () => {
  const dir = path.join(ROOT, 'src/presentations')
  const folders = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)

  it('registers every presentation folder exactly once, with unique slugs', () => {
    const source = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')
    for (const f of folders) expect(source, f).toContain(`import('./${f}/Talk')`)
    expect(presentations).toHaveLength(folders.length)
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('resolves every loader to a presentation component', async () => {
    for (const p of presentations) {
      const mod = await p.load()
      expect(mod.default, p.slug).toBeTypeOf('function')
    }
  })

  it('registers the reference sample at its own slug', () => {
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
  })

  it('registers explicitly, without glob auto-registration or a router dependency', () => {
    const source = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')
    expect(source).not.toMatch(/import\.meta\.glob/)
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => /router/i.test(n))).toEqual([])
    const router = fs.readFileSync(path.join(ROOT, 'src/Router.tsx'), 'utf8')
    expect(router).toMatch(/lazy\(/)
    expect(router).toMatch(/<Suspense/)
  })
})
