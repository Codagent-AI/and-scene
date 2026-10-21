// INT-001: the distributable bootstrap materializes outside this repository, installs
// from its committed lock, builds, and renders its registered route.
import { cpSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BOOTSTRAP, ROOT, cleanupTempDirs, run, tempDir, type RunResult } from '../helpers'

let app: string
let outside: string
let install: RunResult
let build: RunResult
let verify: RunResult
let lint: RunResult

const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p, base) : [relative(base, p)]
  })
const isTest = (rel: string) => /(^|\/)__tests__(\/|$)|\.test\.[tj]sx?$/.test(rel)

beforeAll(async () => {
  app = join(tempDir('and-scene-int1-'), 'materialized')
  outside = tempDir('and-scene-cwd-')
  cpSync(BOOTSTRAP, app, { recursive: true })
  install = await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app, timeoutMs: 400_000 })
  build = await run('npm', ['run', 'build'], { cwd: app })
  lint = await run('npm', ['run', 'lint'], { cwd: app })
  // Invoke the materialized verify entry by absolute path from an unrelated working directory.
  verify = await run('node', [join(app, 'scripts/verify.mjs')], { cwd: outside, timeoutMs: 200_000 })
}, 900_000)

afterAll(cleanupTempDirs)

describe('materialized bootstrap', () => {
  it('installs from the committed lock', () => {
    expect(install.code, install.out).toBe(0)
    expect(existsSync(join(app, 'node_modules/react'))).toBe(true)
    expect(existsSync(join(app, 'node_modules/playwright'))).toBe(true)
  })

  it('declares every required dependency and resolves it locally', () => {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react']) {
      expect(pkg.dependencies, dep).toHaveProperty(dep)
      expect(existsSync(join(app, 'node_modules', dep)), dep).toBe(true)
    }
    for (const dep of ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'playwright']) {
      expect(pkg.devDependencies, dep).toHaveProperty(dep)
      expect(existsSync(join(app, 'node_modules', dep)), dep).toBe(true)
    }
    expect(existsSync(join(app, 'node_modules/tailwindcss'))).toBe(false)
    expect(existsSync(join(app, 'node_modules/@tailwindcss'))).toBe(false)
  })

  it('has all three contract anchors', () => {
    expect(build.code, build.out).toBe(0)
    for (const rel of ['package.json', 'vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentation-kit/Stage.tsx', 'src/presentation-kit/usePresentationNav.ts', 'src/presentation-kit/types.ts', 'src/presentations/index.ts', 'src/Router.tsx']) {
      expect(existsSync(join(app, rel)), rel).toBe(true)
    }
    expect(existsSync(join(app, 'dist/index.html'))).toBe(true)
  })

  it('lints clean', () => {
    expect(lint.code, lint.out).toBe(0)
  })

  it('passes its local verify entry from an unrelated working directory, rendering the starter route', () => {
    expect(verify.code, verify.out).toBe(0)
    expect(verify.out).toMatch(/\[verify\] PASS/)
    expect(verify.out).toMatch(/\[sample\] registered: starter/)
    expect(verify.out).toContain('starter step 2/2 ok')
    expect(verify.out).toMatch(/open http:\/\/127\.0\.0\.1:\d+\/starter/)
    expect(verify.out).not.toMatch(/how-to-make-a-presentation/)
  })

  it('keeps the materialized kit and scripts aligned with the canonical sources', () => {
    const canonical = walk(join(ROOT, 'src/presentation-kit')).filter((f) => !isTest(f)).sort()
    expect(walk(join(app, 'src/presentation-kit')).sort()).toEqual(canonical)
    for (const f of canonical) {
      expect(readFileSync(join(app, 'src/presentation-kit', f)).equals(readFileSync(join(ROOT, 'src/presentation-kit', f))), f).toBe(true)
    }
    for (const f of ['verify.mjs', 'inspect-presentation.mjs']) {
      expect(readFileSync(join(app, 'scripts', f)).equals(readFileSync(join(ROOT, 'scripts', f))), f).toBe(true)
    }
  })

  it('imports nothing from the source repository and carries no visual defaults in the kit', () => {
    const files = walk(join(app, 'src')).filter((f) => /\.(ts|tsx|css)$/.test(f))
    for (const f of files) expect(readFileSync(join(app, 'src', f), 'utf8'), f).not.toMatch(/openspec|skills\/presentation|tailwind/i)
    for (const f of walk(join(app, 'src/presentation-kit'))) expect(f).not.toMatch(/\.css$/)
  })
})
