// @vitest-environment node
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  applyScaffold,
  createPresentation,
  detectAnchors,
  isMonorepo,
  planScaffold,
  registerPresentation,
  resolveTarget,
  SKILL_DIR,
  templatePath,
} from '../../../skills/presentation/scripts/scaffold.mjs'

const tmpRoots: string[] = []
function tmp(): string {
  const d = mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
  tmpRoots.push(d)
  return d
}
afterAll(() => tmpRoots.forEach((d) => rmSync(d, { recursive: true, force: true })))

const put = (dir: string, rel: string, text: string) => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), text)
}
const BOOTSTRAP = templatePath('bootstrap')
const tree = (dir: string, rel = ''): string[] =>
  readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' ? [] : e.isDirectory() ? tree(dir, path.join(rel, e.name)) : [path.join(rel, e.name)],
  )

/** A project with just the build anchor. */
function buildOnly(dir: string, extra: object = {}) {
  put(dir, 'package.json', JSON.stringify({ name: 'host', scripts: { build: 'vite build' }, dependencies: { react: '^18.0.0' }, ...extra }, null, 4))
  put(dir, 'vite.config.mts', 'export default {}')
  put(dir, 'tsconfig.json', '{}')
  put(dir, 'README.md', 'keep me')
}
/** Materialize the bootstrap template (all anchors). */
function full(dir: string) {
  cpSync(BOOTSTRAP, dir, { recursive: true })
  rmSync(path.join(dir, '_gitignore'))
}

describe('skill-relative resolution (L-37)', () => {
  it('finds templates next to the skill file regardless of the working directory', () => {
    const cwd = process.cwd()
    const elsewhere = tmp()
    try {
      process.chdir(elsewhere)
      expect(templatePath('bootstrap')).toBe(path.join(SKILL_DIR, 'templates', 'bootstrap'))
      expect(existsSync(path.join(templatePath('bootstrap'), 'package.json'))).toBe(true)
      expect(existsSync(path.join(templatePath('presentation'), 'Talk.tsx'))).toBe(true)
      expect(planScaffold(elsewhere).files.every((f: { from: string }) => f.from.startsWith(SKILL_DIR))).toBe(true)
    } finally {
      process.chdir(cwd)
    }
  })
})

describe('anchor detection by contract (L-31)', () => {
  it('finds none in an empty directory', () => {
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it('finds all three in the materialized template', () => {
    const dir = tmp()
    full(dir)
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  const KIT_STUBS = `
export interface Step { id: string }
export interface SceneProps { payload: unknown }
export function Stage() { return <AnimatePresence /> }
export function Presentation() { window.addEventListener('keydown', () => {}); return <Stage /> }
export const fitScale = () => scale
`

  it('does not depend on file naming, formatting or extra dependencies', () => {
    const dir = tmp()
    buildOnly(dir, { devDependencies: { tailwindcss: '^4' }, name: 'other' })
    put(dir, 'src/engine/core/everything.tsx', KIT_STUBS)
    put(dir, 'src/routes/registry.js', "export const talks = [{\n  slug: 'a',\n  load: () => import('./a.js') }]")
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('does not accept empty stubs or name-only matches as the engine contract', () => {
    const dir = tmp()
    put(dir, 'src/kit/index.tsx', 'export function Presentation() {}\nexport function Stage() {}\ntype Step = {}\ntype SceneProps = {}')
    expect(detectAnchors(dir).kit).toBe(false)
    put(dir, 'src/routes.ts', "export const x = { slug: 'a' }")
    expect(detectAnchors(dir).index).toBe(false)
  })

  it('does not count a build script without Vite, or a half kit', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ scripts: { build: 'tsc' } }))
    put(dir, 'src/ui/Stage.tsx', 'export function Stage() {}')
    expect(detectAnchors(dir)).toEqual({ build: false, kit: false, index: false })
  })
})

describe('target resolution (L-38, L-39, L-40)', () => {
  it.each([
    ['workspaces in package.json', (d: string) => put(d, 'package.json', JSON.stringify({ workspaces: ['pkgs/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => put(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['packages/ layout', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['apps/ layout', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ])('detects a monorepo from %s and targets presentations/', (_n, seed) => {
    const dir = tmp()
    seed(dir)
    put(dir, 'unrelated.txt', 'x')
    expect(isMonorepo(dir)).toBe(true)
    const r = resolveTarget(dir)
    expect(r).toMatchObject({ kind: 'monorepo', target: path.join(dir, 'presentations'), needsConfirmation: true })
    const plan = planScaffold(dir)
    expect(plan.files.length).toBeGreaterThan(0)
    expect(plan.files.every((f: { to: string }) => f.to.startsWith(path.join(dir, 'presentations') + path.sep))).toBe(true)
  })

  it('targets the root for an empty directory without needing confirmation', () => {
    const dir = tmp()
    expect(resolveTarget(dir)).toMatchObject({ kind: 'empty', target: dir, needsConfirmation: false })
  })

  it('targets the root of a standalone project and asks for confirmation', () => {
    const dir = tmp()
    buildOnly(dir)
    expect(isMonorepo(dir)).toBe(false)
    expect(resolveTarget(dir)).toMatchObject({ kind: 'standalone', target: dir, needsConfirmation: true })
  })

  it('reuses an existing presentation app even when workspace signals exist', () => {
    const dir = tmp()
    full(dir)
    put(dir, 'pnpm-workspace.yaml', 'packages: []')
    mkdirSync(path.join(dir, 'packages'))
    const r = resolveTarget(dir)
    expect(r).toMatchObject({ kind: 'existing-app', target: dir })
    expect(planScaffold(dir).scaffold).toBe(false)
  })

  it('reuses an existing nested presentations/ app in a monorepo', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ workspaces: ['presentations'] }))
    full(path.join(dir, 'presentations'))
    expect(resolveTarget(dir)).toMatchObject({ kind: 'existing-app', target: path.join(dir, 'presentations') })
  })
})

describe('scaffold plans (L-32..L-36)', () => {
  it('plans every anchor for an empty target', () => {
    const plan = planScaffold(tmp())
    expect(plan.missingAnchors.sort()).toEqual(['build', 'index', 'kit'])
    expect(plan.scaffold).toBe(true)
    expect(Object.keys(plan.addDependencies).sort()).toEqual(['lucide-react', 'motion', 'react', 'react-dom'])
    expect(plan.needsInstall).toBe(true)
    expect(plan.files.some((f: { rel: string }) => f.rel === '.gitignore')).toBe(true)
    expect(plan.files.every((f: { action: string }) => f.action === 'create')).toBe(true)
  })

  it('writes nothing and adds nothing when all anchors and dependencies exist', () => {
    const dir = tmp()
    full(dir)
    const before = tree(dir)
    const plan = planScaffold(dir)
    expect(plan).toMatchObject({ scaffold: false, files: [], addScripts: {}, missingAnchors: [], addDependencies: {}, addDevDependencies: {} })
    applyScaffold(plan)
    expect(tree(dir)).toEqual(before)
  })

  it('treats cosmetic differences as scaffolded', () => {
    const dir = tmp()
    full(dir)
    put(dir, 'package.json', JSON.stringify({ ...JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')), name: 'renamed' }, null, 8))
    expect(planScaffold(dir).scaffold).toBe(false)
  })

  const combos: [string, string[]][] = [
    ['kit only missing', ['kit']],
    ['index only missing', ['index']],
    ['kit and index missing', ['kit', 'index']],
    ['build only missing', ['build']],
  ]
  it.each(combos)('partial scaffold (%s) writes only the missing anchors and preserves the rest', (_n, missing) => {
    const dir = tmp()
    full(dir)
    if (missing.includes('kit')) rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    if (missing.includes('index')) rmSync(path.join(dir, 'src/presentations'), { recursive: true })
    if (missing.includes('build')) rmSync(path.join(dir, 'vite.config.ts'))
    put(dir, 'notes.md', 'unrelated')
    const sentinel = path.join(dir, 'package.json')
    const pkgBefore = JSON.parse(readFileSync(sentinel, 'utf8'))
    pkgBefore.dependencies.react = '^1.2.3'
    pkgBefore.name = 'mine'
    writeFileSync(sentinel, JSON.stringify(pkgBefore, null, 2))
    const present = tree(dir).filter((f) => !f.startsWith('src/presentation') || !missing.length)
    const snapshot = Object.fromEntries(present.map((f) => [f, readFileSync(path.join(dir, f), 'utf8')]))
    const plan = planScaffold(dir)
    expect(plan.missingAnchors.sort()).toEqual([...missing].sort())
    expect(plan.files.every((f: { anchor: string }) => missing.includes(f.anchor) || f.anchor === 'tooling')).toBe(true)
    applyScaffold(plan)
    for (const [f, text] of Object.entries(snapshot)) {
      if (f === 'package.json') continue
      expect(readFileSync(path.join(dir, f), 'utf8'), f).toBe(text)
    }
    const pkgAfter = JSON.parse(readFileSync(sentinel, 'utf8'))
    expect(pkgAfter.name).toBe('mine')
    expect(pkgAfter.dependencies.react).toBe('^1.2.3')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('adds only missing infrastructure to a host with its own build setup and keeps unrelated content', () => {
    const dir = tmp()
    buildOnly(dir)
    const plan = planScaffold(dir)
    expect(plan.missingAnchors.sort()).toEqual(['index', 'kit'])
    const result = applyScaffold(plan)
    expect(readFileSync(path.join(dir, 'README.md'), 'utf8')).toBe('keep me')
    expect(existsSync(path.join(dir, 'vite.config.mts'))).toBe(true)
    expect(existsSync(path.join(dir, 'vite.config.ts'))).toBe(false)
    expect(result.written).toContain('src/presentation-kit/index.ts')
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.scripts.build).toBe('vite build')
    expect(Object.keys(pkg.dependencies)).toEqual(expect.arrayContaining(['motion', 'lucide-react', 'react-dom']))
    expect(Object.keys(pkg.devDependencies)).toEqual(expect.arrayContaining(['playwright', 'vite', 'typescript']))
  })

  it('ships verification tooling with a partial scaffold so every added npm script has its target', () => {
    const dir = tmp()
    buildOnly(dir)
    applyScaffold(planScaffold(dir))
    const scripts = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts as Record<string, string>
    expect(scripts.verify).toBeDefined()
    for (const command of Object.values(scripts)) {
      for (const target of command.match(/scripts\/[\w./-]+/g) ?? []) expect(existsSync(path.join(dir, target)), target).toBe(true)
    }
    for (const rel of ['scripts/lib/render.mjs', 'scripts/lib/page-snapshot.mjs', 'scripts/lib/verify-core.mjs', 'presentation.config.json']) {
      expect(existsSync(path.join(dir, rel)), rel).toBe(true)
    }
  })

  it('does not add tooling when nothing is scaffolded', () => {
    const dir = tmp()
    full(dir)
    rmSync(path.join(dir, 'scripts'), { recursive: true })
    expect(planScaffold(dir).files).toEqual([])
  })

  it('never overwrites a file that already exists, reporting it as skipped', () => {
    const dir = tmp()
    buildOnly(dir)
    put(dir, 'src/main.tsx', '// mine')
    const result = applyScaffold(planScaffold(dir))
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('// mine')
    expect(result.skipped).toContain('src/main.tsx')
  })

  it('scaffolds a monorepo app without touching the root', () => {
    const dir = tmp()
    put(dir, 'package.json', JSON.stringify({ name: 'root', workspaces: ['packages/*'] }, null, 2))
    put(dir, 'packages/lib/index.ts', 'x')
    const rootBefore = readFileSync(path.join(dir, 'package.json'), 'utf8')
    applyScaffold(planScaffold(dir))
    expect(readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(rootBefore)
    expect(existsSync(path.join(dir, 'presentations', 'package.json'))).toBe(true)
    expect(existsSync(path.join(dir, 'presentations', 'src', 'presentation-kit', 'Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
  })

  it('declares the complete dependency set in the template (L-36)', () => {
    const pkg = JSON.parse(readFileSync(path.join(BOOTSTRAP, 'package.json'), 'utf8'))
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['lucide-react', 'motion', 'react', 'react-dom'])
    for (const dev of [
      'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint',
      '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]) {
      expect(pkg.devDependencies, dev).toHaveProperty(dev)
    }
    const lock = JSON.parse(readFileSync(path.join(BOOTSTRAP, 'package-lock.json'), 'utf8'))
    for (const name of [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]) {
      expect(lock.packages[`node_modules/${name}`], name).toBeDefined()
    }
    expect(pkg.scripts).toMatchObject({ build: 'tsc -b && vite build', verify: expect.any(String), inspect: expect.any(String), lint: expect.any(String) })
  })
})

describe('registration and creation (L-41, L-43)', () => {
  const app = () => {
    const dir = tmp()
    full(dir)
    return dir
  }
  const registry = (dir: string) => path.join(dir, 'src/presentations/index.ts')

  it('appends one entry and preserves the original text byte for byte', () => {
    const dir = app()
    const before = readFileSync(registry(dir), 'utf8')
    registerPresentation(dir, { slug: 'second-talk', title: 'Second "Talk"' })
    const after = readFileSync(registry(dir), 'utf8')
    const head = before.slice(0, before.lastIndexOf('\n]'))
    expect(after.startsWith(head)).toBe(true)
    expect(after.endsWith(before.slice(before.lastIndexOf('\n]')))).toBe(true)
    expect(after).toContain("slug: 'second-talk'")
    expect(after).toContain(`title: "Second \\"Talk\\""`)
    expect(after).toContain("import('./second-talk/Talk.tsx')")
    expect(after).toContain("slug: 'starter'")
  })

  it('rejects duplicate and invalid slugs', () => {
    const dir = app()
    expect(() => registerPresentation(dir, { slug: 'starter', title: 'x' })).toThrow(/already registered/)
    expect(() => registerPresentation(dir, { slug: 'Bad Slug', title: 'x' })).toThrow(/invalid slug/)
    expect(() => registerPresentation(dir, { slug: '../x', title: 'x' })).toThrow(/invalid slug/)
  })

  it('creates a self-contained folder from the template and registers it, leaving others intact', () => {
    const dir = app()
    const starterBefore = tree(path.join(dir, 'src/presentations/starter')).map((f) => readFileSync(path.join(dir, 'src/presentations/starter', f), 'utf8'))
    createPresentation(dir, { slug: 'my-talk', title: "It's a talk" })
    const folder = path.join(dir, 'src/presentations/my-talk')
    expect(tree(folder).sort()).toEqual(['Talk.tsx', 'entities.ts', 'outline.ts', 'steps/Scene.tsx', 'steps/index.ts', 'talk.css'].sort())
    expect(readFileSync(path.join(folder, 'outline.ts'), 'utf8')).toContain("TITLE = 'It\\'s a talk'")
    expect(readFileSync(path.join(folder, 'entities.ts'), 'utf8')).toContain("'my-talk-topic'")
    expect(readFileSync(path.join(folder, 'steps/index.ts'), 'utf8')).toContain("groupKey: 'my-talk'")
    expect(readFileSync(registry(dir), 'utf8')).toContain("slug: 'my-talk'")
    const starterAfter = tree(path.join(dir, 'src/presentations/starter')).map((f) => readFileSync(path.join(dir, 'src/presentations/starter', f), 'utf8'))
    expect(starterAfter).toEqual(starterBefore)
    expect(() => createPresentation(dir, { slug: 'my-talk', title: 'again' })).toThrow(/already exists/)
  })
})
