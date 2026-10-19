// INT-001: the distributable bootstrap template materializes into a complete, installable,
// buildable, routable and style-neutral app outside the authoring repository.
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { scanForStyling } from '../helpers/styleScan'

const repo = resolve(__dirname, '../..')
const skillDir = join(repo, 'skills/presentation')
const templateDir = join(skillDir, 'templates/bootstrap')
const detectScript = join(skillDir, 'scripts/detect-scaffold.mjs')

let sandbox: string // outside the source repository
let elsewhere: string // unrelated cwd for every command
let app: string
let applyOutput: { kind: string; action: string; requiresConfirmation: boolean; applied: { written: string[] } }
const logs: Record<string, string> = {}

function files(dir: string, base = dir): string[] {
  const skip = new Set(['node_modules', 'dist', '.inspection'])
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...files(full, base))
    else out.push(relative(base, full).split('\\').join('/'))
  }
  return out.sort()
}

function run(cwd: string, command: string, args: string[], label: string, timeout = 280_000) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: '1' } })
  logs[label] = `${result.stdout}\n${result.stderr}`
  return result
}

beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'int-001-'))
  elsewhere = join(sandbox, 'unrelated-cwd')
  mkdirSync(elsewhere)
  app = join(sandbox, 'fresh-app')
  mkdirSync(app)
  // Materialize through the documented skill-relative resolution, from a cwd outside the repo.
  const out = execFileSync(process.execPath, [detectScript, app, '--apply'], { cwd: elsewhere, encoding: 'utf8' })
  applyOutput = JSON.parse(out)
  const install = run(app, 'npm', ['ci', '--no-audit', '--no-fund'], 'npm-ci', 500_000)
  expect(install.status, logs['npm-ci']).toBe(0)
}, 600_000)

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true })
})

describe('INT-001 materialized bootstrap', () => {
  it('is materialized from the skill-relative template, independent of the caller cwd', () => {
    expect(applyOutput).toMatchObject({ kind: 'empty', action: 'full-scaffold', requiresConfirmation: false })
    const expected = files(templateDir)
    expect(files(app)).toEqual(expected)
    for (const rel of expected.filter((f) => f !== 'package.json' && f !== 'package-lock.json')) {
      expect(readFileSync(join(app, rel)).equals(readFileSync(join(templateDir, rel))), rel).toBe(true)
    }
    expect(app.startsWith(repo)).toBe(false)
  })

  it('provides all three working anchors', async () => {
    const { detectAnchors } = await import('../../skills/presentation/scripts/detect-scaffold.mjs')
    expect(detectAnchors(app)).toMatchObject({ build: true, kit: true, index: true, missing: [] })
    expect(existsSync(join(app, 'src/presentation-kit/types.ts'))).toBe(true)
    expect(readFileSync(join(app, 'src/presentations/index.ts'), 'utf8')).toMatch(/slug: 'starter'/)
  })

  it('declares and locks the complete dependency set, with exact playwright', () => {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const lock = JSON.parse(readFileSync(join(app, 'package-lock.json'), 'utf8'))
    const runtime = ['react', 'react-dom', 'motion', 'lucide-react']
    const dev = [
      'vite',
      '@vitejs/plugin-react',
      'typescript',
      '@types/react',
      '@types/react-dom',
      '@types/node',
      'eslint',
      '@eslint/js',
      'typescript-eslint',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
      'globals',
      'playwright',
    ]
    for (const dep of runtime) expect(pkg.dependencies[dep], dep).toEqual(expect.any(String))
    for (const dep of dev) expect(pkg.devDependencies[dep], dep).toEqual(expect.any(String))
    expect(pkg.devDependencies.playwright).toBe('1.61.0')
    for (const dep of [...runtime, ...dev]) {
      expect(lock.packages[`node_modules/${dep}`], `lock entry for ${dep}`).toBeDefined()
      expect(existsSync(join(app, 'node_modules', dep, 'package.json')), `installed ${dep}`).toBe(true)
    }
    expect(lock.packages['node_modules/playwright'].version).toBe('1.61.0')
  })

  it('builds with the local package scripts', () => {
    const build = run(app, 'npm', ['run', 'build'], 'build')
    expect(build.status, logs.build).toBe(0)
    expect(existsSync(join(app, 'dist/index.html'))).toBe(true)
  })

  it('lints clean', () => {
    const lint = run(app, 'npm', ['run', 'lint'], 'lint')
    expect(lint.status, logs.lint).toBe(0)
  })

  it('passes its scaffold-local verification on the registered starter route, from outside the source repo', () => {
    const verify = run(app, 'npm', ['run', 'verify'], 'verify', 400_000)
    expect(verify.status, logs.verify).toBe(0)
    expect(logs.verify).toContain('127.0.0.1')
    expect(logs.verify).toContain('starter')
    expect(logs.verify).not.toMatch(/how-to-make-a-presentation/)
  }, 450_000)

  it('keeps the kit byte-aligned with the canonical src/presentation-kit (non-test files, both directions)', () => {
    const isTest = (f: string) => /(\.test\.|\.spec\.|__tests__)/.test(f)
    const canonical = files(join(repo, 'src/presentation-kit')).filter((f) => !isTest(f))
    const materialized = files(join(app, 'src/presentation-kit')).filter((f) => !isTest(f))
    expect(materialized).toEqual(canonical)
    for (const rel of canonical) {
      const a = readFileSync(join(repo, 'src/presentation-kit', rel))
      const b = readFileSync(join(app, 'src/presentation-kit', rel))
      expect(b.equals(a), rel).toBe(true)
    }
  })

  it('keeps verification and inspection scripts aligned, without the canonical sample data', () => {
    for (const rel of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(join(app, rel)).equals(readFileSync(join(repo, rel))), rel).toBe(true)
    }
    const canonicalLib = files(join(repo, 'scripts/lib'))
    expect(files(join(app, 'scripts/lib'))).toEqual(canonicalLib)
    for (const rel of canonicalLib) {
      expect(readFileSync(join(app, 'scripts/lib', rel)).equals(readFileSync(join(repo, 'scripts/lib', rel))), rel).toBe(true)
    }
    expect(existsSync(join(app, 'scripts/verify.reference.json'))).toBe(false)
  })

  it('reports no drift between the repository and the template (sync --check)', () => {
    const check = spawnSync(process.execPath, [join(repo, 'scripts/sync-templates.mjs'), '--check'], { cwd: elsewhere, encoding: 'utf8' })
    expect(check.status, `${check.stdout}${check.stderr}`).toBe(0)
  })

  it('is framework independent: no Tailwind in any package, lock, config or source', () => {
    const scan = scanForStyling(app)
    expect(scan.tailwind).toEqual([])
    for (const rel of files(app)) {
      if (!/\.(json|js|mjs|ts|tsx|html|css)$/.test(rel)) continue
      expect(readFileSync(join(app, rel), 'utf8'), rel).not.toMatch(/tailwind/i)
    }
  })

  it('ships no visual defaults in the kit or the scaffold sources', () => {
    for (const root of [join(app, 'src'), join(repo, 'src/presentation-kit')]) {
      const scan = scanForStyling(root)
      // The only stylesheet allowed is the host reset in src/index.css; the kit has none.
      expect(scan.cssFiles.filter((f) => f !== 'index.css')).toEqual([])
      expect(scan.tokens).toEqual([])
      expect(scan.inlineStyle).toEqual([])
    }
    expect(scanForStyling(join(app, 'src/presentation-kit')).cssFiles).toEqual([])
    const hostCss = readFileSync(join(app, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(hostCss).not.toMatch(/\b(color|background|font|border|box-shadow|text-shadow|padding|gap)\b|--[a-z]|@import|@theme/i)
  })

  it('keeps generated output out of the template directory it came from', () => {
    expect(statSync(templateDir).isDirectory()).toBe(true)
    expect(existsSync(join(templateDir, 'node_modules'))).toBe(false)
    expect(existsSync(join(templateDir, 'dist'))).toBe(false)
  })
})

describe('INT-001 partial scaffolds preserve what exists', () => {
  const ANCHOR_DIRS: Record<string, string[]> = {
    kit: ['src/presentation-kit'],
    index: ['src/presentations'],
    build: ['vite.config.ts'],
  }

  it.each(['kit', 'index', 'build'])('adds only the missing %s anchor and keeps existing files byte-identical', async (anchor) => {
    const { applyScaffold, detectAnchors } = await import('../../skills/presentation/scripts/detect-scaffold.mjs')
    const dir = join(sandbox, `partial-${anchor}`)
    cpSync(templateDir, dir, { recursive: true })
    for (const rel of ANCHOR_DIRS[anchor]) rmSync(join(dir, rel), { recursive: true, force: true })
    mkdirSync(join(dir, 'src/unrelated'), { recursive: true })
    writeFileSync(join(dir, 'src/unrelated/keep.ts'), 'export const keep = true\n')
    writeFileSync(join(dir, 'NOTES.md'), 'mine\n')
    const before = new Map(files(dir).map((f) => [f, readFileSync(join(dir, f))]))
    expect(detectAnchors(dir).missing).toEqual([anchor])

    const result = applyScaffold(dir, { missing: detectAnchors(dir).missing })

    expect(detectAnchors(dir).missing).toEqual([])
    for (const [rel, bytes] of before) {
      if (rel === 'package.json' || rel === '.gitignore') continue
      expect(readFileSync(join(dir, rel)).equals(bytes), rel).toBe(true)
    }
    const added = files(dir).filter((f) => !before.has(f))
    expect(added.sort()).toEqual([...result.written].sort())
    expect(added.length).toBeGreaterThan(0)
    for (const rel of ANCHOR_DIRS[anchor]) expect(existsSync(join(dir, rel)), rel).toBe(true)
  })
})

describe('INT-001 partial scaffold with an incomplete package.json', () => {
  it('gains the full dependency set and scripts, then installs and builds', async () => {
    const { applyScaffold, detectAnchors } = await import('../../skills/presentation/scripts/detect-scaffold.mjs')
    const dir = join(sandbox, 'partial-incomplete-pkg')
    mkdirSync(dir)
    for (const rel of ['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'eslint.config.js']) {
      cpSync(join(templateDir, rel), join(dir, rel))
    }
    const template = JSON.parse(readFileSync(join(templateDir, 'package.json'), 'utf8'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'hand-built',
        private: true,
        type: 'module',
        scripts: { build: template.scripts.build },
        dependencies: { react: template.dependencies.react },
        devDependencies: { vite: template.devDependencies.vite, typescript: template.devDependencies.typescript },
      }),
    )
    expect(detectAnchors(dir).missing).toEqual(['kit', 'index'])

    applyScaffold(dir, { missing: detectAnchors(dir).missing })

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('hand-built')
    expect(pkg.devDependencies.playwright).toBe('1.61.0')
    expect(pkg.scripts.verify).toBe(template.scripts.verify)
    expect(detectAnchors(dir).missing).toEqual([])
    const install = run(dir, 'npm', ['install', '--no-audit', '--no-fund'], 'partial-install', 500_000)
    expect(install.status, logs['partial-install']).toBe(0)
    const build = run(dir, 'npm', ['run', 'build'], 'partial-build')
    expect(build.status, logs['partial-build']).toBe(0)
  }, 600_000)
})
