import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupTmp, run, tmpDir } from '../helpers/proc'
import { ROOT } from '../helpers/spec-outline'

afterAll(cleanupTmp)

const CLI = path.join(ROOT, 'skills/presentation/scripts/scaffold.mjs')
const REQUIRED = ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'playwright']

const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === 'dist') return []
    const f = path.join(dir, n)
    return statSync(f).isDirectory() ? walk(f, base) : [path.relative(base, f)]
  })

let app: string
let cwd: string

beforeAll(async () => {
  // Materialize from a working directory unrelated to the source repository.
  cwd = tmpDir('int001-cwd')
  app = path.join(tmpDir('int001-app'), 'app')
  const boot = await run('node', [CLI, 'bootstrap', app, '--target', app], { cwd })
  expect(boot.code, boot.stderr).toBe(0)
  const add = await run('node', [CLI, 'add', app, 'smoke-test', 'Smoke Test'], { cwd })
  expect(add.code, add.stderr).toBe(0)
  const install = await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app, timeoutMs: 400000 })
  expect(install.code, install.stdout + install.stderr).toBe(0)
})

// INT-001: the distributable bootstrap snapshot is complete and style-neutral.
describe('INT-001: materialized bootstrap', () => {
  it('has all three contract anchors, and template lookup did not depend on the caller\'s cwd', async () => {
    const resolved = JSON.parse((await run('node', [CLI, 'resolve', app], { cwd })).stdout)
    expect(resolved.anchors).toEqual({ build: true, kit: true, index: true })
    expect(resolved.missing).toEqual([])
    expect(walk(cwd)).toEqual([]) // nothing was written relative to the caller's cwd
    for (const anchor of ['src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'vite.config.ts']) {
      expect(existsSync(path.join(app, anchor)), anchor).toBe(true)
    }
  })

  it('declares the full dependency set in package.json and the committed lock data, and installed it', () => {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const lock = JSON.parse(readFileSync(path.join(app, 'package-lock.json'), 'utf8'))
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    const eslintStack = ['eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint']
    for (const dep of [...REQUIRED, ...eslintStack]) {
      expect(declared[dep], `${dep} declared`).toBeDefined()
      expect(lock.packages[`node_modules/${dep}`], `${dep} locked`).toBeDefined()
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), `${dep} installed`).toBe(true)
    }
  })

  it('builds, lints, and passes its own verification entry point on the registered route', async () => {
    const build = await run('npm', ['run', 'build', '--silent'], { cwd: app, timeoutMs: 300000 })
    expect(build.code, build.stdout + build.stderr).toBe(0)
    const lint = await run('npm', ['run', 'lint', '--silent'], { cwd: app, timeoutMs: 300000 })
    expect(lint.code, lint.stdout + lint.stderr).toBe(0)
    const verify = await run('npm', ['run', 'verify', '--silent'], { cwd: app, timeoutMs: 400000 })
    const out = verify.stdout + verify.stderr
    expect(verify.code, out).toBe(0)
    expect(out).toContain('render: opening http://127.0.0.1:')
    expect(out).toContain('/smoke-test')
    expect(out).toContain('observed step indices 0,1')
    expect(out).toMatch(/PASS verify/)
  })

  it('keeps the kit and scripts byte-aligned with the canonical sources', () => {
    const kit = walk(path.join(ROOT, 'src/presentation-kit'))
    expect(walk(path.join(app, 'src/presentation-kit'))).toEqual(kit)
    for (const f of kit) {
      expect(readFileSync(path.join(app, 'src/presentation-kit', f)), f).toEqual(readFileSync(path.join(ROOT, 'src/presentation-kit', f)))
    }
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', ...walk(path.join(ROOT, 'scripts/lib')).map((x) => path.join('lib', x))]) {
      expect(readFileSync(path.join(app, 'scripts', f)), f).toEqual(readFileSync(path.join(ROOT, 'scripts', f)))
    }
  })

  it('introduces no Tailwind or visual defaults in the reusable kit or the scaffold', () => {
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
    expect(existsSync(path.join(app, 'node_modules/@tailwindcss'))).toBe(false)
    const own = walk(app).filter((f) => !f.startsWith(`src${path.sep}presentations${path.sep}smoke-test`) && f !== 'package-lock.json')
    for (const f of own) {
      expect(readFileSync(path.join(app, f), 'utf8'), f).not.toMatch(/tailwind/i)
    }
    const css = own.filter((f) => /\.(css|scss|sass|less)$/.test(f))
    expect(css).toEqual([path.join('src', 'index.css')])
    for (const f of own.filter((x) => x.startsWith(`src${path.sep}presentation-kit`))) {
      expect(readFileSync(path.join(app, f), 'utf8'), f).not.toMatch(/\b(?:backgroundColor|fontFamily|boxShadow|borderRadius|fontSize)\s*:|#[0-9a-fA-F]{6}\b/)
    }
  })
})
