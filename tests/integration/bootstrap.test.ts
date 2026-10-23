import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sh } from '../helpers/repo-copy'

const REPO = path.resolve(import.meta.dirname, '..', '..')
let work: string
let app: string
let scaffoldOut: string

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

beforeAll(() => {
  work = mkdtempSync(path.join(os.tmpdir(), 'bootstrap-int-'))
  app = path.join(work, 'fresh-app')
  // Invoke the skill's scaffold helper from a cwd outside the source repository.
  const script = path.join(REPO, 'skills/presentation/scripts/setup.mjs')
  const r = sh(process.execPath, [script, 'scaffold', app], os.tmpdir())
  scaffoldOut = r.out
  expect(r.status, r.out).toBe(0)
})
afterAll(() => rmSync(work, { recursive: true, force: true }))

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('installs the full dependency set from the committed lock data', () => {
    expect(scaffoldOut).toContain('"installed": true')
    for (const dep of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), dep).toBe(true)
    expect(existsSync(path.join(app, 'node_modules', 'tailwindcss'))).toBe(false)
  })

  it('has all three scaffold anchors', () => {
    expect(existsSync(path.join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentations/index.ts'))).toBe(true)
    expect(JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8')).scripts.build).toBeTruthy()
  })

  it('keeps the scene kit aligned with the canonical source', () => {
    const canonical = walk(path.join(REPO, 'src/presentation-kit'))
    const copy = walk(path.join(app, 'src/presentation-kit'))
    expect(copy.length).toBe(canonical.length)
    for (const f of canonical) {
      const rel = path.relative(path.join(REPO, 'src/presentation-kit'), f)
      expect(readFileSync(path.join(app, 'src/presentation-kit', rel), 'utf8')).toBe(readFileSync(f, 'utf8'))
    }
  })

  it('builds and lints without any styling framework', () => {
    const build = sh('npm', ['run', 'build'], app)
    expect(build.status, build.out).toBe(0)
    const lint = sh('npm', ['run', 'lint'], app)
    expect(lint.status, lint.out).toBe(0)
    const css = walk(path.join(app, 'src')).filter((f) => f.endsWith('.css'))
    for (const f of css) expect(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/color|font|background|--/)
  })

  it('renders its registered route through its own verification entry point', () => {
    const v = sh('npm', ['run', 'verify'], app)
    expect(v.status, v.out).toBe(0)
    expect(v.out).toContain('verify: [render] PASS starter (3 steps)')
    expect(v.out).toMatch(/preview at http:\/\/127\.0\.0\.1:\d+/)
  })
})
