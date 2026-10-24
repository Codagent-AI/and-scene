import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  BOOTSTRAP,
  ConfirmationRequired,
  bootstrap,
  createPresentation,
  detect,
  detectAnchors,
  registerEntry,
  resolveTarget,
} from '../../skills/presentation/scripts/scaffold.mjs'

const repo = path.resolve(import.meta.dirname, '../..')
const tmp: string[] = []
function dir(files: Record<string, string> = {}) {
  const d = mkdtempSync(path.join(tmpdir(), 'scaffold-'))
  tmp.push(d)
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(d, rel)), { recursive: true })
    writeFileSync(path.join(d, rel), content)
  }
  return d
}
afterAll(() => tmp.forEach((d) => rmSync(d, { recursive: true, force: true })))

function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = path.join(d, n)
    return statSync(p).isDirectory() ? walk(p).map((f) => path.join(n, f)) : [n]
  })
}

const BUILD_PKG = JSON.stringify({
  name: 'x',
  scripts: { build: 'tsc -b && vite build' },
  devDependencies: { vite: '^8', typescript: '~6', react: '^19' },
})

describe('anchor detection', () => {
  it('finds none in an empty directory', () => {
    expect(detectAnchors(dir())).toEqual({ build: false, kit: false, index: false })
  })

  it('keys on the presence of each anchor, not on a byte-identical scaffold', () => {
    const d = dir({
      'package.json': BUILD_PKG,
      'src/presentation-kit/Presentation.tsx': 'export function Presentation() { return null }',
      'src/presentations/index.tsx': 'export const presentations = []',
    })
    expect(detect(d)).toMatchObject({ target: d, anchors: { build: true, kit: true, index: true }, missing: [] })
  })

  it('recognizes equivalent anchors under other names and locations', () => {
    const d = dir({
      'package.json': BUILD_PKG,
      'src/engine/Deck.tsx': 'export default function Presentation() { return null }',
      'src/talks/registry.ts': 'export const presentations: unknown[] = []',
    })
    expect(detect(d)).toMatchObject({ anchors: { build: true, kit: true, index: true }, missing: [] })
  })

  it('does not count comment-only or unrelated stubs as anchors', () => {
    const d = dir({
      'src/presentation-kit/Presentation.tsx': '// TODO: write the kit',
      'src/presentations/notes.ts': '// presentations go here',
    })
    expect(detectAnchors(d)).toEqual({ build: false, kit: false, index: false })
  })

  it('requires a working build script and the core toolchain for the build anchor', () => {
    expect(detectAnchors(dir({ 'package.json': JSON.stringify({ scripts: { build: 'x' } }) })).build).toBe(false)
  })
})

describe('target resolution', () => {
  it('uses the root of an empty or standalone project', () => {
    const empty = dir()
    expect(resolveTarget(empty).target).toBe(empty)
    const standalone = dir({ 'package.json': BUILD_PKG, 'README.md': 'hi' })
    expect(resolveTarget(standalone).target).toBe(standalone)
  })

  it.each([
    ['workspaces', { 'package.json': JSON.stringify({ workspaces: ['packages/*'] }) }],
    ['pnpm-workspace.yaml', { 'pnpm-workspace.yaml': 'packages: []' }],
    ['packages/ layout', { 'packages/a/index.js': '' }],
    ['apps/ layout', { 'apps/a/index.js': '' }],
  ])('scaffolds into presentations/ for a monorepo (%s)', (_name, files) => {
    const d = dir(files)
    expect(resolveTarget(d).target).toBe(path.join(d, 'presentations'))
  })

  it('reuses an app that already has anchors, at the root or in presentations/', () => {
    const root = dir({ 'src/presentation-kit/Presentation.tsx': 'export function Presentation() {}', 'packages/a/x': '' })
    expect(resolveTarget(root).target).toBe(root)
    const nested = dir({ 'pnpm-workspace.yaml': '', 'presentations/src/presentations/index.ts': 'export const presentations = []' })
    expect(resolveTarget(nested).target).toBe(path.join(nested, 'presentations'))
  })
})

describe('bootstrap', () => {
  it('fully scaffolds an empty directory with every anchor and the dependency set', () => {
    const d = dir()
    const result = bootstrap(d)
    expect(result.missing).toEqual(['build', 'kit', 'index'])
    expect(detect(d).missing).toEqual([])
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(deps, dep).toContain(dep)
    }
    expect(deps.filter((x) => /tailwind/i.test(x))).toEqual([])
    expect(existsSync(path.join(d, '.gitignore'))).toBe(true)
  })

  it('does nothing when all anchors already exist', () => {
    const d = dir()
    bootstrap(d)
    const before = walk(d).sort()
    writeFileSync(path.join(d, 'src/presentation-kit/types.ts'), '// locally edited')
    const result = bootstrap(d, { confirmed: true })
    expect(result.created).toEqual([])
    expect(walk(d).sort()).toEqual(before)
    expect(readFileSync(path.join(d, 'src/presentation-kit/types.ts'), 'utf8')).toBe('// locally edited')
  })

  it('scaffolds only the missing anchors and leaves existing files alone', () => {
    const d = dir({ 'package.json': BUILD_PKG, 'vite.config.ts': '// mine', 'src/main.tsx': '// my main', 'notes.md': 'keep' })
    const result = bootstrap(d, { confirmed: true })
    expect(result.missing).toEqual(['kit', 'index'])
    expect(result.created.some((f: string) => f.startsWith('src/presentation-kit/'))).toBe(true)
    expect(result.created).toContain('src/presentations/index.ts')
    expect(result.created).not.toContain('vite.config.ts')
    expect(readFileSync(path.join(d, 'vite.config.ts'), 'utf8')).toBe('// mine')
    expect(readFileSync(path.join(d, 'src/main.tsx'), 'utf8')).toBe('// my main')
    // the verification scripts that the added npm scripts invoke come with them
    expect(existsSync(path.join(d, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(path.join(d, 'scripts/inspect-presentation.mjs'))).toBe(true)
    expect(existsSync(path.join(d, 'scripts/lib/preview.mjs'))).toBe(true)
    // an existing entry point that ignores the registry is flagged, never overwritten
    expect(result.needsRouting).toBe(true)
    expect(readFileSync(path.join(d, 'notes.md'), 'utf8')).toBe('keep')
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.devDependencies.playwright).toBeDefined()
    expect(pkg.scripts.verify).toBeDefined()
  })

  it('does not flag routing when the existing entry point already uses the registry', () => {
    const d = dir({ 'package.json': BUILD_PKG, 'src/main.tsx': "import { presentations } from './presentations/index.ts'" })
    expect(bootstrap(d, { confirmed: true }).needsRouting).toBe(false)
  })

  it('installs dependencies on request even when node_modules already exists', () => {
    const d = dir({ 'package.json': BUILD_PKG })
    mkdirSync(path.join(d, 'node_modules'))
    const calls: unknown[][] = []
    const runner = (...args: unknown[]) => (calls.push(args), { status: 0 })
    const result = bootstrap(d, { confirmed: true, install: true, runner })
    expect(result.installed).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0][0]).toBe('npm')
    const failing = dir({ 'package.json': BUILD_PKG })
    expect(() => bootstrap(failing, { confirmed: true, install: true, runner: () => ({ status: 1 }) })).toThrow(/npm install failed/)
  })

  it('refuses to write into a non-empty project until the target is confirmed', () => {
    const d = dir({ 'package.json': BUILD_PKG, 'notes.md': 'keep' })
    const before = walk(d).sort()
    expect(() => bootstrap(d)).toThrow(ConfirmationRequired)
    expect(walk(d).sort()).toEqual(before)
    try {
      bootstrap(d)
    } catch (e) {
      expect((e as InstanceType<typeof ConfirmationRequired>).target).toBe(d)
    }
  })

  it('scaffolds a monorepo into a self-contained presentations/ app and leaves the root alone', () => {
    const d = dir({
      'package.json': JSON.stringify({ name: 'mono', workspaces: ['packages/*'], scripts: { build: 'x' } }),
      'packages/a/index.js': 'a',
      'README.md': 'root',
    })
    const rootBefore = readFileSync(path.join(d, 'package.json'), 'utf8')
    expect(() => bootstrap(d)).toThrow(ConfirmationRequired)
    expect(existsSync(path.join(d, 'presentations'))).toBe(false)
    const result = bootstrap(d, { confirmed: true })
    expect(result.target).toBe(path.join(d, 'presentations'))
    expect(detect(d).missing).toEqual([])
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(rootBefore)
    expect(existsSync(path.join(d, 'src'))).toBe(false)
    expect(existsSync(path.join(d, 'presentations/package.json'))).toBe(true)
    expect(readFileSync(path.join(d, 'README.md'), 'utf8')).toBe('root')
  })

  it('reads templates relative to the skill, whatever the caller working directory', () => {
    const d = dir()
    const elsewhere = dir()
    const cli = path.join(repo, 'skills/presentation/scripts/scaffold.mjs')
    execFileSync(process.execPath, [cli, 'bootstrap', d], { cwd: elsewhere })
    expect(detect(d).missing).toEqual([])
    const refused = spawnSync(process.execPath, [cli, 'bootstrap', dir({ 'a.txt': 'x' })], { cwd: elsewhere })
    expect(refused.status).toBe(2)
    expect(BOOTSTRAP).toBe(path.join(repo, 'skills/presentation/templates/bootstrap'))
  })
})

describe('createPresentation', () => {
  it('writes a self-contained folder, registers it, and keeps existing presentations', () => {
    const d = dir()
    bootstrap(d)
    const first = createPresentation(d, 'first-talk', 'First "Talk"')
    expect(first.created).toContain('src/presentations/first-talk/Talk.tsx')
    const second = createPresentation(d, 'second', 'Second')
    expect(second.slug).toBe('second')
    const index = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'first-talk'")
    expect(index).toContain("slug: 'second'")
    expect(index).toContain('title: "First \\"Talk\\""')
    expect(existsSync(path.join(d, 'src/presentations/first-talk/Talk.tsx'))).toBe(true)
    const talk = readFileSync(path.join(d, 'src/presentations/second/Talk.tsx'), 'utf8')
    expect(talk).toContain('title={"Second"}')
    expect(talk).not.toContain('__')
  })

  it('rejects duplicate and invalid slugs without touching the registry', () => {
    const d = dir()
    bootstrap(d)
    createPresentation(d, 'one', 'One')
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(() => createPresentation(d, 'one', 'Again')).toThrow(/already exists/)
    expect(() => createPresentation(d, 'Bad Slug', 'x')).toThrow(/invalid slug/)
    expect(() => createPresentation(dir(), 'x', 'x')).toThrow(/bootstrap/)
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toBe(registry)
  })

  it('registers into a differently formatted registry and leaves nothing behind when it cannot', () => {
    const kit = { 'src/presentation-kit/index.ts': 'export function Presentation() {}' }
    const d = dir({ ...kit, 'src/presentations/index.ts': "export const presentations = [{ slug: 'old', title: 'Old', load: () => import('./old/Talk.tsx') }]\n" })
    createPresentation(d, 'fresh', 'Fresh')
    const index = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'old'")
    expect(index).toContain("slug: 'fresh'")
    const broken = dir({ ...kit, 'src/presentations/index.ts': 'export const presentations = [' })
    expect(() => createPresentation(broken, 'fresh', 'Fresh')).toThrow(/not closed/)
    expect(existsSync(path.join(broken, 'src/presentations/fresh'))).toBe(false)
    createPresentation(d, 'again', 'Again')
  })

  it('imports the scene kit from wherever it lives', () => {
    const d = dir({
      'src/engine/index.ts': '',
      'src/engine/Deck.tsx': 'export default function Presentation() {}',
      'src/presentations/index.ts': 'export const presentations = []\n',
    })
    createPresentation(d, 'deep', 'Deep')
    expect(readFileSync(path.join(d, 'src/presentations/deep/Talk.tsx'), 'utf8')).toContain("from '../../engine/index.ts'")
    expect(readFileSync(path.join(d, 'src/presentations/deep/steps/Scene.tsx'), 'utf8')).toContain("from '../../../engine/index.ts'")
  })

  it('works against the committed sample app registry too', () => {
    const d = dir()
    cpSync(path.join(repo, 'src/presentations/index.ts'), path.join(d, 'src/presentations/index.ts'))
    cpSync(path.join(repo, 'src/presentation-kit'), path.join(d, 'src/presentation-kit'), { recursive: true })
    createPresentation(d, 'extra', 'Extra')
    const index = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'how-to-make-a-presentation'")
    expect(index).toContain("slug: 'extra'")
  })
})

describe('registerEntry', () => {
  const entry = "  { slug: 'x' },"
  it.each([
    ['canonical multi-line', "export const presentations: RegistryEntry[] = [\n  { slug: 'a' },\n]\n"],
    ['no trailing comma', "export const presentations: RegistryEntry[] = [\n  { slug: 'a' }\n]\n"],
    ['single line', "export const presentations = [{ slug: 'a' }]\n"],
    ['empty', 'export const presentations: RegistryEntry[] = []\n'],
    ['indented with trailing code', "  export const presentations = [\n      { slug: 'a' },\n  ]\n  export const other = [1]\n"],
  ])('inserts into a %s registry', (_name, source) => {
    const out = registerEntry(source, entry)
    const slugs = [...out.matchAll(/slug: '(\w)'/g)].map((m) => m[1])
    expect(slugs.at(-1)).toBe('x')
    expect(slugs.length).toBe([...source.matchAll(/slug: '(\w)'/g)].length + 1)
    // still valid array syntax: evaluate the array literal
    const literal = /presentations[^=]*=\s*(\[[^]*?\])\s*(?:\n|$)/.exec(out)![1]
    expect(() => new Function(`return ${literal}`)()).not.toThrow()
  })

  it('throws when there is no presentations array', () => {
    expect(() => registerEntry('export const other = []', entry)).toThrow(/presentations/)
  })
})

describe('bootstrap template stays in sync with the canonical sources', () => {
  const synced = ['src/main.tsx', 'src/Landing.tsx', 'src/router.ts', 'src/index.css',
    'scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']

  it('keeps the kit byte-aligned', () => {
    const canonical = walk(path.join(repo, 'src/presentation-kit')).sort()
    const template = walk(path.join(BOOTSTRAP, 'src/presentation-kit')).sort()
    expect(template).toEqual(canonical)
    for (const f of canonical) {
      expect(readFileSync(path.join(BOOTSTRAP, 'src/presentation-kit', f), 'utf8'), f).toBe(
        readFileSync(path.join(repo, 'src/presentation-kit', f), 'utf8'),
      )
    }
  })

  it('keeps host files and verification/inspection scripts aligned', () => {
    for (const f of synced) {
      expect(readFileSync(path.join(BOOTSTRAP, f), 'utf8'), f).toBe(readFileSync(path.join(repo, f), 'utf8'))
    }
  })

  it('ships no styling framework or stylesheet defaults', () => {
    const pkg = readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind|styled-components|emotion/i)
    const css = walk(BOOTSTRAP).filter((f) => f.endsWith('.css'))
    expect(css).toEqual(['src/index.css'])
    expect(readFileSync(path.join(BOOTSTRAP, 'src/index.css'), 'utf8')).not.toMatch(/(#[0-9a-f]{3,8}\b|rgb|hsl|font-family|border|shadow)/i)
  })
})
