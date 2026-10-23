import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  addPresentation, anchorOf, bootstrap, BOOTSTRAP_DIR, detectAnchors, isMonorepo, mergePackageJson, resolveTarget,
} from '../../skills/presentation/scripts/scaffold.mjs'
import { ROOT } from '../helpers/spec-outline'

const dirs: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'))
  dirs.push(d)
  return d
}
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

const files = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((n) => {
    const f = path.join(dir, n)
    return statSync(f).isDirectory() ? files(f, base) : [path.relative(base, f)]
  }).sort()
const digest = (dir: string) => Object.fromEntries(files(dir).map((f) => [f, createHash('sha1').update(readFileSync(path.join(dir, f))).digest('hex')]))
const write = (file: string, text: string) => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, text)
}
const materialize = (dir: string) => cpSync(BOOTSTRAP_DIR, dir, { recursive: true })

describe('detectAnchors', () => {
  it('finds nothing in an empty directory and all three in the bootstrap template', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
    const d = tmp()
    materialize(d)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it.each([
    ['build', ['package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html', 'eslint.config.js']],
    ['kit', ['src/presentation-kit']],
    ['index', ['src/presentations']],
  ])('reports a missing %s anchor when only that part is removed', (anchor, removals) => {
    const d = tmp()
    materialize(d)
    for (const r of removals) rmSync(path.join(d, r), { recursive: true, force: true })
    const found = detectAnchors(d)
    expect(found[anchor as 'build']).toBe(false)
    expect(Object.values(found).filter(Boolean)).toHaveLength(2)
  })

  it('is contract-level: renamed, reformatted kit files and extra dependencies still count', () => {
    const d = tmp()
    materialize(d)
    renameSync(path.join(d, 'src/presentation-kit/Presentation.tsx'), path.join(d, 'src/presentation-kit/Deck.tsx'))
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    pkg.dependencies['left-pad'] = '1.0.0'
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(pkg))
    const reg = path.join(d, 'src/presentations/index.ts')
    writeFileSync(reg, readFileSync(reg, 'utf8').replace('export const presentations:', 'export   const   presentations :'))
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('rejects incomplete look-alikes', () => {
    const d = tmp()
    materialize(d)
    rmSync(path.join(d, 'src/presentation-kit/Stage.tsx'))
    write(path.join(d, 'src/presentation-kit/index.ts'), 'export const nothing = 1\n')
    expect(detectAnchors(d).kit).toBe(false)
    write(path.join(d, 'src/presentations/index.ts'), 'export const somethingElse = []\n')
    expect(detectAnchors(d).index).toBe(false)
    write(path.join(d, 'package.json'), JSON.stringify({ scripts: {}, dependencies: { react: '1' } }))
    expect(detectAnchors(d).build).toBe(false)
  })

  it('classifies template files by anchor', () => {
    expect(anchorOf('src/presentation-kit/Stage.tsx')).toBe('kit')
    expect(anchorOf('scripts/verify.mjs')).toBe('kit')
    expect(anchorOf('src/presentations/index.ts')).toBe('index')
    expect(anchorOf('package.json')).toBe('build')
  })
})

describe('resolveTarget', () => {
  it('scaffolds an empty directory at its root without needing confirmation', () => {
    const d = tmp()
    const r = resolveTarget(d)
    expect([r.target, r.missing, r.needsConfirmation, r.empty]).toEqual([d, ['build', 'kit', 'index'], false, true])
  })

  it('scaffolds a non-empty standalone project at its root, after confirmation', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), '{"name":"x"}')
    const r = resolveTarget(d)
    expect([r.target, r.monorepo, r.needsConfirmation]).toEqual([d, false, true])
  })

  it.each([
    ['workspaces array', (d: string) => write(path.join(d, 'package.json'), '{"workspaces":["packages/*"]}')],
    ['workspaces object', (d: string) => write(path.join(d, 'package.json'), '{"workspaces":{"packages":["a"]}}')],
    ['pnpm-workspace.yaml', (d: string) => write(path.join(d, 'pnpm-workspace.yaml'), 'packages: []\n')],
    ['packages/ layout', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['apps/ layout', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('puts the app in presentations/ for a monorepo signalled by %s', (_name, setup) => {
    const d = tmp()
    setup(d)
    write(path.join(d, 'unrelated.txt'), 'keep me')
    expect(isMonorepo(d)).toBe(true)
    const r = resolveTarget(d)
    expect([r.target, r.relativeTarget, r.needsConfirmation]).toEqual([path.join(d, 'presentations'), 'presentations', true])
  })

  it('does not treat a workspace root build setup as the presentation app', () => {
    const d = tmp()
    const pkg = JSON.parse(readFileSync(path.join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
    pkg.workspaces = ['packages/*']
    write(path.join(d, 'package.json'), JSON.stringify(pkg))
    for (const f of ['vite.config.ts', 'tsconfig.json']) cpSync(path.join(BOOTSTRAP_DIR, f), path.join(d, f))
    expect(detectAnchors(d).build).toBe(true)
    const r = resolveTarget(d)
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(r.missing).toEqual(['build', 'kit', 'index'])
  })

  it('reuses an existing presentation app, at the root or in presentations/', () => {
    const root = tmp()
    materialize(root)
    expect(resolveTarget(root)).toMatchObject({ target: root, missing: [], needsConfirmation: false })
    const mono = tmp()
    mkdirSync(path.join(mono, 'packages'))
    materialize(path.join(mono, 'presentations'))
    rmSync(path.join(mono, 'presentations/src/presentations'), { recursive: true })
    const r = resolveTarget(mono)
    expect([r.target, r.missing]).toEqual([path.join(mono, 'presentations'), ['index']])
  })
})

describe('bootstrap', () => {
  it('scaffolds everything into an empty target and a second run changes nothing', () => {
    const d = tmp()
    const first = bootstrap(d)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
    expect(first.installCommand).toBe('npm ci')
    expect(first.installNeeded).toBe(true)
    const before = digest(d)
    const second = bootstrap(d)
    expect(second.copied).toEqual([])
    expect(digest(d)).toEqual(before)
  })

  it('scaffolds only missing anchors and leaves existing files byte-identical', () => {
    const d = tmp()
    materialize(d)
    rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    rmSync(path.join(d, 'scripts'), { recursive: true })
    write(path.join(d, 'vite.config.ts'), '// customised\nexport default {}\n')
    write(path.join(d, 'src/presentations/index.ts'), 'export const presentations = [] // mine\n')
    const before = digest(d)
    const r = bootstrap(d)
    expect(r.copied.every((f) => anchorOf(f) === 'kit')).toBe(true)
    expect(r.copied.length).toBeGreaterThan(10)
    const after = digest(d)
    for (const [f, h] of Object.entries(before)) expect(after[f], f).toBe(h)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })

  it('merges missing dependencies and scripts into an existing package.json without changing existing entries', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), JSON.stringify({ name: 'mine', scripts: { build: 'echo mine' }, dependencies: { react: '^18.0.0' } }))
    const r = bootstrap(d, { anchors: ['kit'] })
    const pkg = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(r.packageUpdated).toBe(true)
    expect(r.installCommand).toBe('npm install')
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts.build).toBe('echo mine')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    for (const dep of ['motion', 'lucide-react', 'react-dom']) expect(pkg.dependencies[dep]).toBeDefined()
    for (const dep of ['playwright', 'vite', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint']) expect(pkg.devDependencies[dep]).toBeDefined()
    expect(pkg.scripts.verify).toBeDefined()
    expect(mergePackageJson(path.join(d, 'package.json'))).toBe(false)
  })

  it('adds only the missing pieces in a monorepo and leaves unrelated root content untouched', () => {
    const d = tmp()
    write(path.join(d, 'package.json'), '{"workspaces":["packages/*"]}')
    write(path.join(d, 'packages/lib/index.ts'), 'export {}\n')
    write(path.join(d, 'README.md'), 'hello')
    const before = digest(d)
    const target = resolveTarget(d).target
    bootstrap(target)
    const after = digest(d)
    for (const [f, h] of Object.entries(before)) expect(after[f], f).toBe(h)
    expect(detectAnchors(path.join(d, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(path.join(d, 'src'))).toBe(false)
  })

  it('resolves templates from the skill directory regardless of the caller\'s cwd', () => {
    const cwd = tmp()
    const target = path.join(tmp(), 'app')
    const cli = path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs')
    const r = spawnSync(process.execPath, [cli, 'bootstrap', target, '--target', target], { cwd, encoding: 'utf8' })
    expect(r.status, r.stderr).toBe(0)
    expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })
    expect(files(cwd)).toEqual([])
    const bad = spawnSync(process.execPath, [cli, 'nonsense'], { cwd, encoding: 'utf8' })
    expect(bad.status).toBe(1)
  })
})

describe('addPresentation', () => {
  const app = () => {
    const d = tmp()
    bootstrap(d)
    return d
  }

  it('creates a self-contained folder and registers it, preserving existing presentations', () => {
    const d = app()
    addPresentation(d, { slug: 'first-talk', title: 'First Talk' })
    const firstBefore = digest(path.join(d, 'src/presentations/first-talk'))
    const r = addPresentation(d, { slug: 'second', title: 'Second "Quoted" Talk' })
    expect(r.files.sort()).toEqual(['Talk.tsx', 'entities.ts', 'scene.tsx', 'steps/index.ts', 'talk.css'].map((f) => path.join('src/presentations/second', f)).sort())
    expect(digest(path.join(d, 'src/presentations/first-talk'))).toEqual(firstBefore)
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("{ slug: 'first-talk', title: \"First Talk\", load: () => import('./first-talk/Talk') },")
    expect(registry).toContain("slug: 'second'")
    expect(registry).toContain('"Second \\"Quoted\\" Talk"')
    expect(registry.indexOf('first-talk')).toBeLessThan(registry.indexOf("slug: 'second'"))
    const talk = readFileSync(path.join(d, 'src/presentations/second/Talk.tsx'), 'utf8')
    expect(talk).toContain('className="talk-second"')
    expect(talk).not.toContain('__')
    expect(readFileSync(path.join(d, 'src/presentations/second/steps/index.ts'), 'utf8')).toContain("groupKey: 'second'")
  })

  it('refuses invalid or colliding slugs without changing anything', () => {
    const d = app()
    addPresentation(d, { slug: 'taken', title: 'Taken' })
    expect(() => addPresentation(d, { slug: 'taken', title: 'Again' })).toThrow(/already exists/)
    expect(() => addPresentation(d, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    expect(() => addPresentation(d, { slug: '../escape', title: 'x' })).toThrow(/invalid slug/)
    expect(() => addPresentation(d, { slug: 'ok', title: '' })).toThrow(/title/)
    rmSync(path.join(d, 'src/presentations/taken'), { recursive: true })
    expect(() => addPresentation(d, { slug: 'taken', title: 'Again' })).toThrow(/already registered/)
    expect(Object.keys(digest(d)).filter((f) => f.includes('taken'))).toEqual([])
  })

  it('needs the presentation index, and registers into registries without the marker', () => {
    const empty = tmp()
    expect(() => addPresentation(empty, { slug: 'x', title: 'X' })).toThrow(/index is missing/)
    const d = app()
    write(path.join(d, 'src/presentations/index.ts'), "export const presentations = [\n  { slug: 'old', title: 'Old', load: () => import('./old/Talk') }\n]\n")
    addPresentation(d, { slug: 'new-one', title: 'New One' })
    const registry = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("'old', title: 'Old', load: () => import('./old/Talk') },")
    expect(registry).toContain("slug: 'new-one'")
    expect(registry.trim().endsWith(']')).toBe(true)
  })
})
