import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  BOOTSTRAP_DIR,
  PRESENTATION_TEMPLATE_DIR,
  applyScaffold,
  detectAnchors,
  resolveTarget,
  scaffoldPlan,
} from '../../skills/presentation/scripts/detect-scaffold.mjs'

let sandbox: string
let counter = 0

beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'detect-scaffold-'))
})
afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true })
})

function fresh(name = 'case'): string {
  const dir = join(sandbox, `${name}-${counter++}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function write(dir: string, rel: string, text: string): void {
  const file = join(dir, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}

function materialize(dest: string): string {
  cpSync(BOOTSTRAP_DIR, dest, { recursive: true, filter: (src) => !src.includes(`${sep}node_modules`) })
  return dest
}

function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name)
      if (e.isDirectory()) walk(full)
      else out.set(relative(dir, full), readFileSync(full, 'utf8'))
    }
  }
  walk(dir)
  return out
}

describe('detectAnchors', () => {
  it('finds all three anchors in the bootstrap template', () => {
    const report = detectAnchors(materialize(fresh('all')))
    expect(report).toMatchObject({ build: true, kit: true, index: true, missing: [] })
  })

  it('finds nothing in an empty directory or a non-scaffold project', () => {
    expect(detectAnchors(fresh('empty')).missing).toEqual(['build', 'kit', 'index'])
    const plain = fresh('plain')
    write(plain, 'README.md', '# hello\n')
    write(plain, 'package.json', '{"name":"x"}')
    expect(detectAnchors(plain).missing).toEqual(['build', 'kit', 'index'])
  })

  it('does not accept directory names alone', () => {
    const dir = fresh('names-only')
    write(dir, 'package.json', '{"scripts":{}}')
    mkdirSync(join(dir, 'src/presentation-kit'), { recursive: true })
    write(dir, 'src/presentation-kit/notes.md', 'not a kit')
    mkdirSync(join(dir, 'src/presentations'), { recursive: true })
    write(dir, 'src/presentations/index.ts', 'export {}\n')
    expect(detectAnchors(dir)).toMatchObject({ build: false, kit: false, index: false })
  })

  it('reports exactly the missing anchors for partial scaffolds', () => {
    const noKit = materialize(fresh('no-kit'))
    rmSync(join(noKit, 'src/presentation-kit'), { recursive: true })
    expect(detectAnchors(noKit).missing).toEqual(['kit'])

    const noIndex = materialize(fresh('no-index'))
    rmSync(join(noIndex, 'src/presentations'), { recursive: true })
    expect(detectAnchors(noIndex).missing).toEqual(['index'])

    const noBuild = materialize(fresh('no-build'))
    rmSync(join(noBuild, 'vite.config.ts'))
    expect(detectAnchors(noBuild).missing).toEqual(['build'])

    const noBuildScript = materialize(fresh('no-build-script'))
    const pkg = JSON.parse(readFileSync(join(noBuildScript, 'package.json'), 'utf8'))
    delete pkg.scripts.build
    writeFileSync(join(noBuildScript, 'package.json'), JSON.stringify(pkg))
    expect(detectAnchors(noBuildScript).missing).toEqual(['build'])
  })

  it('ignores cosmetic differences: names, formatting, extra dependencies, config flavour', () => {
    const dir = fresh('cosmetic')
    write(
      dir,
      'package.json',
      JSON.stringify({ name: 'My Own App', scripts: { build: 'vite build', start: 'x' }, devDependencies: { vite: '7', typescript: '5', react: '18', zod: '3' } }, null, 8),
    )
    write(dir, 'vite.config.mts', 'export default {}\n')
    write(dir, 'tsconfig.json', '{}')
    // kit split across differently named files with different formatting
    write(dir, 'src/presentation-kit/contract.ts', 'export interface Step { id: string }\nexport type SceneProps = { stepIndex: number }\n')
    write(dir, 'src/presentation-kit/host/Stage.tsx', 'export function Stage() { return null }\n')
    write(dir, 'src/presentation-kit/Deck.tsx', 'export const Presentation = () => null\n')
    write(dir, 'src/presentation-kit/hooks.ts', 'export function usePresentationNav() {}\nexport function useFitScale() {}\n')
    write(dir, 'src/presentations/index.tsx', "export const presentations = [{ slug: 'a', title: 'A', load: () => import('./a/Talk') }]\n")
    expect(detectAnchors(dir)).toMatchObject({ build: true, kit: true, index: true, missing: [] })
    expect(detectAnchors(dir).indexPath).toBe('src/presentations/index.tsx')
  })
})

describe('resolveTarget', () => {
  it('scaffolds an empty directory at its root without confirmation', () => {
    const dir = fresh('empty-target')
    const target = resolveTarget(dir, { stopAt: sandbox })
    expect(target).toMatchObject({ kind: 'empty', appDir: dir, action: 'full-scaffold', requiresConfirmation: false })
    expect(target.indexPath).toBe(join(dir, 'src/presentations/index.ts'))
  })

  it('requires confirmation for a non-empty project with zero anchors, scaffolding at its root', () => {
    const dir = fresh('standalone')
    write(dir, 'package.json', '{"name":"site"}')
    write(dir, 'README.md', 'x')
    const target = resolveTarget(dir, { stopAt: sandbox })
    expect(target).toMatchObject({ kind: 'standalone', appDir: dir, action: 'full-scaffold', requiresConfirmation: true })
  })

  it('requires confirmation for a partial scaffold and lists only the missing anchors', () => {
    const dir = materialize(fresh('partial'))
    rmSync(join(dir, 'src/presentation-kit'), { recursive: true })
    const target = resolveTarget(dir, { stopAt: sandbox })
    expect(target).toMatchObject({
      kind: 'existing-app',
      appDir: dir,
      missing: ['kit'],
      action: 'partial-scaffold',
      requiresConfirmation: true,
    })
  })

  it('skips scaffolding, without confirmation, when all anchors are present', () => {
    const dir = materialize(fresh('complete'))
    expect(resolveTarget(dir, { stopAt: sandbox })).toMatchObject({
      kind: 'existing-app',
      missing: [],
      action: 'skip-scaffold',
      requiresConfirmation: false,
    })
  })

  describe.each([
    ['package.json workspaces array', (d: string) => write(d, 'package.json', '{"workspaces":["packages/*"]}')],
    ['package.json workspaces object', (d: string) => write(d, 'package.json', '{"workspaces":{"packages":["libs/*"]}}')],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', "packages:\n  - 'libs/*'\n")],
    ['packages/ directory', (d: string) => mkdirSync(join(d, 'packages/a'), { recursive: true })],
    ['apps/ directory', (d: string) => mkdirSync(join(d, 'apps/a'), { recursive: true })],
  ])('monorepo signal: %s', (_label, addSignal) => {
    it('targets a self-contained presentations/ app and confirms first', () => {
      const dir = fresh('mono')
      write(dir, 'README.md', 'monorepo')
      addSignal(dir)
      const target = resolveTarget(dir, { stopAt: sandbox })
      expect(target).toMatchObject({
        kind: 'monorepo',
        appDir: join(dir, 'presentations'),
        relativeAppDir: 'presentations',
        action: 'full-scaffold',
        requiresConfirmation: true,
      })
      expect(target.indexPath).toBe(join(dir, 'presentations/src/presentations/index.ts'))
      expect(target.signals.length).toBeGreaterThan(0)
    })
  })

  it('reuses an existing presentations/ app inside a monorepo, from the root and from a nested package', () => {
    const root = fresh('mono-existing')
    write(root, 'package.json', '{"workspaces":["packages/*"]}')
    mkdirSync(join(root, 'packages/lib/src'), { recursive: true })
    materialize(join(root, 'presentations'))
    for (const start of [root, join(root, 'packages/lib'), join(root, 'presentations/src')]) {
      const target = resolveTarget(start, { stopAt: sandbox })
      expect(target).toMatchObject({ kind: 'existing-app', appDir: join(root, 'presentations'), action: 'skip-scaffold' })
    }
  })

  it('scaffolds presentations/ at the monorepo root when started from a nested package', () => {
    const root = fresh('mono-nested')
    write(root, 'pnpm-workspace.yaml', 'packages:\n  - packages/*\n')
    write(root, 'packages/lib/package.json', '{"name":"lib"}')
    const target = resolveTarget(join(root, 'packages/lib'), { stopAt: sandbox })
    expect(target).toMatchObject({ kind: 'monorepo', appDir: join(root, 'presentations'), requiresConfirmation: true })
  })
})

describe('template lookup', () => {
  it('resolves template roots from the skill directory, regardless of cwd', () => {
    expect(existsSync(join(BOOTSTRAP_DIR, 'package.json'))).toBe(true)
    expect(existsSync(join(PRESENTATION_TEMPLATE_DIR, 'Talk.tsx'))).toBe(true)
    const elsewhere = fresh('elsewhere')
    const script = join(BOOTSTRAP_DIR, '..', '..', 'scripts', 'detect-scaffold.mjs')
    const empty = fresh('cwd-empty-target')
    const out = JSON.parse(execFileSync(process.execPath, [script, empty], { cwd: elsewhere, encoding: 'utf8' }))
    expect(out).toMatchObject({ kind: 'empty', appDir: empty, action: 'full-scaffold' })
  })
})

describe('scaffoldPlan and applyScaffold', () => {
  it('plans only the files belonging to missing anchors', () => {
    const kitOnly = scaffoldPlan(['kit'])
    expect(kitOnly.length).toBeGreaterThan(0)
    expect(kitOnly.every((f) => f.startsWith('src/presentation-kit/'))).toBe(true)
    expect(scaffoldPlan(['index'])).toContain('src/presentations/index.ts')
    expect(scaffoldPlan(['build'])).toEqual(expect.arrayContaining(['package.json', 'package-lock.json', 'scripts/verify.mjs']))
    expect(scaffoldPlan([])).toEqual([])
  })

  it('scaffolds an empty directory completely', () => {
    const dir = fresh('apply-empty')
    const result = applyScaffold(dir, { name: 'my-talks' })
    expect(result.needsInstall).toBe(true)
    expect(detectAnchors(dir).missing).toEqual([])
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name).toBe('my-talks')
    expect(JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8')).packages[''].name).toBe('my-talks')
  })

  it('adds only the missing anchor and leaves existing files byte-identical', () => {
    const dir = materialize(fresh('apply-partial'))
    rmSync(join(dir, 'src/presentations'), { recursive: true })
    write(dir, 'src/presentation-kit/types.ts', `${readFileSync(join(dir, 'src/presentation-kit/types.ts'), 'utf8')}// local tweak\n`)
    write(dir, 'src/unrelated.ts', 'export const keep = 1\n')
    write(dir, 'notes.md', 'mine')
    const before = snapshot(dir)

    const result = applyScaffold(dir, { missing: ['index'] })

    expect(detectAnchors(dir).missing).toEqual([])
    const after = snapshot(dir)
    for (const [file, text] of before) expect(after.get(file), file).toBe(text)
    expect(result.written.every((f) => f.startsWith('src/'))).toBe(true)
    expect([...after.keys()].filter((f) => !before.has(f)).sort()).toEqual([...result.written].sort())
    expect(result.written).toContain('src/presentations/index.ts')
  })

  it('merges missing dependencies and scripts into an existing package.json without overriding', () => {
    const dir = fresh('apply-merge')
    write(
      dir,
      'package.json',
      JSON.stringify({ name: 'mine', scripts: { build: 'custom build' }, dependencies: { react: '^18.0.0' } }),
    )
    write(dir, '.gitignore', 'node_modules\ncustom\n')
    const lockBefore = '{"keep":"me"}'
    write(dir, 'package-lock.json', lockBefore)

    const result = applyScaffold(dir)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const template = JSON.parse(readFileSync(join(BOOTSTRAP_DIR, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('mine')
    expect(pkg.scripts.build).toBe('custom build')
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.scripts.verify).toBe(template.scripts.verify)
    for (const dep of ['react-dom', 'motion', 'lucide-react']) expect(pkg.dependencies[dep]).toBe(template.dependencies[dep])
    for (const dep of Object.keys(template.devDependencies)) expect(pkg.devDependencies[dep]).toBe(template.devDependencies[dep])
    expect(result.merged).toContain('package.json')
    expect(result.needsInstall).toBe(true)
    expect(readFileSync(join(dir, 'package-lock.json'), 'utf8')).toBe(lockBefore)
    const ignore = readFileSync(join(dir, '.gitignore'), 'utf8')
    expect(ignore).toContain('custom')
    expect(ignore).toContain('.inspection')
    expect(detectAnchors(dir).missing).toEqual([])
  })

  it('does nothing when all anchors are present', () => {
    const dir = materialize(fresh('apply-noop'))
    const before = snapshot(dir)
    const result = applyScaffold(dir)
    expect(result).toMatchObject({ written: [], merged: [], needsInstall: false })
    expect(snapshot(dir)).toEqual(before)
  })
})
