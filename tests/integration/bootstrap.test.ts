// INT-001: the distributable bootstrap template works outside the repository that authored it.
import { cpSync, existsSync, readFileSync, readdirSync, renameSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, cleanupTempDirs, isListening, previewPort, run, tempDir, type RunResult } from '../support/repo'

afterAll(cleanupTempDirs)

const TEMPLATE = path.join(REPO, 'skills/presentation/templates/bootstrap')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === 'dist') return []
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

let app: string
let elsewhere: string
let install: RunResult
let build: RunResult
let lint: RunResult
let verify: RunResult

beforeAll(async () => {
  const parent = tempDir('int-bootstrap')
  app = path.join(parent, 'app')
  elsewhere = tempDir('int-cwd')
  cpSync(TEMPLATE, app, { recursive: true })
  renameSync(path.join(app, 'gitignore.template'), path.join(app, '.gitignore'))
  // Every command runs from a working directory outside both the template and the source repository.
  install = await run('npm', ['--prefix', app, 'ci', '--no-audit', '--no-fund'], { cwd: elsewhere })
  build = await run('npm', ['--prefix', app, 'run', 'build'], { cwd: elsewhere })
  lint = await run('npm', ['--prefix', app, 'run', 'lint'], { cwd: elsewhere })
  verify = await run('node', [path.join(app, 'scripts/verify.mjs')], { cwd: elsewhere })
})

describe('INT-001: materialized bootstrap', () => {
  it('installs from its committed lock data', () => {
    expect(install.code, install.stderr).toBe(0)
  })

  it('builds and lints', () => {
    expect(build.code, build.stdout + build.stderr).toBe(0)
    expect(existsSync(path.join(app, 'dist/index.html'))).toBe(true)
    expect(lint.code, lint.stdout + lint.stderr).toBe(0)
  })

  it('renders its registered route end to end through its own verify entry point', async () => {
    expect(verify.code, verify.stdout + verify.stderr).toBe(0)
    expect(verify.stdout).toContain('verify: PASS (build ok; example: 2 steps)')
    for (const url of verify.stdout.match(/https?:\/\/\S+/g) ?? []) expect(url).toMatch(/^http:\/\/127\.0\.0\.1:/)
    expect(await isListening(previewPort(verify.stdout)!)).toBe(false)
  })

  it('has all three scaffold anchors', () => {
    expect(JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8')).scripts.build).toBe('tsc -b && vite build')
    for (const f of ['src/presentation-kit/types.ts', 'src/presentation-kit/Stage.tsx', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'src/router.tsx']) {
      expect(existsSync(path.join(app, f)), f).toBe(true)
    }
  })

  it('resolves the complete dependency set from its own node_modules', () => {
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const required of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(names, required).toContain(required)
      expect(existsSync(path.join(app, 'node_modules', required, 'package.json')), `${required} installed`).toBe(true)
    }
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
  })

  it('imports nothing from outside the app', () => {
    for (const file of walk(app).filter((f) => /\.(ts|tsx|mjs)$/.test(f))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/from\s+'(\.[^']*)'/g)) {
        const target = path.resolve(path.dirname(file), m[1])
        expect(path.relative(app, target).startsWith('..'), `${path.relative(app, file)} imports ${m[1]}`).toBe(false)
      }
    }
  })

  it('keeps the canonical kit and scripts aligned with the materialized copies', () => {
    for (const dir of ['src/presentation-kit', 'scripts']) {
      const canonical = walk(path.join(REPO, dir)).map((f) => path.relative(path.join(REPO, dir), f)).sort()
      const copy = walk(path.join(app, dir)).map((f) => path.relative(path.join(app, dir), f)).sort()
      expect(copy).toEqual(canonical)
      for (const f of canonical) {
        expect(readFileSync(path.join(app, dir, f), 'utf8') === readFileSync(path.join(REPO, dir, f), 'utf8'), `${dir}/${f}`).toBe(true)
      }
    }
  })

  it('ships the neutral scaffold without a styling framework or kit styling', () => {
    expect(walk(path.join(app, 'src/presentation-kit')).filter((f) => f.endsWith('.css'))).toEqual([])
    const built = readdirSync(path.join(app, 'dist/assets')).filter((f) => f.endsWith('.css'))
    for (const css of built) expect(readFileSync(path.join(app, 'dist/assets', css), 'utf8')).not.toMatch(/color|font|background|border|shadow/)
  })
})
