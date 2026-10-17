import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { listProcesses, materialize, repoRoot, run, scaffoldScript, type Workspace } from './helpers'

// INT-001: the distributable bootstrap template, materialized outside this repository and
// exercised through its own package scripts.

const cleanups: Workspace[] = []
afterAll(() => cleanups.forEach((w) => w.cleanup()))

function hashes(dir: string, skip: (rel: string) => boolean = () => false): Record<string, string> {
  const out: Record<string, string> = {}
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const rel = relative(dir, join(entry.parentPath, entry.name))
    if (!skip(rel)) out[rel] = createHash('sha1').update(readFileSync(join(entry.parentPath, entry.name))).digest('hex')
  }
  return out
}

const skipModules = (rel: string) => rel.startsWith('node_modules') || rel.startsWith('dist') || rel.startsWith('.inspection')

describe('standalone scaffold from an unrelated working directory', () => {
  let app: Workspace

  it('installs from committed lock data, builds, lints and verifies', async () => {
    app = await materialize()
    cleanups.push(app)
    expect(existsSync(join(app.dir, 'package-lock.json'))).toBe(true)

    const install = await run('npm', ['ci'], app.dir)
    expect(install.code, install.output).toBe(0)
    for (const step of ['build', 'lint', 'verify']) {
      const result = await run('npm', ['run', step], app.dir)
      expect(result.code, `${step}\n${result.output}`).toBe(0)
      if (step === 'verify') {
        expect(result.output).toContain('[verify] PASS')
        expect(result.output).toMatch(/browser url http:\/\/127\.0\.0\.1:\d+\/starter/)
      }
    }
    expect(listProcesses(`${app.dir}/node_modules/vite/bin/vite.js`)).toEqual([])
  })

  it('has all three anchors and the complete dependency set installed locally, with no Tailwind', () => {
    const detected = JSON.parse(execFileSync('node', [scaffoldScript, 'detect', '--dir', app.dir], { cwd: tmpdir(), encoding: 'utf8' }))
    expect(detected.anchors).toEqual({ build: true, kit: true, index: true })
    expect(detected.missing).toEqual([])
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', '@eslint/js', 'globals', 'playwright',
    ]) {
      expect(existsSync(join(app.dir, 'node_modules', name, 'package.json')), name).toBe(true)
    }
    for (const name of ['tailwindcss', '@tailwindcss/vite']) {
      expect(existsSync(join(app.dir, 'node_modules', name)), name).toBe(false)
    }
  })

  it('adds a presentation from the presentation template that builds and renders next to the starter', async () => {
    const created = await run('node', [scaffoldScript, 'presentation', '--dir', app.dir, '--slug', 'second-talk', '--title', 'Second Talk'], tmpdir())
    expect(created.code, created.output).toBe(0)
    const build = await run('npm', ['run', 'build'], app.dir)
    expect(build.code, build.output).toBe(0)
    const verify = await run('npm', ['run', 'verify'], app.dir)
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toContain('presentation second-talk: first step ok')
    const inspect = await run('npm', ['run', 'inspect', '--', 'second-talk', '--no-build', '--settle', '150'], app.dir)
    expect(inspect.code, inspect.output).toBe(0)
    expect(readdirSync(join(app.dir, '.inspection/second-talk')).filter((f) => f.endsWith('.png'))).toHaveLength(2)
  })

  it('keeps generated output out of version control by default', () => {
    const ignore = readFileSync(join(app.dir, '.gitignore'), 'utf8')
    for (const entry of ['node_modules', 'dist', '.inspection']) expect(ignore).toContain(entry)
  })
})

describe('monorepo target', () => {
  it('asks for confirmation, then adds a self-contained presentations/ app and leaves the root alone', async () => {
    const root = mkdtempSync(join(tmpdir(), 'and-scene-mono-'))
    cleanups.push({ dir: root, cleanup: () => rmSync(root, { recursive: true, force: true }) })
    mkdirSync(join(root, 'packages/a'), { recursive: true })
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'mono', private: true, workspaces: ['packages/*'] }))
    writeFileSync(join(root, 'packages/a/index.js'), 'export {}\n')
    writeFileSync(join(root, 'README.md'), 'unrelated\n')
    const before = hashes(root)

    const blocked = await run('node', [scaffoldScript, 'bootstrap', '--dir', root, '--apply'], tmpdir())
    expect(blocked.code).toBe(3)
    expect(blocked.output).toContain(join(root, 'presentations'))
    expect(hashes(root)).toEqual(before)

    const done = await run('node', [scaffoldScript, 'bootstrap', '--dir', root, '--apply', '--confirmed'], tmpdir())
    expect(done.code, done.output).toBe(0)
    const after = hashes(root, (rel) => rel.startsWith('presentations/'))
    expect(after).toEqual(before)
    expect(existsSync(join(root, 'presentations/package.json'))).toBe(true)
    expect(existsSync(join(root, 'src'))).toBe(false)

    symlinkSync(join(repoRoot, 'node_modules'), join(root, 'presentations/node_modules'))
    const build = await run('npm', ['run', 'build'], join(root, 'presentations'))
    expect(build.code, build.output).toBe(0)
    const verify = await run('npm', ['run', 'verify'], join(root, 'presentations'))
    expect(verify.code, verify.output).toBe(0)
  })
})

describe('partial scaffold', () => {
  it('adds only the missing anchors, preserves existing bytes, and the result builds', async () => {
    const app = await materialize({ linkModules: true })
    cleanups.push(app)
    writeFileSync(join(app.dir, 'notes.md'), 'unrelated\n')
    rmSync(join(app.dir, 'src/presentation-kit'), { recursive: true })
    for (const rel of ['src/Router.tsx', 'src/Landing.tsx', 'src/route.ts']) rmSync(join(app.dir, rel))
    rmSync(join(app.dir, 'src/presentations'), { recursive: true })
    const before = hashes(app.dir, skipModules)
    const result = await run('node', [scaffoldScript, 'bootstrap', '--dir', app.dir, '--apply', '--confirmed'], tmpdir())
    expect(result.code, result.output).toBe(0)
    const plan = JSON.parse(result.output)
    expect(plan.missing).toEqual(['kit', 'index'])
    const after = hashes(app.dir, skipModules)
    for (const [file, hash] of Object.entries(before)) expect(after[file], file).toBe(hash)
    expect(Object.keys(after).filter((f) => !(f in before)).every((f) => f.startsWith('src/'))).toBe(true)
    const build = await run('npm', ['run', 'build'], app.dir)
    expect(build.code, build.output).toBe(0)
  })
})

describe('template parity with the canonical sources', () => {
  it('has exactly the canonical non-test kit files and scripts', () => {
    const isTest = (rel: string) => rel.split('/').includes('__tests__') || /\.test\.[tj]sx?$/.test(rel)
    const canonical = hashes(join(repoRoot, 'src/presentation-kit'), isTest)
    const copy = hashes(join(repoRoot, 'skills/presentation/templates/bootstrap/src/presentation-kit'))
    expect(copy).toEqual(canonical)
    for (const file of ['verify.mjs', 'inspect-presentation.mjs', 'lib/runtime.mjs', 'lib/settle.mjs', 'lib/diagnostics.mjs']) {
      expect(readFileSync(join(repoRoot, 'skills/presentation/templates/bootstrap/scripts', file))).toEqual(readFileSync(join(repoRoot, 'scripts', file)))
    }
  })
})
