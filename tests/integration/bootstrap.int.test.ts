import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanupSandboxes, leftoverProcesses, repoRoot, run, tempDir } from '../helpers/sandbox'

afterAll(cleanupSandboxes)

const tool = path.join(repoRoot, 'skills/presentation/scripts/skill-tools.mjs')
let app: string
let elsewhere: string
let install: Awaited<ReturnType<typeof run>>
let build: Awaited<ReturnType<typeof run>>
let verify: Awaited<ReturnType<typeof run>>

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const f = path.join(dir, n)
    return statSync(f).isDirectory() ? walk(f) : [f]
  })
}

// INT-001: materialize the distributable bootstrap outside the repository and exercise it.
beforeAll(async () => {
  app = tempDir('bootstrap-app')
  elsewhere = tempDir('bootstrap-cwd')
  // Invoked from an unrelated working directory: template lookup must not depend on it.
  const scaffold = await run('node', [tool, 'scaffold', app], elsewhere)
  expect(scaffold.code, scaffold.out).toBe(0)
  install = await run('npm', ['ci', '--no-audit', '--no-fund'], app)
  build = await run('npm', ['run', 'build'], app)
  verify = await run('npm', ['run', 'verify', '--', '--skip-build'], app)
})

describe('INT-001: materialized bootstrap', () => {
  it('detects all three anchors and the full dependency set', async () => {
    const detected = JSON.parse((await run('node', [tool, 'detect', app], elsewhere)).out)
    expect(detected).toMatchObject({ kind: 'existing-app', anchors: { build: true, kit: true, index: true }, missing: [] })
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'playwright']) {
      expect(deps, d).toHaveProperty(d)
    }
  })

  it('installs from the committed lock data and builds with no type errors', () => {
    expect(install.code, install.out).toBe(0)
    expect(build.code, build.out).toBe(0)
  })

  it('opens the registered starter route through its local verification entry point', () => {
    expect(verify.code, verify.out).toBe(0)
    expect(verify.out).toMatch(/render: starter/)
    expect(verify.out).toMatch(/PASS verify: 1 presentation\(s\), 2 step\(s\)/)
    expect(verify.out).toMatch(/127\.0\.0\.1/)
  })

  it('lints clean', async () => {
    const lint = await run('npm', ['run', 'lint'], app)
    expect(lint.code, lint.out).toBe(0)
  })

  it('keeps the kit and scripts aligned with the canonical sources', () => {
    const canonical = path.join(repoRoot, 'src/presentation-kit')
    for (const f of walk(canonical)) {
      const copy = path.join(app, 'src/presentation-kit', path.relative(canonical, f))
      expect(readFileSync(copy).equals(readFileSync(f)), f).toBe(true)
    }
    for (const name of ['verify.mjs', 'inspect-presentation.mjs', 'preview.mjs']) {
      expect(readFileSync(path.join(app, 'scripts', name)).equals(readFileSync(path.join(repoRoot, 'scripts', name)))).toBe(true)
    }
  })

  it('introduces no Tailwind and no kit-owned visual defaults', () => {
    const files = walk(path.join(app, 'src')).concat(path.join(app, 'package.json'), path.join(app, 'vite.config.ts'))
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/tailwind/i)
    expect(walk(path.join(app, 'src')).filter((f) => f.endsWith('.css')).map((f) => path.relative(app, f))).toEqual(['src/index.css'])
    expect(existsSync(path.join(app, 'package-lock.json'))).toBe(true)
  })

  it('leaves no preview process behind', async () => {
    expect(await leftoverProcesses(app)).toEqual([])
  })
})
