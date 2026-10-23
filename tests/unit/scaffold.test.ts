import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { applyScaffold, bootstrapDir, detectAnchors, exportedNames, isMonorepo, planScaffold, resolveTarget } from '../../skills/presentation/scripts/scaffold.mjs'

const tmpDirs: string[] = []
const tmp = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'))
  tmpDirs.push(dir)
  return dir
}
afterEach(() => {
  for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function write(dir: string, rel: string, content: string) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  fs.writeFileSync(path.join(dir, rel), content)
}

function hashes(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const visit = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) visit(full)
      else out[path.relative(dir, full)] = crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex')
    }
  }
  visit(dir)
  return out
}

const copyBootstrap = (dest: string, filter: (rel: string) => boolean = () => true) =>
  fs.cpSync(bootstrapDir, dest, { recursive: true, filter: (src) => filter(path.relative(bootstrapDir, src)) })

const REQUIRED = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright']

describe('anchor detection', () => {
  it('finds all three anchors in the bootstrap template and none in an empty directory', () => {
    expect(detectAnchors(bootstrapDir)).toEqual({ build: true, kit: true, index: true })
    expect(detectAnchors(tmp())).toEqual({ build: false, kit: false, index: false })
  })

  it('keys on the contract, so renamed files and reformatting do not count as missing', () => {
    const dir = tmp()
    copyBootstrap(dir)
    fs.renameSync(path.join(dir, 'src/presentation-kit/chrome/Toc.tsx'), path.join(dir, 'src/presentation-kit/chrome/Contents.tsx'))
    fs.renameSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/index.tsx'))
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    pkg.dependencies.extra = '^1.0.0'
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg))
    fs.appendFileSync(path.join(dir, 'src/presentation-kit/Stage.tsx'), '\n\n\n')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('reports a missing piece of the kit contract', () => {
    const dir = tmp()
    copyBootstrap(dir)
    fs.rmSync(path.join(dir, 'src/presentation-kit/useFitScale.ts'))
    expect(detectAnchors(dir).kit).toBe(false)
  })

  it('requires a working build script and the React, Vite and TypeScript dependencies', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1' }, devDependencies: { vite: '1' } }))
    expect(detectAnchors(dir).build).toBe(false)
    write(dir, 'package.json', JSON.stringify({ scripts: {}, dependencies: { react: '1', vite: '1', typescript: '1' } }))
    expect(detectAnchors(dir).build).toBe(false)
    write(dir, 'package.json', JSON.stringify({ scripts: { build: 'x' }, dependencies: { react: '1', vite: '1', typescript: '1' } }))
    expect(detectAnchors(dir).build).toBe(true)
  })

  it('reads direct, braced and aliased exports', () => {
    expect([...exportedNames("export function A() {}\nexport const B = 1\nexport type C = 1\nexport { D, type E, F as G }\nexport { Z } from './z'\nexport default function H() {}")].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'G', 'H'])
  })
})

describe('target resolution', () => {
  it('scaffolds an empty or standalone project at the root', () => {
    const dir = tmp()
    expect(resolveTarget(dir).target).toBe(dir)
    write(dir, 'package.json', JSON.stringify({ name: 'solo' }))
    expect(resolveTarget(dir).target).toBe(dir)
  })

  it.each([
    ['workspaces array', (d: string) => write(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['workspaces object', (d: string) => write(d, 'package.json', JSON.stringify({ workspaces: { packages: ['x'] } }))],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages:\n  - x\n')],
    ['packages/ layout', (d: string) => fs.mkdirSync(path.join(d, 'packages'))],
    ['apps/ layout', (d: string) => fs.mkdirSync(path.join(d, 'apps'))],
  ])('puts a self-contained app under presentations/ for a monorepo (%s)', (_name, setup) => {
    const dir = tmp()
    setup(dir)
    expect(isMonorepo(dir)).toBe(true)
    expect(resolveTarget(dir).target).toBe(path.join(dir, 'presentations'))
  })

  it('reuses an existing app, in presentations/ or at the root, instead of scaffolding another', () => {
    const monorepo = tmp()
    write(monorepo, 'package.json', JSON.stringify({ workspaces: ['x'] }))
    copyBootstrap(path.join(monorepo, 'presentations'))
    expect(resolveTarget(monorepo).target).toBe(path.join(monorepo, 'presentations'))

    const solo = tmp()
    copyBootstrap(solo)
    expect(resolveTarget(solo).target).toBe(solo)
    expect(planScaffold(solo).missing).toEqual([])
  })

  it('treats a monorepo root that already holds a complete app as that app', () => {
    const dir = tmp()
    copyBootstrap(dir)
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ ...pkg, workspaces: ['x'] }))
    expect(resolveTarget(dir).target).toBe(dir)
  })
})

describe('planning and applying', () => {
  it('needs no confirmation for an empty or VCS-only directory and scaffolds all anchors', () => {
    const dir = tmp()
    fs.mkdirSync(path.join(dir, '.git'))
    const plan = planScaffold(dir)
    expect(plan.missing).toEqual(['build', 'kit', 'index'])
    expect(plan.requiresConfirmation).toBe(false)
    const result = applyScaffold(dir, { install: false })
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const names = new Set([...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)])
    for (const name of REQUIRED) expect(names.has(name), name).toBe(true)
    expect(fs.existsSync(path.join(dir, 'package-lock.json'))).toBe(true)
    expect(result.written).toContain('scripts/verify.mjs')
  })

  it('requires confirmation in a non-empty project that lacks scaffolding, and writes nothing without it', () => {
    const dir = tmp()
    write(dir, 'README.md', 'mine')
    write(dir, 'package.json', JSON.stringify({ name: 'x', scripts: { build: 'x' }, dependencies: { react: '1', vite: '1', typescript: '1' } }))
    const before = hashes(dir)
    expect(planScaffold(dir).requiresConfirmation).toBe(true)
    expect(() => applyScaffold(dir, { install: false })).toThrowError(/confirmation required/)
    expect(hashes(dir)).toEqual(before)
  })

  it('also asks before scaffolding when only the build anchor is missing', () => {
    const dir = tmp()
    copyBootstrap(dir, (rel) => rel !== 'package.json')
    write(dir, 'notes.txt', 'x')
    const plan = planScaffold(dir)
    expect(plan.missing).toEqual(['build'])
    expect(plan.requiresConfirmation).toBe(true)
  })

  it('adds only the missing anchors to a partial monorepo and leaves everything else untouched', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'mono', workspaces: ['packages/*'], scripts: { build: 'tsc -b', custom: 'x' }, dependencies: { react: '^18.0.0' }, devDependencies: { vite: '^5.0.0', typescript: '^5.0.0' } }, null, 2))
    write(dir, 'packages/lib/index.ts', 'export const lib = 1\n')
    write(dir, 'README.md', 'monorepo readme')
    const before = hashes(dir)

    const plan = planScaffold(dir)
    expect(plan.target).toBe(path.join(dir, 'presentations'))
    expect(plan.requiresConfirmation).toBe(true)
    const result = applyScaffold(dir, { confirmed: true, install: false })

    const after = hashes(dir)
    for (const [file, hash] of Object.entries(before)) expect(after[file], file).toBe(hash)
    const added = Object.keys(after).filter((f) => !(f in before))
    expect(added.length).toBeGreaterThan(10)
    expect(added.every((f) => f.startsWith('presentations/'))).toBe(true)
    expect(detectAnchors(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
    expect(result.written).toContain('src/presentation-kit/Presentation.tsx')
  })

  it('merges the manifest of a partial app without changing existing versions or scripts', () => {
    const dir = tmp()
    copyBootstrap(dir, (rel) => !rel.startsWith(path.join('src', 'presentation-kit')) && !rel.startsWith(path.join('src', 'presentations')))
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    manifest.dependencies.react = '^18.2.0'
    manifest.scripts.build = 'custom-build'
    delete manifest.dependencies.motion
    delete manifest.dependencies['lucide-react']
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest))
    const keptFile = path.join(dir, 'vite.config.ts')
    fs.writeFileSync(keptFile, '// mine\n')
    const plan = planScaffold(dir)
    expect(plan.missing.sort()).toEqual(['index', 'kit'])
    expect(plan.copy.some((f) => f.startsWith('src/presentation-kit/'))).toBe(true)
    expect(plan.copy).not.toContain('vite.config.ts')
    applyScaffold(dir, { confirmed: true, install: false })
    const merged = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(merged.dependencies.react).toBe('^18.2.0')
    expect(merged.scripts.build).toBe('custom-build')
    expect(merged.dependencies.motion).toBeDefined()
    expect(merged.dependencies['lucide-react']).toBeDefined()
    expect(fs.readFileSync(keptFile, 'utf8')).toBe('// mine\n')
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
  })

  it('keeps an existing main.tsx and tells the agent to wire the router', () => {
    const dir = tmp()
    copyBootstrap(dir, (rel) => !rel.startsWith(path.join('src', 'presentations')) && rel !== path.join('src', 'router.tsx'))
    write(dir, 'src/main.tsx', '// existing entry\n')
    const result = applyScaffold(dir, { confirmed: true, install: false })
    expect(fs.readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('// existing entry\n')
    expect(result.notes.join(' ')).toMatch(/main\.tsx/)
  })

  it('does nothing when every anchor is already present', () => {
    const dir = tmp()
    copyBootstrap(dir)
    const before = hashes(dir)
    const result = applyScaffold(dir, { install: false })
    expect(result.written).toEqual([])
    expect(result.missing).toEqual([])
    expect(hashes(dir)).toEqual(before)
  })
})

describe('registry naming and tooling', () => {
  it('recognizes a registry with any file name, not only index.ts', () => {
    const dir = tmp()
    copyBootstrap(dir)
    fs.renameSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/registry.ts'))
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(planScaffold(dir).missing).toEqual([])
    fs.writeFileSync(path.join(dir, 'src/presentations/registry.ts'), 'export const x = 1\n')
    expect(detectAnchors(dir).index).toBe(false)
  })

  it('copies the verification scripts that the merged npm scripts point at, even for a build-only app', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ scripts: { build: 'tsc -b' }, dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^8.0.0', typescript: '~6.0.0' } }))
    const result = applyScaffold(dir, { confirmed: true, install: false })
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(manifest.scripts.verify).toBe('node scripts/verify.mjs')
    expect(manifest.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    for (const rel of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs', 'scripts/lib/diagnostics.mjs', 'scripts/lib/verify-core.mjs']) {
      expect(fs.existsSync(path.join(dir, rel)), rel).toBe(true)
    }
    expect(result.notes.join(' ')).toMatch(/playwright install chromium/)
  })
})

describe('template lookup', () => {
  it('resolves templates from the skill directory regardless of the working directory', () => {
    const dir = tmp()
    const elsewhere = tmp()
    const script = path.resolve(import.meta.dirname, '../../skills/presentation/scripts/scaffold.mjs')
    const plan = JSON.parse(execFileSync(process.execPath, [script, '--dir', dir], { cwd: elsewhere, encoding: 'utf8' }))
    expect(plan.copy).toContain('src/presentation-kit/Stage.tsx')
    expect(bootstrapDir).toBe(path.resolve(import.meta.dirname, '../../skills/presentation/templates/bootstrap'))
    expect(fs.readdirSync(dir)).toEqual([]) // a plan writes nothing
    execFileSync(process.execPath, [script, '--dir', dir, '--apply', '--no-install'], { cwd: elsewhere, encoding: 'utf8' })
    expect(detectAnchors(dir)).toEqual({ build: true, kit: true, index: true })
    expect(fs.readdirSync(elsewhere)).toEqual([])
  })

  it('exits with code 2 when confirmation is required but not given', () => {
    const dir = tmp()
    write(dir, 'keep.txt', 'x')
    const script = path.resolve(import.meta.dirname, '../../skills/presentation/scripts/scaffold.mjs')
    let status = 0
    try {
      execFileSync(process.execPath, [script, '--dir', dir, '--apply', '--no-install'], { encoding: 'utf8', stdio: 'pipe' })
    } catch (error) {
      status = (error as { status: number }).status
    }
    expect(status).toBe(2)
    expect(fs.readdirSync(dir)).toEqual(['keep.txt'])
  })
})
