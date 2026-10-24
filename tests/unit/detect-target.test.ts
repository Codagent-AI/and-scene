import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { BOOTSTRAP } from '../../skills/presentation/scripts/scaffold.mjs'
import { detectTarget } from '../../skills/presentation/scripts/detect-target.mjs'

const dirs: string[] = []
function project(files: Record<string, string | object>): string {
  const dir = mkdtempSync(join(tmpdir(), 'detect-target-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), typeof content === 'string' ? content : JSON.stringify(content))
  }
  return dir
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

const BUILD = {
  'package.json': {
    scripts: { build: 'tsc -b && vite build' },
    dependencies: { react: '1' },
    devDependencies: { vite: '1', typescript: '1' },
  },
  'vite.config.ts': "import { defineConfig } from 'vite'\nexport default defineConfig({})",
  'tsconfig.json': '{ "compilerOptions": {} }',
}
const KIT = {
  'src/presentation-kit/Presentation.tsx': 'export function Presentation({ steps }) { return steps.length }',
  'src/presentation-kit/Stage.tsx': 'export function Stage({ steps, index }) { const Scene = steps[index].Scene; return Scene }',
  'src/presentation-kit/types.ts': 'export interface Step { id: string; Scene: unknown }',
  'src/presentation-kit/nav.ts': "export const onKey = (e) => e.key === 'ArrowRight'",
  'src/presentation-kit/fit.ts': 'export const scale = (w, h) => Math.min(w / 880, h / 380)',
}
const INDEX = { 'src/presentations/index.ts': "export const presentations = [{ slug: 'a', load: () => import('./a') }]" }

describe('detectTarget', () => {
  it('scaffolds everything at the root of an empty directory without confirmation', () => {
    const dir = project({})
    const r = detectTarget(dir)
    expect(r).toMatchObject({ target: dir, scaffold: 'full', empty: true, confirmRequired: false })
    expect(r.missing).toEqual(['build', 'kit', 'index'])
  })

  it('ignores .git when judging emptiness', () => {
    const dir = project({ '.git/HEAD': 'ref' })
    expect(detectTarget(dir).empty).toBe(true)
  })

  it('does nothing when all three anchors are present', () => {
    const dir = project({ ...BUILD, ...KIT, ...INDEX })
    expect(detectTarget(dir)).toMatchObject({ target: dir, scaffold: 'none', missing: [], confirmRequired: false })
  })

  it('scaffolds only the missing anchors in a partial app and asks to confirm', () => {
    const dir = project({ ...BUILD, ...KIT })
    const r = detectTarget(dir)
    expect(r).toMatchObject({ target: dir, scaffold: 'partial', missing: ['index'], confirmRequired: true })
  })

  it('treats a standalone non-empty project as a root scaffold needing confirmation', () => {
    const dir = project({ 'README.md': 'hi', 'package.json': { name: 'x' } })
    expect(detectTarget(dir)).toMatchObject({ target: dir, scaffold: 'full', confirmRequired: true, monorepo: false })
  })

  it.each([
    ['package.json workspaces', { 'package.json': { workspaces: ['packages/*'] } }],
    ['pnpm-workspace.yaml', { 'pnpm-workspace.yaml': 'packages: []', 'package.json': {} }],
    ['packages/ layout', { 'packages/a/index.js': '', 'package.json': {} }],
    ['apps/ layout', { 'apps/a/index.js': '', 'package.json': {} }],
  ])('scaffolds a self-contained presentations/ app in a monorepo (%s)', (_name, files) => {
    const dir = project({ ...files, 'README.md': 'unrelated' })
    const r = detectTarget(dir)
    expect(r.monorepo).toBe(true)
    expect(r.target).toBe(join(dir, 'presentations'))
    expect(r.scaffold).toBe('full')
    expect(r.confirmRequired).toBe(true)
  })

  it('leaves an existing root build setup alone in a monorepo and targets presentations/', () => {
    const dir = project({ ...BUILD, 'package.json': { ...BUILD['package.json'], workspaces: ['x'] } })
    const r = detectTarget(dir)
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r.target).toBe(join(dir, 'presentations'))
  })

  it('reuses an existing presentations/ app in a monorepo and scaffolds only what is missing', () => {
    const dir = project({
      'package.json': { workspaces: ['x'] },
      ...Object.fromEntries(Object.entries({ ...BUILD, ...KIT }).map(([k, v]) => [`presentations/${k}`, v])),
    })
    const r = detectTarget(dir)
    expect(r.target).toBe(join(dir, 'presentations'))
    expect(r).toMatchObject({ scaffold: 'partial', missing: ['index'], existingTarget: true })
  })

  it('uses the app itself when run from inside an existing presentation app of a monorepo', () => {
    const dir = project({ ...BUILD, ...KIT, ...INDEX, 'apps/other/x': '' })
    expect(detectTarget(dir)).toMatchObject({ target: dir, scaffold: 'none' })
  })

  it('detects anchors by contract: renamed and reorganised equivalents count', () => {
    const dir = project({
      ...BUILD,
      'vite.config.mjs': "export default { plugins: [] }",
      'src/engine/ScenePresenter.jsx': 'export const Presentation = ({ steps }) => steps.length',
      'src/engine/host.js': 'export function Stage({ steps }) { return steps[0].Scene }',
      'src/engine/contract.d.ts': 'export interface Step { id: string; Scene: unknown }',
      'src/engine/input.js': "window.addEventListener('keydown', () => {})",
      'src/engine/fit.js': 'export const scale = 1',
      'src/routes/registry.js': "export const presentationRegistry = [{ slug: 'a', load: () => import('./a') }]",
      'extra.txt': 'cosmetic',
    })
    expect(detectTarget(dir).anchors).toEqual({ build: true, kit: true, index: true })
  })

  it('does not accept empty or unrelated files that merely have the canonical names', () => {
    const dir = project({
      ...BUILD,
      'src/presentation-kit/Presentation.tsx': '',
      'src/presentation-kit/Stage.tsx': '// export function Stage() {}',
      'src/presentation-kit/types.ts': 'const Step = 1',
      'src/presentations/index.ts': '',
    })
    expect(detectTarget(dir).anchors).toEqual({ build: true, kit: false, index: false })
  })

  it('requires the build anchor to have a build script and core dependencies', () => {
    const dir = project({ ...BUILD, 'package.json': { scripts: {}, dependencies: { react: '1' } } })
    expect(detectTarget(dir).anchors.build).toBe(false)
  })

  it('accepts a build script that reaches vite through another npm script', () => {
    const pkg = { ...BUILD['package.json'], scripts: { build: 'npm run compile', compile: 'vite build' } }
    expect(detectTarget(project({ ...BUILD, 'package.json': pkg })).anchors.build).toBe(true)
  })

  // Acceptance F-001: placeholder files must not read as a complete presentation app.
  it('does not accept placeholder build files or contract stubs as anchors', () => {
    const dir = project({
      'package.json': { scripts: { build: 'echo build' }, dependencies: { react: '1' }, devDependencies: { vite: '1', typescript: '1' } },
      'vite.config.ts': '',
      'tsconfig.json': '',
      'src/stubs.ts':
        'export function Presentation() {}\nexport function Stage() {}\nexport interface Step {}\nexport const presentations = []',
    })
    const r = detectTarget(dir)
    expect(r.anchors).toEqual({ build: false, kit: false, index: false })
    expect(r).toMatchObject({ scaffold: 'full', missing: ['build', 'kit', 'index'], confirmRequired: true })
  })

  it.each([
    ['a build script that never runs vite', { 'package.json': { ...BUILD['package.json'], scripts: { build: 'tsc -b' } } }],
    ['an empty vite config', { 'vite.config.ts': '// nothing here' }],
    ['a tsconfig that configures nothing', { 'tsconfig.json': '{}' }],
  ])('rejects the build anchor with %s', (_name, override) => {
    expect(detectTarget(project({ ...BUILD, ...override })).anchors.build).toBe(false)
  })

  it('rejects a kit missing navigation or the fit-scale canvas', () => {
    const without = (file: string) => Object.fromEntries(Object.entries(KIT).filter(([path]) => path !== file))
    const noNav = without('src/presentation-kit/nav.ts')
    const noFit = without('src/presentation-kit/fit.ts')
    expect(detectTarget(project({ ...BUILD, ...noNav })).anchors.kit).toBe(false)
    expect(detectTarget(project({ ...BUILD, ...noFit })).anchors.kit).toBe(false)
  })

  it('rejects a registry that maps nothing to a slug and loader', () => {
    const dir = project({ ...BUILD, ...KIT, 'src/presentations/index.ts': 'export const presentations = []' })
    expect(detectTarget(dir).anchors.index).toBe(false)
  })

  it('recognises the shipped bootstrap template as a complete app', () => {
    expect(detectTarget(BOOTSTRAP)).toMatchObject({ scaffold: 'none', anchors: { build: true, kit: true, index: true } })
  })
})

// Acceptance F-003: the documented `node <skill-dir>/scripts/*.mjs <project-dir>` commands must
// work when the skill directory is reached through a symlink.
describe('CLI entrypoints through a symlinked skill directory', () => {
  const skillDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills', 'presentation')
  const viaSymlink = () => {
    const holder = project({})
    const link = join(holder, 'skill-link')
    symlinkSync(skillDir, link, 'dir')
    return link
  }

  it('detect-target prints its JSON report', () => {
    const target = project({})
    const run = spawnSync('node', [join(viaSymlink(), 'scripts', 'detect-target.mjs'), target], { encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(JSON.parse(run.stdout)).toMatchObject({ scaffold: 'full', empty: true })
  })

  it('scaffold writes the app into an empty target', () => {
    const target = project({})
    const run = spawnSync('node', [join(viaSymlink(), 'scripts', 'scaffold.mjs'), target], { encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(JSON.parse(run.stdout).copied).toContain('package.json')
    expect(detectTarget(target).scaffold).toBe('none')
  })
})
