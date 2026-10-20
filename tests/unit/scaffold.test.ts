// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { anchorsAt, applyScaffold, detect, findRegistry, isEmpty, isMonorepo, mergePackageJson, planScaffold, TEMPLATE_DIR } from '../../skills/presentation/scripts/scaffold.mjs'

const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'scaffold-unit-'))
const write = (dir: string, rel: string, content = '') => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
  writeFileSync(path.join(dir, rel), content)
}

/** A complete scaffold with cosmetic differences: renamed files and an extra dependency. */
function cosmeticScaffold() {
  const dir = tmp()
  cpSync(TEMPLATE_DIR, dir, { recursive: true })
  const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
  pkg.dependencies.extra = '1.0.0'
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg))
  return dir
}

describe('target resolution', () => {
  it('treats a directory with only .git as empty and scaffolds at the root without confirmation', () => {
    const dir = tmp()
    mkdirSync(path.join(dir, '.git'))
    expect(isEmpty(dir)).toBe(true)
    const found = detect(dir)
    expect(found.target).toBe(dir)
    expect(found.missing).toEqual(['build', 'kit', 'index'])
    expect(found.needsConfirmation).toBe(false)
  })

  it('scaffolds a standalone non-empty project at the root, after confirmation', () => {
    const dir = tmp()
    write(dir, 'README.md', 'hi')
    const found = detect(dir)
    expect(found.target).toBe(dir)
    expect(found.nonEmpty).toBe(true)
    expect(found.needsConfirmation).toBe(true)
  })

  for (const [signal, setup] of [
    ['package.json workspaces', (d: string) => write(d, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }))],
    ['pnpm-workspace.yaml', (d: string) => write(d, 'pnpm-workspace.yaml', 'packages: []')],
    ['packages/ directory', (d: string) => mkdirSync(path.join(d, 'packages'))],
    ['apps/ directory', (d: string) => mkdirSync(path.join(d, 'apps'))],
  ] as const) {
    it(`resolves a monorepo signalled by ${signal} to presentations/`, () => {
      const dir = tmp()
      setup(dir)
      expect(isMonorepo(dir)).toBe(true)
      const found = detect(dir)
      expect(found.target).toBe(path.join(dir, 'presentations'))
      expect(found.needsConfirmation).toBe(true)
    })
  }

  it('does not count monorepo-root build setup as the anchor of the presentations app', () => {
    const rootOnly = tmp()
    for (const f of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'index.html']) cpSync(path.join(TEMPLATE_DIR, f), path.join(rootOnly, f))
    const pkg = JSON.parse(readFileSync(path.join(rootOnly, 'package.json'), 'utf8'))
    write(rootOnly, 'package.json', JSON.stringify({ ...pkg, workspaces: ['packages/*'] }))
    const found = detect(rootOnly)
    expect(anchorsAt(rootOnly).build).toBe(true)
    expect(found.target).toBe(path.join(rootOnly, 'presentations'))
    expect(found.anchors).toEqual({ build: false, kit: false, index: false })
  })

  it('reuses an existing presentation app, in a monorepo or not', () => {
    const dir = cosmeticScaffold()
    write(dir, 'pnpm-workspace.yaml', 'packages: []')
    expect(detect(dir).target).toBe(dir)
    const mono = tmp()
    write(mono, 'pnpm-workspace.yaml', 'packages: []')
    cpSync(TEMPLATE_DIR, path.join(mono, 'presentations'), { recursive: true })
    const found = detect(mono)
    expect(found.target).toBe(path.join(mono, 'presentations'))
    expect(found.missing).toEqual([])
    expect(found.needsConfirmation).toBe(false)
  })
})

describe('anchor detection by contract', () => {
  it('finds all three anchors in the bootstrap template', () => {
    expect(anchorsAt(TEMPLATE_DIR)).toEqual({ build: true, kit: true, index: true })
  })

  it('skips scaffolding despite renamed kit files and extra dependencies', () => {
    const dir = cosmeticScaffold()
    cpSync(path.join(dir, 'src/presentation-kit'), path.join(dir, 'src/engine'), { recursive: true })
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    renameSync(path.join(dir, 'src/presentations/index.ts'), path.join(dir, 'src/presentations/registry.ts'))
    // Keep the app consistent: imports follow the renames, as they would in a real host.
    for (const file of readdirSync(path.join(dir, 'src'), { recursive: true, encoding: 'utf8' })) {
      const full = path.join(dir, 'src', file)
      if (!statSync(full).isFile() || !/\.(ts|tsx)$/.test(file)) continue
      writeFileSync(full, readFileSync(full, 'utf8').replaceAll('presentation-kit', 'engine').replaceAll('presentations/index.ts', 'presentations/registry.ts'))
    }
    expect(findRegistry(dir)).toBe(path.join('src', 'presentations', 'registry.ts'))
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: true })
    const report = applyScaffold(dir, { confirmed: true })
    expect(report.written).toEqual([])
    expect(report.missing).toEqual([])
  })

  for (const [missing, strip] of [
    ['captions', (s: string) => s.replace(/caption/gi, 'note')],
    ['a table of contents', (s: string) => s.replace(/toc|table of contents/gi, 'index')],
    ['present/browse modes', (s: string) => s.replace(/\bbrowse\b/g, 'read')],
  ] as const) {
    it(`does not call a kit lacking ${missing} complete`, () => {
      const dir = tmp()
      cpSync(TEMPLATE_DIR, dir, { recursive: true })
      const kit = path.join(dir, 'src/presentation-kit')
      for (const file of readdirSync(kit, { recursive: true, encoding: 'utf8' })) {
        const full = path.join(kit, file)
        if (statSync(full).isFile()) writeFileSync(full, strip(readFileSync(full, 'utf8')))
      }
      expect(anchorsAt(dir).kit).toBe(false)
      expect(detect(dir).missing).toContain('kit')
    })
  }

  it('does not call an unrelated project an anchor', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ scripts: { build: 'tsc' }, dependencies: { react: '1' } }))
    write(dir, 'src/App.tsx', 'export const App = () => null')
    expect(anchorsAt(dir)).toEqual({ build: false, kit: false, index: false })
  })
})

describe('applying a scaffold', () => {
  it('scaffolds an empty directory completely, with every anchor then present', () => {
    const dir = tmp()
    const report = applyScaffold(dir)
    expect(report.written).toContain('src/presentation-kit/Presentation.tsx')
    expect(report.written).toContain('scripts/verify.mjs')
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: true })
    expect(readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(readFileSync(path.join(TEMPLATE_DIR, 'package.json'), 'utf8'))
  })

  it('refuses to write into a non-empty project until the target is confirmed', () => {
    const dir = tmp()
    write(dir, 'keep.txt', 'mine')
    expect(() => applyScaffold(dir)).toThrow(/confirmation required/)
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
  })

  it('adds only missing anchors and preserves existing files and dependencies', () => {
    const dir = tmp()
    cpSync(TEMPLATE_DIR, dir, { recursive: true })
    for (const rel of ['src/presentation-kit', 'scripts', 'src/presentations', 'verify.config.json', 'src/Router.tsx']) rmSync(path.join(dir, rel), { recursive: true })
    write(dir, 'src/main.tsx', 'sentinel main')
    write(dir, 'src/index.css', 'sentinel css')
    write(dir, 'package.json', JSON.stringify({ ...JSON.parse(readFileSync(path.join(TEMPLATE_DIR, 'package.json'), 'utf8')), scripts: { build: 'tsc -b && vite build', custom: 'x' }, dependencies: { react: '^18.0.0' } }))
    const before = detect(dir)
    expect(before.missing).toEqual(['kit', 'index'])
    const report = applyScaffold(dir, { confirmed: true })
    expect(report.written).toContain('src/presentation-kit/index.ts')
    expect(report.skipped).toEqual(expect.arrayContaining(['src/main.tsx', 'src/index.css']))
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toBe('sentinel main')
    expect(readFileSync(path.join(dir, 'src/index.css'), 'utf8')).toBe('sentinel css')
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies.react).toBe('^18.0.0')
    expect(pkg.dependencies.motion).toBeTruthy()
    expect(pkg.scripts.custom).toBe('x')
    expect(pkg.scripts.verify).toBeTruthy()
    // The kept host entry never renders the scaffold's router, so the index is not complete until it does.
    expect(anchorsAt(dir)).toEqual({ build: true, kit: true, index: false })
    expect(report.remaining).toEqual(['index'])
    expect(report.followUp).toHaveLength(1)
  })

  it('installs verification config together with the verification scripts when only the kit is missing', () => {
    const dir = tmp()
    cpSync(TEMPLATE_DIR, dir, { recursive: true })
    rmSync(path.join(dir, 'src/presentation-kit'), { recursive: true })
    rmSync(path.join(dir, 'scripts'), { recursive: true })
    rmSync(path.join(dir, 'verify.config.json'))
    expect(detect(dir).missing).toEqual(['kit'])
    const report = applyScaffold(dir, { confirmed: true })
    expect(report.written).toEqual(expect.arrayContaining(['scripts/verify.mjs', 'verify.config.json']))
    expect(new Set(report.written).size).toBe(report.written.length)
    expect(JSON.parse(readFileSync(path.join(dir, 'verify.config.json'), 'utf8')).slug).toBe('getting-started')
    expect(detect(dir).missing).toEqual([])
  })

  it('leaves monorepo root content untouched and writes only under presentations/', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'root', workspaces: ['packages/*'] }))
    write(dir, 'packages/a/index.ts', 'a')
    const rootPackage = readFileSync(path.join(dir, 'package.json'), 'utf8')
    const report = applyScaffold(dir, { confirmed: true })
    expect(report.target).toBe(path.join(dir, 'presentations'))
    expect(readFileSync(path.join(dir, 'package.json'), 'utf8')).toBe(rootPackage)
    expect(readFileSync(path.join(dir, 'packages/a/index.ts'), 'utf8')).toBe('a')
    expect(existsSync(path.join(dir, 'src'))).toBe(false)
    expect(anchorsAt(path.join(dir, 'presentations'))).toEqual({ build: true, kit: true, index: true })
  })

  it('looks up templates relative to the script, whatever the working directory', () => {
    expect(TEMPLATE_DIR).toBe(path.resolve(import.meta.dirname, '../../skills/presentation/templates/bootstrap'))
    const plan = planScaffold(tmp(), ['kit'])
    expect(plan.copy.length).toBeGreaterThan(5)
  })

  it('appends only missing lines to an existing .gitignore', () => {
    const dir = tmp()
    write(dir, '.gitignore', 'node_modules\ncustom\n')
    write(dir, 'package.json', '{}')
    applyScaffold(dir, { confirmed: true })
    const lines = readFileSync(path.join(dir, '.gitignore'), 'utf8').split('\n')
    expect(lines.filter((l) => l === 'node_modules')).toHaveLength(1)
    expect(lines).toContain('custom')
    expect(lines).toContain('inspection')
  })

  it('keeps the host lockfile situation untouched when package.json already exists', () => {
    const dir = tmp()
    write(dir, 'package.json', JSON.stringify({ name: 'host' }))
    const report = applyScaffold(dir, { confirmed: true })
    expect(report.written).not.toContain('package-lock.json')
    expect(existsSync(path.join(dir, 'package-lock.json'))).toBe(false)
    expect(planScaffold(dir, ['build']).copy.map((c) => c.rel)).not.toContain('package-lock.json')
  })

  it('fails when a dependency install step fails or cannot start', () => {
    const fail = (result: object) => () => result
    const dir = tmp()
    expect(() => applyScaffold(dir, { install: true, runInstall: fail({ status: 1 }) })).toThrow(/install failed.*npm install.*exit 1/s)
    const dir2 = tmp()
    expect(() => applyScaffold(dir2, { install: true, runInstall: fail({ status: null, error: new Error('spawn ENOENT') }) })).toThrow(/ENOENT/)
    const dir3 = tmp()
    expect(applyScaffold(dir3, { install: true, runInstall: fail({ status: 0 }) }).installed).toHaveLength(2)
  })

  it('merges package.json without altering existing entries', () => {
    const merged = mergePackageJson({ scripts: { a: '1' }, dependencies: { x: '1' } }, { type: 'module', scripts: { a: '2', b: '3' }, dependencies: { x: '2', y: '2' }, devDependencies: { z: '1' } })
    expect(merged).toEqual({ type: 'module', scripts: { a: '1', b: '3' }, dependencies: { x: '1', y: '2' }, devDependencies: { z: '1' } })
  })
})

describe('routing the registry (index anchor)', () => {
  /** A working Vite/React/TypeScript host with its own entry and no kit or index. */
  function buildOnlyHost() {
    const dir = tmp()
    for (const f of ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'index.html']) cpSync(path.join(TEMPLATE_DIR, f), path.join(dir, f))
    write(dir, 'src/main.tsx', "import { createRoot } from 'react-dom/client'\ncreateRoot(document.getElementById('root')!).render(<h1>Existing host dashboard</h1>)\n")
    return dir
  }

  it('does not call a registry complete while the app entry never reaches it', () => {
    const dir = buildOnlyHost()
    const report = applyScaffold(dir, { confirmed: true })
    expect(report.skipped).toContain('src/main.tsx')
    expect(readFileSync(path.join(dir, 'src/main.tsx'), 'utf8')).toContain('Existing host dashboard')
    expect(findRegistry(dir)).not.toBeNull()
    expect(anchorsAt(dir).index).toBe(false)
    expect(report.remaining).toContain('index')
    expect(report.followUp.join(' ')).toMatch(/Router/)
  })

  it('reports the index complete once the host entry renders the router', () => {
    const dir = buildOnlyHost()
    applyScaffold(dir, { confirmed: true })
    cpSync(path.join(TEMPLATE_DIR, 'src/main.tsx'), path.join(dir, 'src/main.tsx'))
    expect(anchorsAt(dir).index).toBe(true)
    expect(detect(dir).missing).toEqual([])
    expect(detect(dir).registry).toBe(path.join('src', 'presentations', 'index.ts'))
  })

  it('has nothing to follow up on after a full scaffold', () => {
    const dir = tmp()
    const report = applyScaffold(dir)
    expect(report.remaining).toEqual([])
    expect(report.followUp).toEqual([])
  })
})

describe('command line entry point', () => {
  const scripts = path.resolve(import.meta.dirname, '..', '..', 'skills', 'presentation', 'scripts')

  it('runs when invoked through a symlinked skill directory, and reports instead of silently doing nothing', () => {
    const linkParent = tmp()
    const link = path.join(linkParent, 'skill-scripts')
    symlinkSync(scripts, link, 'dir')
    const target = tmp()
    const result = spawnSync(process.execPath, [path.join(link, 'scaffold.mjs'), 'detect', target], { encoding: 'utf8' })
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout).missing).toEqual(['build', 'kit', 'index'])
    const bad = spawnSync(process.execPath, [path.join(link, 'scaffold.mjs'), 'nonsense'], { encoding: 'utf8' })
    expect(bad.status).toBe(1)
    expect(bad.stderr).toMatch(/usage/)
  })
})
