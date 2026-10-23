import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  REPO,
  SKILL_SCRIPT,
  cleanupTempDirs,
  createPresentation,
  materializeBootstrap,
  run,
  tempDir,
  type RunResult,
} from '../support/workspace.ts'

// INT-001: the distributable bootstrap works outside the repository that authored it.
const REQUIRED = [
  'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
  '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'typescript-eslint', 'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh', 'globals', 'playwright',
]
const KIT = 'src/presentation-kit'

const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))],
  )

describe('INT-001 materialized bootstrap is complete and style-neutral', () => {
  let app: string
  let detectOut: { anchors: Record<string, boolean>; target: string }
  let install: RunResult
  let build: RunResult
  let verify: RunResult
  let lint: RunResult

  beforeAll(async () => {
    app = await materializeBootstrap(false)
    await createPresentation(app, 'smoke-test', 'Smoke Test')
    const cwd = tempDir('and-scene-cwd-') // run everything from outside the source repository
    const detect = await run(process.execPath, [SKILL_SCRIPT, 'detect', app], cwd)
    detectOut = JSON.parse(detect.out)
    install = await run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund', '--ignore-scripts'], app)
    build = await run('npm', ['run', 'build'], app)
    lint = await run('npm', ['run', 'lint'], app)
    verify = await run('npm', ['run', 'verify'], app)
  })
  afterAll(cleanupTempDirs)

  it('materializes all three contract anchors at the root of an empty directory', () => {
    expect(detectOut.target).toBe(app)
    expect(detectOut.anchors).toEqual({ build: true, kit: true, index: true })
    expect(existsSync(path.join(app, 'vite.config.ts'))).toBe(true)
    expect(existsSync(path.join(app, KIT, 'Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentations/index.ts'))).toBe(true)
  })

  it('installs the complete dependency set from the committed lock data', () => {
    expect(install.code, install.out).toBe(0)
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const declared = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const dep of REQUIRED) {
      expect(declared[dep], `declared ${dep}`).toBeTruthy()
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), `installed ${dep}`).toBe(true)
    }
  })

  it('builds and lints the materialized app', () => {
    expect(build.code, build.out).toBe(0)
    expect(lint.code, lint.out).toBe(0)
    expect(existsSync(path.join(app, 'dist/index.html'))).toBe(true)
  })

  it('smoke-renders the registered route through its local verification entry point', () => {
    expect(verify.code, verify.out).toBe(0)
    expect(verify.out).toMatch(/verify: PASS/)
    expect(verify.out).toContain('verify: opening http://127.0.0.1:')
    expect(verify.out).toContain('/smoke-test step 2/2')
  })

  it('keeps the scene kit aligned with the canonical source (non-test files, both directions)', () => {
    const canonical = walk(path.join(REPO, KIT)).filter((f) => !/\.test\./.test(f)).sort()
    const materialized = walk(path.join(app, KIT)).filter((f) => !/\.test\./.test(f)).sort()
    expect(materialized).toEqual(canonical)
    for (const f of canonical) {
      expect(readFileSync(path.join(app, KIT, f)).equals(readFileSync(path.join(REPO, KIT, f))), f).toBe(true)
    }
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(path.join(app, f)).equals(readFileSync(path.join(REPO, f))), f).toBe(true)
    }
  })

  it('introduces no Tailwind and no visual defaults in the kit or scaffold', () => {
    const files = walk(app).filter((f) => !f.startsWith('node_modules') && !f.startsWith('dist') && f !== 'package-lock.json')
    for (const f of files) {
      const src = readFileSync(path.join(app, f), 'utf8')
      expect(src, f).not.toMatch(/tailwind/i)
      if (f.endsWith('.css') && !f.startsWith('src/presentations/')) {
        expect(src, f).not.toMatch(/#[0-9a-f]{3,8}\b|\brgb\(|font-family|box-shadow|border-radius|background/i)
      }
    }
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
    expect(existsSync(path.join(app, 'node_modules/@tailwindcss'))).toBe(false)
    const css = readdirSync(path.join(app, 'dist/assets')).filter((f) => f.endsWith('.css'))
    for (const f of css) {
      const built = readFileSync(path.join(app, 'dist/assets', f), 'utf8')
      expect(built).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|font-family|box-shadow|border-radius|background/i)
    }
  })
})
