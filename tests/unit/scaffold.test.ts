import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as scaffold from '../../skills/presentation/scripts/scaffold.mjs'

const { ANCHORS, TEMPLATE_ROOT, applyScaffold, detectAnchors, findMonorepoSignals, planScaffold, resolveTarget } = scaffold
const SCRIPT = fileURLToPath(new URL('../../skills/presentation/scripts/scaffold.mjs', import.meta.url))
const execFileAsync = promisify(execFile)

const BUILD_PKG = {
  name: 'app',
  scripts: { build: 'tsc -b && vite build' },
  dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
  devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' },
}
// Kit fixtures carry real behaviour: the detector checks what the code does, not what it is called.
const KIT_CANONICAL = [
  'export interface Step<P = unknown> { id: string; era: string; title: string; caption: string; scene: unknown; payload: P }',
  'export function Presentation({ steps }: { steps: readonly Step<unknown>[] }) {',
  '  window.addEventListener("keydown", (event) => { if (event.key === "ArrowRight") next() })',
  '  window.addEventListener("touchend", (event) => { swipe(event) })',
  '  const size = window.innerWidth',
  '  const factor = Math.min(size / 880, 1)',
  '  return <div style={{ transform: `scale(${factor})` }}>{steps.map((step) => <p key={step.id}>{step.title}</p>)}</div>',
  '}',
  '',
].join('\n')
// Same behaviour with renamed internals, reformatting, and an export list.
const KIT_RENAMED = [
  'type Frame = { id: string; era: string; title: string; caption: string; scene: unknown; payload: unknown }',
  'function Deck({ steps }: { steps: readonly Frame[] }) {',
  '  window.addEventListener("keydown", (event) => { if (event.key === "ArrowRight") advance() })',
  '  window.addEventListener("touchend", (event) => { swipe(event) })',
  '  const ratio = Math.min(window.innerWidth / 880, window.innerHeight / 380)',
  '  return <div style={{ transform: `scale(${ratio})` }}>{steps.map((frame) => frame.title)}</div>',
  '}',
  'export {',
  '  Deck as Presentation,',
  '}',
  'export type { Frame as Step }',
  '',
].join('\n')
const REGISTRY_OK = "export const PRESENTATIONS = [\n  { slug: 'demo', title: 'Demo', load: () => import('./demo/Talk') },\n]\n"

let dirs: string[] = []

async function tmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffold-test-'))
  dirs.push(dir)
  return dir
}

async function write(root: string, rel: string, content: string): Promise<void> {
  const full = path.join(root, rel)
  await fs.mkdir(path.dirname(full), { recursive: true })
  await fs.writeFile(full, content)
}

const writeBuild = (app: string, pkg: unknown = BUILD_PKG) =>
  Promise.all([
    write(app, 'package.json', JSON.stringify(pkg, null, 2)),
    write(app, 'vite.config.ts', 'export default {}\n'),
  ])
const writeKit = (app: string, content = KIT_CANONICAL) =>
  write(app, 'src/presentation-kit/index.ts', content)
const writeIndex = (app: string, content = REGISTRY_OK) =>
  write(app, 'src/presentations/index.ts', content)

// A synthetic bootstrap template covering every group plus an unrelated file.
async function makeTemplate(): Promise<string> {
  const root = await tmp()
  const tpl = path.join(root, 'template')
  await writeBuild(tpl, { ...BUILD_PKG, dependencies: { ...BUILD_PKG.dependencies, motion: '^12.40.0', 'lucide-react': '^1.17.0' } })
  await Promise.all([
    write(tpl, 'package-lock.json', '{}\n'),
    write(tpl, 'tsconfig.json', '{}\n'),
    write(tpl, 'tsconfig.app.json', '{}\n'),
    write(tpl, 'tsconfig.node.json', '{}\n'),
    write(tpl, 'eslint.config.js', 'export default []\n'),
    write(tpl, 'index.html', '<!doctype html>\n'),
    write(tpl, '.gitignore', 'node_modules\n'),
    write(tpl, 'public/favicon.svg', '<svg/>\n'),
    writeKit(tpl),
    write(tpl, 'src/presentation-kit/nodes/Box.tsx', 'export const Box = 1\n'),
    write(tpl, 'src/main.tsx', 'main\n'),
    write(tpl, 'src/Router.tsx', 'router\n'),
    write(tpl, 'src/Landing.tsx', 'landing\n'),
    write(tpl, 'src/index.css', 'body {}\n'),
    writeIndex(tpl),
    write(tpl, 'scripts/verify.mjs', 'verify\n'),
    write(tpl, 'scripts/inspect-presentation.mjs', 'inspect\n'),
    write(tpl, 'src/presentations/how-to-make-a-presentation/Talk.tsx', 'talk\n'),
    write(tpl, 'README-template.md', 'not part of any group\n'),
  ])
  return tpl
}

beforeEach(() => {
  dirs = []
})

afterEach(async () => {
  await Promise.all(dirs.map((d) => fs.rm(d, { recursive: true, force: true })))
})

describe('detectAnchors', () => {
  const combos: [boolean, boolean, boolean][] = [
    [false, false, false],
    [true, false, false],
    [false, true, false],
    [false, false, true],
    [true, true, false],
    [true, false, true],
    [false, true, true],
    [true, true, true],
  ]

  it.each(combos)('build=%s kit=%s index=%s', async (build, kit, index) => {
    const app = await tmp()
    if (build) await writeBuild(app)
    if (kit) await writeKit(app)
    if (index) await writeIndex(app)
    expect(await detectAnchors(app)).toEqual({ build, kit, index })
  })

  it('counts a renamed, reformatted kit as the kit anchor', async () => {
    const app = await tmp()
    await writeKit(app, KIT_RENAMED)
    expect((await detectAnchors(app)).kit).toBe(true)
  })

  it('does not count stub exports that have the right names but no behaviour', async () => {
    const app = await tmp()
    await writeKit(app, 'export function Presentation() { return null }\nexport function usePresentationNav() {}\nexport type Step = {}\n')
    expect((await detectAnchors(app)).kit).toBe(false)
  })

  it('does not count a kit whose Step type is only a lookalike name', async () => {
    const app = await tmp()
    await writeKit(app, KIT_CANONICAL.replace('export interface Step<P = unknown>', 'export interface StepMeta<P = unknown>'))
    expect((await detectAnchors(app)).kit).toBe(false)
  })

  it('does not count a registry whose load is not a dynamic import', async () => {
    const app = await tmp()
    await writeBuild(app)
    await writeIndex(app, "export const PRESENTATIONS = [\n  { slug: 'demo', title: 'Demo', load: () => demo },\n]\n")
    expect((await detectAnchors(app)).index).toBe(false)
  })

  it('does not count a registry without a load field', async () => {
    const app = await tmp()
    await writeIndex(app, "export const PRESENTATIONS = [{ slug: 'demo', title: 'Demo' }]\n")
    expect((await detectAnchors(app)).index).toBe(false)
  })

  it('does not count a registry without a slug field (legacy case)', async () => {
    const app = await tmp()
    await writeIndex(app, "export const PRESENTATIONS = [{ title: 'Demo', load: () => import('./x') }]\n")
    expect((await detectAnchors(app)).index).toBe(false)
  })

  it('counts a registry with an annotated PRESENTATIONS export', async () => {
    const app = await tmp()
    await writeIndex(app, "export const PRESENTATIONS: Entry[] = [{ slug: 'a', title: 'A', load: () => import('./a') }]\n")
    expect((await detectAnchors(app)).index).toBe(true)
  })

  it('counts a build setup with devDependencies only and a .mts vite config', async () => {
    const app = await tmp()
    await write(app, 'package.json', JSON.stringify({
      scripts: { build: 'vite build' },
      devDependencies: { react: '1', 'react-dom': '1', vite: '1', typescript: '1' },
    }))
    await write(app, 'vite.config.mts', 'export default {}\n')
    expect((await detectAnchors(app)).build).toBe(true)
  })

  it('does not count a build setup without a build script', async () => {
    const app = await tmp()
    await writeBuild(app, { ...BUILD_PKG, scripts: { dev: 'vite' } })
    expect((await detectAnchors(app)).build).toBe(false)
  })
})

describe('findMonorepoSignals', () => {
  it('reports a workspaces field in the root package.json', async () => {
    const dir = await tmp()
    await write(dir, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))
    expect(await findMonorepoSignals(dir)).toEqual(['workspaces'])
  })

  it('reports pnpm-workspace.yaml', async () => {
    const dir = await tmp()
    await write(dir, 'pnpm-workspace.yaml', 'packages:\n  - "apps/*"\n')
    expect(await findMonorepoSignals(dir)).toEqual(['pnpm-workspace.yaml'])
  })

  it('reports a packages/ directory', async () => {
    const dir = await tmp()
    await fs.mkdir(path.join(dir, 'packages'))
    expect(await findMonorepoSignals(dir)).toEqual(['packages/'])
  })

  it('reports an apps/ directory', async () => {
    const dir = await tmp()
    await fs.mkdir(path.join(dir, 'apps'))
    expect(await findMonorepoSignals(dir)).toEqual(['apps/'])
  })

  it('returns no signals for a standalone project', async () => {
    const dir = await tmp()
    await write(dir, 'package.json', JSON.stringify({ name: 'solo' }))
    await write(dir, 'src/index.ts', 'export {}\n')
    expect(await findMonorepoSignals(dir)).toEqual([])
  })
})

describe('resolveTarget', () => {
  it('uses the root when all three anchors are present there', async () => {
    const dir = await tmp()
    await writeBuild(dir)
    await writeKit(dir)
    await writeIndex(dir)
    const target = await resolveTarget(dir)
    expect(target.relation).toBe('root')
    expect(target.appDir).toBe(dir)
    expect(target.needsConfirmation).toBe(false)
  })

  it('targets presentations/ for a monorepo with no existing app', async () => {
    const dir = await tmp()
    await write(dir, 'package.json', JSON.stringify({ workspaces: ['apps/*'] }))
    const target = await resolveTarget(dir)
    expect(target.relation).toBe('presentations')
    expect(target.appDir).toBe(path.join(dir, 'presentations'))
    expect(target.signals).toEqual(['workspaces'])
    expect(target.reason).toContain('workspaces')
  })

  it('reuses anchors already present in presentations/ in a monorepo', async () => {
    const dir = await tmp()
    await fs.mkdir(path.join(dir, 'packages'))
    const app = path.join(dir, 'presentations')
    await writeBuild(app)
    await writeKit(app)
    await writeIndex(app)
    const target = await resolveTarget(dir)
    expect(target.relation).toBe('presentations')
    expect(target.appDir).toBe(app)
    expect(target.anchors).toEqual({ build: true, kit: true, index: true })
    expect(target.needsConfirmation).toBe(false)
  })

  it('scaffolds at the root for a standalone project', async () => {
    const dir = await tmp()
    await write(dir, 'package.json', JSON.stringify({ name: 'solo' }))
    const target = await resolveTarget(dir)
    expect(target.relation).toBe('root')
    expect(target.appDir).toBe(dir)
    expect(target.signals).toEqual([])
    expect(target.reason).toContain('standalone')
  })

  it('needs confirmation for a non-empty project missing only the build anchor', async () => {
    const dir = await tmp()
    await write(dir, 'package.json', JSON.stringify({ name: 'solo' }))
    await writeKit(dir)
    await writeIndex(dir)
    const target = await resolveTarget(dir)
    expect(target.nonEmpty).toBe(true)
    expect(target.anchors).toEqual({ build: false, kit: true, index: true })
    expect(target.needsConfirmation).toBe(true)
  })

  it('does not need confirmation for an empty directory', async () => {
    const dir = await tmp()
    const target = await resolveTarget(dir)
    expect(target.nonEmpty).toBe(false)
    expect(target.needsConfirmation).toBe(false)
  })

  it('ignores .git when deciding whether a project is empty', async () => {
    const dir = await tmp()
    await fs.mkdir(path.join(dir, '.git'))
    const target = await resolveTarget(dir)
    expect(target.nonEmpty).toBe(false)
    expect(target.needsConfirmation).toBe(false)
  })
})

describe('planScaffold and applyScaffold', () => {
  it('plans every group for an empty directory and skips unrelated template files', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    const plan = await planScaffold(app, { templateRoot: tpl })
    expect(plan.missingAnchors).toEqual(ANCHORS)
    const rels = plan.files.map((f) => f.rel)
    expect(rels).toEqual(expect.arrayContaining([
      'package.json', 'public/favicon.svg', 'src/presentation-kit/index.ts',
      'src/presentation-kit/nodes/Box.tsx', 'src/presentations/index.ts',
      'scripts/verify.mjs', 'src/presentations/how-to-make-a-presentation/Talk.tsx',
    ]))
    expect(rels).not.toContain('README-template.md')
    expect(plan.files.every((f) => f.action === 'create')).toBe(true)
  })

  it('creates the full scaffold and every anchor is detected afterwards', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    const written = await applyScaffold(app, { templateRoot: tpl })
    expect(written).toContain('src/presentation-kit/index.ts')
    expect(await detectAnchors(app)).toEqual({ build: true, kit: true, index: true })
    expect(await fs.readFile(path.join(app, 'src/Router.tsx'), 'utf8')).toBe('router\n')
  })

  it('never overwrites an existing file', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await write(app, 'src/main.tsx', 'custom main\n')
    await write(app, 'src/index.css', 'custom css\n')
    const plan = await planScaffold(app, { templateRoot: tpl })
    expect(plan.files.find((f) => f.rel === 'src/main.tsx')?.action).toBe('skip-existing')
    await applyScaffold(app, { templateRoot: tpl })
    expect(await fs.readFile(path.join(app, 'src/main.tsx'), 'utf8')).toBe('custom main\n')
    expect(await fs.readFile(path.join(app, 'src/index.css'), 'utf8')).toBe('custom css\n')
  })

  it('merges package.json without overwriting existing version values or scripts', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await write(app, 'package.json', JSON.stringify({
      name: 'host',
      scripts: { build: 'custom build' },
      dependencies: { react: '18.0.0', 'left-pad': '1.0.0' },
    }, null, 2))
    const plan = await planScaffold(app, { templateRoot: tpl })
    expect(plan.files.find((f) => f.rel === 'package.json')?.action).toBe('merge-package-json')
    const written = await applyScaffold(app, { templateRoot: tpl })
    expect(written).toContain('package.json')
    const merged = JSON.parse(await fs.readFile(path.join(app, 'package.json'), 'utf8'))
    expect(merged.name).toBe('host')
    expect(merged.dependencies.react).toBe('18.0.0')
    expect(merged.dependencies['left-pad']).toBe('1.0.0')
    expect(merged.dependencies['react-dom']).toBe('^19.0.0')
    expect(merged.dependencies.motion).toBe('^12.40.0')
    expect(merged.scripts.build).toBe('custom build')
    expect(merged.devDependencies.vite).toBe('^8.0.0')
  })

  it('preserves unrelated root files', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await write(app, 'notes.txt', 'keep me\n')
    await write(app, 'docs/guide.md', '# guide\n')
    await applyScaffold(app, { templateRoot: tpl })
    expect(await fs.readFile(path.join(app, 'notes.txt'), 'utf8')).toBe('keep me\n')
    expect(await fs.readFile(path.join(app, 'docs/guide.md'), 'utf8')).toBe('# guide\n')
  })

  it('adds only the missing build group when kit and index are already present', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await writeKit(app, KIT_RENAMED)
    await writeIndex(app)
    const plan = await planScaffold(app, { templateRoot: tpl })
    expect(plan.missingAnchors).toEqual(['build'])
    const rels = plan.files.map((f) => f.rel)
    expect(rels).toContain('package.json')
    expect(rels).toContain('scripts/verify.mjs')
    expect(rels.some((r) => r.startsWith('src/presentation-kit/'))).toBe(false)
    expect(rels).not.toContain('src/Router.tsx')
    await applyScaffold(app, { templateRoot: tpl })
    expect(await fs.readFile(path.join(app, 'src/presentation-kit/index.ts'), 'utf8')).toBe(KIT_RENAMED)
    expect(await fs.access(path.join(app, 'src/Router.tsx')).then(() => true, () => false)).toBe(false)
  })
})

describe('malformed host manifest', () => {
  it('fails before writing anything when the host package.json is not valid JSON', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await write(app, 'package.json', '{ "name": "host", // comment\n}\n')
    await expect(applyScaffold(app, { templateRoot: tpl })).rejects.toThrow(/is not valid JSON \(.*\); nothing was written/)
    expect(await fs.access(path.join(app, 'scripts/verify.mjs')).then(() => true, () => false)).toBe(false)
  })

  it('keeps the host indentation when merging package.json', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await write(app, 'package.json', '{\n    "name": "host",\n    "dependencies": {}\n}\n')
    await applyScaffold(app, { templateRoot: tpl })
    const text = await fs.readFile(path.join(app, 'package.json'), 'utf8')
    expect(text.split('\n')[1]).toBe('    "name": "host",')
  })
})

describe('partial scaffold dependencies', () => {
  it('merges missing runtime dependencies into an existing build setup', async () => {
    const tpl = await makeTemplate()
    const app = await tmp()
    await writeBuild(app)
    await writeKit(app, KIT_CANONICAL)
    await writeIndex(app)
    const plan = await planScaffold(app, { templateRoot: tpl })
    expect(plan.files).toContainEqual({ rel: 'package.json', action: 'merge-package-json' })
    await applyScaffold(app, { templateRoot: tpl })
    const pkg = JSON.parse(await fs.readFile(path.join(app, 'package.json'), 'utf8'))
    expect(pkg.dependencies.motion).toBeDefined()
    expect(pkg.dependencies['lucide-react']).toBeDefined()
    expect(pkg.dependencies.react).toBe(BUILD_PKG.dependencies.react)
  })
})

describe('module paths and CLI', () => {
  it('derives TEMPLATE_ROOT from the module URL as an absolute bootstrap path', () => {
    expect(path.isAbsolute(TEMPLATE_ROOT)).toBe(true)
    expect(TEMPLATE_ROOT.endsWith(path.join('skills', 'presentation', 'templates', 'bootstrap'))).toBe(true)
    expect(TEMPLATE_ROOT).toBe(path.resolve(fileURLToPath(new URL('../../skills/presentation/templates/bootstrap', import.meta.url))))
  })

  it('runs from an unrelated cwd and prints JSON', async () => {
    const project = await tmp()
    const elsewhere = await tmp()
    const { stdout } = await execFileAsync(process.execPath, [SCRIPT, project], { cwd: elsewhere })
    const result = JSON.parse(stdout)
    expect(result.target.relation).toBe('root')
    expect(result.target.appDir).toBe(project)
    expect(result.plan.missingAnchors).toEqual(ANCHORS)
  })
})
