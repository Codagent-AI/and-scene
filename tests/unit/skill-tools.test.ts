// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { TEMPLATES, anchorsAt, detect, newPresentation, register, scaffold } from '../../skills/presentation/scripts/skill-tools.mjs'

const made: string[] = []
const tmp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skill-tools-'))
  made.push(dir)
  return dir
}
afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true })
})
const write = (dir: string, rel: string, text: string) => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}
const read = (dir: string, rel: string) => readFileSync(path.join(dir, rel), 'utf8')

describe('target and anchor detection', () => {
  it('scaffolds an empty directory at its root without confirmation', () => {
    const dir = tmp()
    const info = detect(dir)
    expect(info).toMatchObject({ kind: 'empty', target: dir, missing: ['build', 'kit', 'index'], needsConfirmation: false })
  })

  it('treats a lone .git directory as empty', () => {
    const dir = tmp()
    mkdirSync(path.join(dir, '.git'))
    expect(detect(dir).kind).toBe('empty')
  })

  it.each([
    ['workspaces', 'package.json', JSON.stringify({ workspaces: ['packages/*'] })],
    ['pnpm-workspace.yaml', 'pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n'],
    ['packages/ layout', 'packages/lib/index.js', ''],
    ['apps/ layout', 'apps/web/index.js', ''],
  ])('targets presentations/ inside a monorepo (%s) and asks for confirmation', (_name, file, text) => {
    const dir = tmp()
    write(dir, 'README.md', 'unrelated')
    write(dir, file, text)
    const info = detect(dir)
    expect(info).toMatchObject({ kind: 'monorepo', target: path.join(dir, 'presentations'), needsConfirmation: true })
  })

  it('targets the root of a non-empty standalone project and asks for confirmation', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'x' }))
    expect(detect(dir)).toMatchObject({ kind: 'standalone', target: dir, needsConfirmation: true })
  })

  it('reuses an existing presentation app, here or under presentations/, and skips scaffolding when complete', () => {
    const dir = tmp()
    scaffold(dir)
    expect(detect(dir)).toMatchObject({ kind: 'existing-app', target: dir, missing: [], needsConfirmation: false })
    const mono = tmp()
    write(mono, 'package.json', JSON.stringify({ workspaces: ['presentations'] }))
    scaffold(path.join(mono, 'presentations'))
    expect(detect(mono)).toMatchObject({ kind: 'existing-app', target: path.join(mono, 'presentations'), missing: [] })
  })

  it('detects at contract level: renamed files and extra dependencies do not trigger re-scaffolding', () => {
    const dir = tmp()
    scaffold(dir)
    const pkg = JSON.parse(read(dir, 'package.json'))
    pkg.dependencies.extra = '1.0.0'
    write(dir, 'package.json', JSON.stringify(pkg))
    write(dir, 'vite.config.mts', 'export default {}')
    rmSync(path.join(dir, 'vite.config.ts'))
    write(dir, 'src/presentations/index.tsx', 'export const presentations = []')
    rmSync(path.join(dir, 'src/presentations/index.ts'))
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('reports exactly the missing anchors for a partial scaffold', () => {
    const dir = tmp()
    scaffold(dir, ['kit'])
    expect(detect(dir)).toMatchObject({ kind: 'existing-app', missing: ['build', 'index'], needsConfirmation: true })
  })
})

describe('scaffolding', () => {
  it('writes all three anchors with the full dependency set on an empty directory', () => {
    const dir = tmp()
    const report = scaffold(dir)
    expect(report.skipped).toEqual([])
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(read(dir, 'package.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', 'typescript', 'eslint', 'playwright']) expect(deps).toHaveProperty(d)
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
    expect(existsSync(path.join(dir, 'scripts/verify.mjs'))).toBe(true)
    expect(Object.keys(deps).some((d) => /tailwind/.test(d))).toBe(false)
  })

  it('resolves templates from the skill directory, not the working directory', () => {
    const dir = tmp()
    const cwd = process.cwd()
    process.chdir(tmp())
    try {
      scaffold(dir)
    } finally {
      process.chdir(cwd)
    }
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: true })
    expect(TEMPLATES).toContain(path.join('skills', 'presentation', 'templates'))
  })

  it('scaffolds only missing anchors and leaves present ones untouched', () => {
    const dir = tmp()
    scaffold(dir, ['kit'])
    write(dir, 'src/presentation-kit/Presentation.tsx', '// customised')
    write(dir, 'README.md', 'mine')
    const report = scaffold(dir, ['build', 'index'])
    expect(read(dir, 'src/presentation-kit/Presentation.tsx')).toBe('// customised')
    expect(read(dir, 'README.md')).toBe('mine')
    expect(report.created.some((f) => f.startsWith('src/presentation-kit'))).toBe(false)
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('merges missing dependencies and scripts into an existing package.json without changing existing ones', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'custom' }, dependencies: { react: '^18.0.0' } }))
    write(dir, 'vite.config.js', 'export default {}')
    const report = scaffold(dir, ['build'])
    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.name).toBe('host')
    expect(pkg.scripts.build).toBe('custom')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(pkg.scripts.verify).toBeDefined()
    expect(report.added).toContain('dependencies.motion')
    expect(read(dir, 'vite.config.js')).toBe('export default {}')
    expect(existsSync(path.join(dir, 'vite.config.ts'))).toBe(true)
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(false)
  })

  it('rejects unknown anchors', () => {
    expect(() => scaffold(tmp(), ['nope'])).toThrow(/unknown anchor/)
  })
})

describe('creating and registering presentations', () => {
  it('creates a self-contained folder, registers it, and keeps existing presentations', () => {
    const dir = tmp()
    scaffold(dir)
    const before = read(dir, 'src/presentations/index.ts')
    newPresentation(dir, 'my-talk', 'My "Talk"')
    for (const f of ['entities.ts', 'Talk.tsx', 'steps/index.ts', 'steps/meta.ts', 'steps/Scene.tsx']) {
      expect(existsSync(path.join(dir, 'src/presentations/my-talk', f)), f).toBe(true)
    }
    expect(read(dir, 'src/presentations/my-talk/entities.ts')).toContain('`my-talk/${name}`')
    expect(read(dir, 'src/presentations/my-talk/Talk.tsx')).toContain('title="My \\"Talk\\""')
    const after = read(dir, 'src/presentations/index.ts')
    expect(after).toContain("load: () => import('./my-talk/Talk.tsx')")
    expect(after).toContain("slug: 'starter'")
    expect(after.startsWith(before.slice(0, before.lastIndexOf(']') - 1))).toBe(true)
    expect(existsSync(path.join(dir, 'src/presentations/starter/Talk.tsx'))).toBe(true)
  })

  it('refuses duplicate slugs, existing folders and invalid slugs without changing the registry', () => {
    const dir = tmp()
    scaffold(dir)
    newPresentation(dir, 'one', 'One')
    const registry = read(dir, 'src/presentations/index.ts')
    expect(() => newPresentation(dir, 'one', 'One')).toThrow(/already/)
    expect(() => register(dir, 'one', 'One')).toThrow(/already registered/)
    expect(() => newPresentation(dir, 'Bad Slug', 'x')).toThrow(/invalid slug/)
    expect(() => newPresentation(dir, '../x', 'x')).toThrow(/invalid slug/)
    expect(read(dir, 'src/presentations/index.ts')).toBe(registry)
  })

  it('fails clearly when the index anchor is missing', () => {
    expect(() => register(tmp(), 'x', 'X')).toThrow(/scaffold the index anchor/)
  })
})
