import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { TEMPLATE, detectAnchors, isMonorepo, resolveTarget, scaffold } from '../../skills/presentation/scripts/scaffold.mjs'

const made: string[] = []
const project = () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
  made.push(dir)
  return dir
}
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true })
})
const put = (root: string, file: string, content = 'x') => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  writeFileSync(path.join(root, file), content)
}
const snapshot = (dir: string): Record<string, string> =>
  Object.fromEntries(
    readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter((f) => statSync(path.join(dir, f)).isFile())
      .map((f) => [f, readFileSync(path.join(dir, f), 'utf8')]),
  )

const buildOnly = (root: string) => {
  put(root, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'tsc -b && vite build' }, dependencies: { react: '^19' }, devDependencies: { vite: '^8' } }))
  put(root, 'tsconfig.json', '{}')
  put(root, 'README.md', 'host readme')
}
const addKit = (root: string) => {
  put(root, 'src/presentation-kit/MyPresentation.tsx')
  put(root, 'src/presentation-kit/layout/Stage.tsx')
}
const addIndex = (root: string) => put(root, 'src/presentations/index.js', 'export default []')

describe('detectAnchors', () => {
  it('finds nothing in an empty directory', () => {
    expect(detectAnchors(project())).toEqual({ build: false, kit: false, index: false })
  })

  it('detects each anchor by function, tolerating naming, formatting, and extra dependencies', () => {
    const dir = project()
    buildOnly(dir)
    put(dir, 'package.json', JSON.stringify({ scripts: { build: 'vite build' }, dependencies: { react: '1', lodash: '1' }, devDependencies: { vite: '1' } }))
    put(dir, 'tsconfig.app.json', '// comment')
    addKit(dir)
    addIndex(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not treat a build script without vite, react, or a tsconfig as the build anchor', () => {
    const dir = project()
    put(dir, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1' } }))
    put(dir, 'tsconfig.json', '{}')
    expect(detectAnchors(dir).build).toBe(false)
    put(dir, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1', vite: '1' } }))
    expect(detectAnchors(dir).build).toBe(true)
    rmSync(path.join(dir, 'tsconfig.json'))
    expect(detectAnchors(dir).build).toBe(false)
  })

  it('needs both a presentation file and a stage file for the kit', () => {
    const dir = project()
    put(dir, 'src/presentation-kit/Presentation.tsx')
    expect(detectAnchors(dir).kit).toBe(false)
    put(dir, 'src/presentation-kit/Stage.tsx')
    expect(detectAnchors(dir).kit).toBe(true)
  })
})

describe('resolveTarget', () => {
  it.each([
    ['workspaces in package.json', (d: string) => put(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => put(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['a packages/ directory', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['an apps/ directory', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('puts the app in presentations/ for a monorepo signalled by %s', (_name, signal) => {
    const dir = project()
    signal(dir)
    expect(isMonorepo(dir)).toBe(true)
    expect(resolveTarget(dir)).toEqual({ target: path.join(dir, 'presentations'), existing: false })
  })

  it('uses the root for an empty or standalone project', () => {
    const empty = project()
    expect(resolveTarget(empty)).toEqual({ target: empty, existing: false })
    const standalone = project()
    buildOnly(standalone)
    expect(isMonorepo(standalone)).toBe(false)
    expect(resolveTarget(standalone)).toEqual({ target: standalone, existing: false })
  })

  it('does not mistake a build-only monorepo root for a presentation app', () => {
    const dir = project()
    buildOnly(dir)
    put(dir, 'pnpm-workspace.yaml', 'packages: []')
    expect(detectAnchors(dir).build).toBe(true)
    expect(resolveTarget(dir)).toEqual({ target: path.join(dir, 'presentations'), existing: false })
  })

  it('reuses an existing presentation app at the root or in presentations/ without relocating it', () => {
    const atRoot = project()
    addKit(atRoot)
    addIndex(atRoot)
    put(atRoot, 'pnpm-workspace.yaml', '')
    expect(resolveTarget(atRoot)).toEqual({ target: atRoot, existing: true })
    const nested = project()
    put(nested, 'apps/x/file', '')
    addKit(path.join(nested, 'presentations'))
    addIndex(path.join(nested, 'presentations'))
    expect(resolveTarget(nested)).toEqual({ target: path.join(nested, 'presentations'), existing: true })
  })
})

describe('scaffold', () => {
  const ANCHORS = ['build', 'kit', 'index'] as const
  const set = { build: buildOnlyIn, kit: addKit, index: addIndex }
  function buildOnlyIn(root: string) {
    buildOnly(root)
  }

  it('does a full scaffold into an empty directory: all three anchors, lock data, and the dependency set', () => {
    const dir = project()
    const report = scaffold(dir)
    expect(report.target).toBe(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(path.join(dir, '.gitignore'))).toBe(true)
    expect(existsSync(path.join(dir, 'gitignore.template'))).toBe(false)
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
    expect(report.missingDependencies).toEqual([])
    expect(report.skipped).toEqual([])
  })

  it('scaffolds a monorepo app into presentations/ and leaves the root untouched', () => {
    const dir = project()
    buildOnly(dir)
    put(dir, 'pnpm-workspace.yaml', 'packages: []')
    const before = snapshot(dir)
    const report = scaffold(dir)
    expect(report.target).toBe(path.join(dir, 'presentations'))
    const after = snapshot(dir)
    for (const [file, content] of Object.entries(before)) expect(after[file], file).toBe(content)
    expect(detectAnchors(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('presentations'))).toBe(true)
  })

  it('does nothing for an app that already has all three anchors', () => {
    const dir = project()
    scaffold(dir)
    const before = snapshot(dir)
    const report = scaffold(dir)
    expect(report.existingApp).toBe(true)
    expect(report.copied).toEqual([])
    expect(snapshot(dir)).toEqual(before)
  })

  // Every partial combination: the missing anchors are added, the present ones are untouched.
  const combos = [1, 2, 3, 4, 5, 6].map((n) => ANCHORS.filter((_, i) => (n >> i) & 1))
  it.each(combos.map((present) => [present.join('+'), present]))('adds only the missing anchors when %s exist', (_name, present) => {
    const dir = project()
    for (const anchor of present) set[anchor as 'build' | 'kit' | 'index'](dir)
    const before = snapshot(dir)
    const report = scaffold(dir)
    const after = snapshot(dir)
    for (const [file, content] of Object.entries(before)) expect(after[file], `${file} must be unchanged`).toBe(content)
    const absent = ANCHORS.filter((a) => !present.includes(a))
    const touched = report.copied as string[]
    expect(touched.length).toBeGreaterThan(0)
    if (present.includes('kit')) expect(touched.some((f) => f.startsWith('src/presentation-kit'))).toBe(false)
    if (present.includes('index')) expect(touched.some((f) => f.startsWith('src/presentations/'))).toBe(false)
    if (present.includes('build')) expect(touched).not.toContain('vite.config.ts')
    for (const anchor of absent) {
      if (anchor === 'kit') expect(touched.some((f) => f.startsWith('src/presentation-kit'))).toBe(true)
      if (anchor === 'index') expect(touched).toContain('src/presentations/index.ts')
      if (anchor === 'build') expect(touched).toContain('vite.config.ts')
    }
  })

  it('never overwrites an existing file even inside a missing anchor, and lists missing dependencies', () => {
    const dir = project()
    buildOnly(dir)
    put(dir, 'src/main.tsx', 'my own entry point')
    const report = scaffold(dir)
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('my own entry point')
    expect(report.skipped).toContain('src/main.tsx')
    expect(report.missingDependencies.some((d: string) => d.startsWith('motion@'))).toBe(true)
    expect(report.missingDependencies.some((d: string) => d.startsWith('react@'))).toBe(false)
    expect(readFileSync(path.join(dir, 'package.json'), 'utf8')).toContain('"host"')
  })

  it('writes nothing in dry-run mode but reports the same plan', () => {
    const dir = project()
    const dry = scaffold(dir, { dryRun: true })
    expect(readdirSync(dir)).toEqual([])
    const real = scaffold(dir)
    expect(dry.copied).toEqual(real.copied)
    expect(dry.target).toBe(real.target)
  })

  it('copies template content byte for byte', () => {
    const dir = project()
    scaffold(dir)
    expect(readFileSync(path.join(dir, 'src/presentation-kit/Stage.tsx'), 'utf8')).toBe(readFileSync(path.join(TEMPLATE, 'src/presentation-kit/Stage.tsx'), 'utf8'))
  })
})

describe('skill-relative template lookup', () => {
  it('finds its templates from a different working directory, and from a relocated copy of the skill', () => {
    const target = project()
    const elsewhere = project()
    const run = (script: string, args: string[]) =>
      spawnSync(process.execPath, [script, ...args], { cwd: elsewhere, encoding: 'utf8' })
    const direct = run(path.resolve('skills/presentation/scripts/scaffold.mjs'), ['--root', target])
    expect(direct.status, direct.stderr).toBe(0)
    expect(detectAnchors(target)).toEqual({ build: true, kit: true, index: true })

    const moved = project()
    cpSync(path.resolve('skills/presentation'), path.join(moved, 'skill'), { recursive: true })
    const target2 = project()
    const viaCopy = run(path.join(moved, 'skill/scripts/scaffold.mjs'), ['--root', target2])
    expect(viaCopy.status, viaCopy.stderr).toBe(0)
    expect(JSON.parse(viaCopy.stdout).copied).toEqual(JSON.parse(direct.stdout).copied)
    expect(readFileSync(path.join(target2, 'src/presentation-kit/types.ts'), 'utf8')).toBe(readFileSync(path.join(moved, 'skill/templates/bootstrap/src/presentation-kit/types.ts'), 'utf8'))
  })
})
