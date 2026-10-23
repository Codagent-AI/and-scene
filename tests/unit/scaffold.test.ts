// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  SKILL_DIR, TEMPLATES, apply, createPresentation, detectAnchors, detectMonorepo, isEmptyDir, mergePackageJson, plan, registerPresentation, resolveTarget,
} from '../../skills/presentation/scripts/scaffold.mjs'

const made: string[] = []
const tmp = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'scaffold-'))
  made.push(d)
  return d
}
afterAll(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })))
const write = (dir: string, rel: string, text = '') => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}
const full = () => {
  const d = tmp()
  cpSync(TEMPLATES.bootstrap, d, { recursive: true })
  return d
}
const pkg = (deps: Record<string, string> = {}, scripts: Record<string, string> = { build: 'tsc -b && vite build' }, extra: object = {}) =>
  JSON.stringify({ name: 'x', scripts, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1', ...deps }, ...extra })

describe('anchor detection is contract-level (L-37, I-37)', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })
  it('finds all three anchors in a full scaffold', () => {
    expect(detectAnchors(full())).toEqual({ build: true, kit: true, index: true })
  })
  it('tolerates renamed, moved and reformatted anchors and extra dependencies', () => {
    const d = full()
    renameSync(path.join(d, 'src/presentation-kit'), path.join(d, 'src/engine'))
    mkdirSync(path.join(d, 'src/routing'))
    renameSync(path.join(d, 'src/presentations/index.ts'), path.join(d, 'src/routing/registry.ts'))
    writeFileSync(path.join(d, 'package.json'), pkg({ lodash: '4', zod: '3' }))
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
  })
  it('is not fooled by misleading names without the contract', () => {
    const d = tmp()
    write(d, 'package.json', JSON.stringify({ scripts: { build: 'echo hi' }, dependencies: {} }))
    write(d, 'src/presentation-kit/Presentation.tsx', '// nothing here\nexport const x = 1\n')
    write(d, 'src/presentations/index.ts', '// registry\nexport const presentations = []\n')
    expect(detectAnchors(d)).toEqual({ build: false, kit: false, index: false })
  })
  it('detects a missing individual anchor', () => {
    const d = full()
    rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    expect(detectAnchors(d)).toEqual({ build: true, kit: false, index: true })
    rmSync(path.join(d, 'src/presentations'), { recursive: true })
    rmSync(path.join(d, 'src/routes.ts'))
    expect(detectAnchors(d).index).toBe(false)
  })
})

describe('target resolution (L-42, I-38)', () => {
  it.each([
    ['workspaces', (d: string) => write(d, 'package.json', pkg({}, { build: 'x' }, { workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n')],
    ['packages/', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['apps/', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('puts a monorepo (%s) app into presentations/', (_n, setup) => {
    const d = tmp()
    write(d, 'README.md', 'root')
    setup(d)
    expect(detectMonorepo(d)).toBeTruthy()
    expect(resolveTarget(d).target).toBe(path.join(d, 'presentations'))
  })
  it('scaffolds at the root for empty and standalone projects', () => {
    const empty = tmp()
    expect(resolveTarget(empty).target).toBe(empty)
    const standalone = tmp()
    write(standalone, 'package.json', pkg())
    expect(detectMonorepo(standalone)).toBeNull()
    expect(resolveTarget(standalone).target).toBe(standalone)
  })
  it('reuses an existing presentation app: here, an ancestor, or presentations/', () => {
    const app = full()
    expect(resolveTarget(app).target).toBe(app)
    mkdirSync(path.join(app, 'src/deep'), { recursive: true })
    expect(resolveTarget(path.join(app, 'src/deep')).target).toBe(app)
    const mono = tmp()
    write(mono, 'pnpm-workspace.yaml', 'packages: []')
    cpSync(TEMPLATES.bootstrap, path.join(mono, 'presentations'), { recursive: true })
    expect(resolveTarget(mono).target).toBe(path.join(mono, 'presentations'))
  })
  it('treats only version-control metadata as empty', () => {
    const d = tmp()
    mkdirSync(path.join(d, '.git'))
    expect(isEmptyDir(d)).toBe(true)
    write(d, 'a.txt')
    expect(isEmptyDir(d)).toBe(false)
  })
})

describe('plan and confirmation (L-43, I-38)', () => {
  it('needs no confirmation for an empty directory but plans a full scaffold', () => {
    const p = plan(tmp())
    expect(p.missing).toEqual(['build', 'kit', 'index'])
    expect(p.needsConfirmation).toBe(false)
    expect(p.files.some((f: { rel: string }) => f.rel.startsWith('src/presentation-kit'))).toBe(true)
  })
  it('skips scaffolding entirely when all anchors exist', () => {
    const p = plan(full())
    expect(p.missing).toEqual([])
    expect(p.needsConfirmation).toBe(false)
    expect(p.files).toEqual([])
  })
  it.each([
    ['no anchors', (d: string) => write(d, 'notes.txt', 'hi')],
    ['only the build anchor', (d: string) => write(d, 'package.json', pkg())],
    ['kit missing', (d: string) => cpSync(TEMPLATES.bootstrap, d, { recursive: true }) as unknown as void],
    ['monorepo without kit or index', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages: []')],
  ])('requires confirmation in a non-empty project: %s', (name, setup) => {
    const d = tmp()
    setup(d)
    if (name === 'kit missing') rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    const p = plan(d)
    expect(p.missing.length).toBeGreaterThan(0)
    expect(p.needsConfirmation).toBe(true)
  })
  it('refuses to write without confirmation and writes nothing', () => {
    const d = tmp()
    write(d, 'package.json', pkg())
    const before = readFileSync(path.join(d, 'package.json'), 'utf8')
    expect(() => apply(d)).toThrow(/confirmation required/)
    try {
      apply(d)
    } catch (e) {
      expect((e as { code: string }).code).toBe('NEEDS_CONFIRMATION')
    }
    expect(existsSync(path.join(d, 'src'))).toBe(false)
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(before)
  })
})

describe('apply (L-38, L-39, I-37, I-40)', () => {
  it('fully scaffolds an empty directory with all anchors, dependencies and the lock', () => {
    const d = tmp()
    apply(d)
    expect(detectAnchors(d)).toEqual({ build: true, kit: true, index: true })
    const written = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    const template = JSON.parse(readFileSync(path.join(TEMPLATES.bootstrap, 'package.json'), 'utf8'))
    expect(Object.keys(written.dependencies).sort()).toEqual(Object.keys(template.dependencies).sort())
    expect(Object.keys(written.devDependencies).sort()).toEqual(Object.keys(template.devDependencies).sort())
    expect(existsSync(path.join(d, 'package-lock.json'))).toBe(true)
    expect(existsSync(path.join(d, 'scripts/verify.mjs'))).toBe(true)
    expect(existsSync(path.join(d, 'scripts/inspect-presentation.mjs'))).toBe(true)
  })
  it('does nothing to a fully scaffolded app', () => {
    const d = full()
    const before = readFileSync(path.join(d, 'src/index.css'), 'utf8')
    const r = apply(d)
    expect(r.written).toEqual([])
    expect(readFileSync(path.join(d, 'src/index.css'), 'utf8')).toBe(before)
  })
  it('adds only the missing anchor to a partial scaffold, preserving present anchors, extras and unrelated files', () => {
    const d = full()
    rmSync(path.join(d, 'src/presentation-kit'), { recursive: true })
    write(d, 'src/index.css', '/* mine */')
    write(d, 'src/presentations/mine/Talk.tsx', 'export default () => null')
    write(d, 'notes/keep.md', 'keep')
    const original = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    original.dependencies.lodash = '4'
    delete original.devDependencies.playwright
    writeFileSync(path.join(d, 'package.json'), JSON.stringify(original, null, 2))
    const registryBefore = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    const r = apply(d, { confirmed: true })
    expect(r.missing).toEqual(['kit'])
    expect(r.written.filter((f) => f !== 'package.json').every((f) => f.startsWith('src/presentation-kit'))).toBe(true)
    expect(detectAnchors(d).kit).toBe(true)
    expect(readFileSync(path.join(d, 'src/index.css'), 'utf8')).toBe('/* mine */')
    expect(readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')).toBe(registryBefore)
    expect(readFileSync(path.join(d, 'notes/keep.md'), 'utf8')).toBe('keep')
    const merged = JSON.parse(readFileSync(path.join(d, 'package.json'), 'utf8'))
    expect(merged.dependencies.lodash).toBe('4')
    expect(merged.devDependencies.playwright).toBeTruthy()
  })
  it('scaffolds a monorepo into a self-contained presentations/ app and leaves the root alone', () => {
    const d = tmp()
    write(d, 'pnpm-workspace.yaml', 'packages: []')
    write(d, 'package.json', pkg({}, { build: 'turbo' }))
    const rootPkg = readFileSync(path.join(d, 'package.json'), 'utf8')
    const r = apply(d, { confirmed: true })
    expect(r.target).toBe(path.join(d, 'presentations'))
    expect(detectAnchors(path.join(d, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(readFileSync(path.join(d, 'package.json'), 'utf8')).toBe(rootPkg)
    expect(existsSync(path.join(d, 'src'))).toBe(false)
    expect(existsSync(path.join(d, 'presentations/package.json'))).toBe(true)
  })
  it('merges package.json without changing existing entries', () => {
    const { merged, added } = mergePackageJson({ dependencies: { react: '^18' }, scripts: { build: 'mine' } }, { dependencies: { react: '^19', motion: '1' }, scripts: { build: 'x', verify: 'v' } })
    expect(merged.dependencies).toEqual({ react: '^18', motion: '1' })
    expect(merged.scripts).toEqual({ build: 'mine', verify: 'v' })
    expect(added).toEqual(['dependencies.motion', 'scripts.verify'])
  })
})

describe('skill-relative template resolution (L-41, I-39)', () => {
  it('resolves both template families next to the script, not the working directory', () => {
    expect(SKILL_DIR).toBe(path.resolve('skills/presentation'))
    expect(TEMPLATES.bootstrap).toBe(path.join(SKILL_DIR, 'templates/bootstrap'))
    expect(TEMPLATES.presentation).toBe(path.join(SKILL_DIR, 'templates/presentation'))
    expect(existsSync(path.join(TEMPLATES.bootstrap, 'package.json'))).toBe(true)
    expect(existsSync(path.join(TEMPLATES.presentation, 'Talk.tsx'))).toBe(true)
  })
  it('works when invoked from an unrelated working directory', () => {
    const elsewhere = tmp()
    const target = tmp()
    const run = spawnSync(process.execPath, [path.resolve('skills/presentation/scripts/scaffold.mjs'), 'apply', target], { cwd: elsewhere, encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(existsSync(path.join(target, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
  })
  it('exits with code 2 and writes nothing when confirmation is missing', () => {
    const d = tmp()
    write(d, 'a.txt', 'x')
    const run = spawnSync(process.execPath, [path.resolve('skills/presentation/scripts/scaffold.mjs'), 'apply', d], { cwd: tmp(), encoding: 'utf8' })
    expect(run.status).toBe(2)
    expect(run.stderr).toMatch(/confirmation required/)
    expect(existsSync(path.join(d, 'src'))).toBe(false)
  })
})

describe('creating a presentation preserves the others (L-44, I-43)', () => {
  const registry = `import type { PresentationEntry } from './types'\n\nexport const presentations: PresentationEntry[] = [\n  {\n    slug: 'one',\n    title: 'One',\n    load: () => import('./one/Talk'),\n  },\n  {\n    slug: 'two',\n    title: 'Two',\n    load: () => import('./two/Talk'),\n  },\n]\n`
  it('adds a third entry, keeping the first two lines intact', () => {
    const out = registerPresentation(registry, { slug: 'three', title: 'Three' })
    expect(out.startsWith(registry.slice(0, registry.lastIndexOf('\n]')))).toBe(true)
    expect(out).toContain("slug: 'one'")
    expect(out).toContain("slug: 'two'")
    expect(out).toContain('slug: "three"')
    expect(out).toMatch(/import\('\.\/three\/Talk'\)/)
    expect(() => registerPresentation(out, { slug: 'three', title: 'x' })).toThrow(/already registered/)
    expect(() => registerPresentation('export const x = 1', { slug: 'a', title: 'a' })).toThrow(/cannot find/)
  })
  it('writes a self-contained folder and leaves existing presentation files and entries untouched', () => {
    const d = full()
    const existing = ['src/presentations/starter/Talk.tsx', 'src/presentations/starter/Scene.tsx', 'src/presentations/starter/presentation.css']
    const before = existing.map((f) => readFileSync(path.join(d, f), 'utf8'))
    const registryBefore = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    const r = createPresentation(d, { slug: 'my-deck', title: 'My "Deck"' })
    expect(r.written.map((f) => path.basename(f)).sort()).toEqual(['Scene.tsx', 'Talk.tsx', 'entities.ts', 'presentation.css', 'steps.ts'])
    expect(existing.map((f) => readFileSync(path.join(d, f), 'utf8'))).toEqual(before)
    const registryAfter = readFileSync(path.join(d, 'src/presentations/index.ts'), 'utf8')
    expect(registryAfter).toContain(registryBefore.slice(0, registryBefore.lastIndexOf('\n]')))
    expect(registryAfter).toContain('"My \\"Deck\\""')
    const css = readFileSync(path.join(d, 'src/presentations/my-deck/presentation.css'), 'utf8')
    expect(css).toContain('.deck-my-deck')
    expect(readFileSync(path.join(d, 'src/presentations/my-deck/entities.ts'), 'utf8')).not.toMatch(/__SLUG__/)
    expect(() => createPresentation(d, { slug: 'my-deck', title: 'x' })).toThrow(/already exists/)
    expect(() => createPresentation(d, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
  })
})
