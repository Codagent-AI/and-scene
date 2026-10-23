import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { scanDir } from '../unit/helpers/styleScan.ts'
import { REPO, remove, run, tempDir } from '../helpers/project.ts'

// INT-001: the distributable bootstrap template, materialized in a fresh
// location by the skill's own helper, then installed from its committed lock
// data, built, linted and smoke-rendered.
const SCAFFOLD = path.join(REPO, 'skills/presentation/scripts/scaffold.mjs')
const TEMPLATE = path.join(REPO, 'skills/presentation/templates/bootstrap')
let outside: string
let app: string
const results: Record<string, { code: number | null; output: string }> = {}

const files = (dir: string, rel = ''): string[] =>
  readdirSync(path.join(dir, rel)).flatMap((n) => {
    const next = path.join(rel, n)
    return statSync(path.join(dir, next)).isDirectory() ? files(dir, next) : [next]
  })

async function record(name: string, command: string, args: string[], cwd: string) {
  const r = await run(command, args, { cwd, timeoutMs: 420_000 })
  results[name] = { code: r.code, output: `${r.stdout}\n${r.stderr}` }
}

beforeAll(async () => {
  outside = tempDir('and-scene-int001-cwd')
  app = path.join(tempDir('and-scene-int001'), 'app')
  // Invoked from a working directory unrelated to the skill or the target.
  await record('plan', 'node', [SCAFFOLD, 'plan', app], outside)
  await record('apply', 'node', [SCAFFOLD, 'apply', app], outside)
  await record('ci', 'npm', ['ci'], app)
  await record('build', 'npm', ['run', 'build'], app)
  await record('lint', 'npm', ['run', 'lint'], app)
  await record('verify', 'npm', ['run', 'verify'], app)
}, 900_000)

afterAll(() => {
  remove(outside)
  remove(path.dirname(app))
})

describe('materialized bootstrap', () => {
  it('resolves its templates independent of the caller working directory', () => {
    expect(results.plan.code).toBe(0)
    expect(results.apply.code).toBe(0)
    expect(existsSync(path.join(app, 'package.json'))).toBe(true)
    expect(existsSync(path.join(outside, 'package.json'))).toBe(false)
    expect(JSON.parse(results.plan.output).missingAnchors.sort()).toEqual(['build', 'index', 'kit'])
  })

  it('has all three anchors and the complete dependency set installed from the lock', () => {
    expect(detectAnchors(app)).toEqual({ build: true, kit: true, index: true })
    expect(results.ci.code).toBe(0)
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const declared = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]
    for (const name of ['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript', 'motion', 'lucide-react', 'eslint', 'playwright']) {
      expect(declared, name).toContain(name)
      expect(existsSync(path.join(app, 'node_modules', name, 'package.json')), `${name} installed`).toBe(true)
    }
  })

  it('builds, lints and smoke-renders its registered starter route', () => {
    expect(results.build.code, results.build.output).toBe(0)
    expect(results.lint.code, results.lint.output).toBe(0)
    expect(results.verify.code, results.verify.output).toBe(0)
    expect(results.verify.output).toContain('VERIFY PASSED')
    expect(results.verify.output).toContain('[sample-outline] skipped')
    expect(results.verify.output).toContain('[render] /starter (first step)')
    expect(results.verify.output).toContain('step index 0 ok (1/2)') // the two-step starter, not nine
  })

  it('keeps the non-test scene kit byte-aligned with the canonical source, both directions', () => {
    const canonical = files(path.join(REPO, 'src/presentation-kit')).sort()
    const copy = files(path.join(app, 'src/presentation-kit')).sort()
    expect(copy).toEqual(canonical)
    for (const rel of canonical) {
      const a = readFileSync(path.join(REPO, 'src/presentation-kit', rel))
      const b = readFileSync(path.join(app, 'src/presentation-kit', rel))
      expect(b.equals(a), rel).toBe(true)
    }
  })

  it('keeps the verification and inspection scripts and shared dependencies aligned', () => {
    const shared = ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', ...files(path.join(REPO, 'scripts/lib')).map((f) => path.join('scripts/lib', f))]
    for (const rel of shared) {
      expect(readFileSync(path.join(app, rel)).equals(readFileSync(path.join(REPO, rel))), rel).toBe(true)
    }
    expect(files(path.join(app, 'scripts/lib')).sort()).toEqual(files(path.join(REPO, 'scripts/lib')).sort())
    // The reference-sample data and the sync tool are repository-only; the template opts out explicitly.
    expect(existsSync(path.join(app, 'scripts/reference-outline.json'))).toBe(false)
    expect(readFileSync(path.join(app, 'presentation.config.json'), 'utf8')).toContain('"referenceSample": null')
  })

  it('introduces no Tailwind and no kit-owned visual defaults', () => {
    expect(scanDir(path.join(app, 'src'))).toEqual([])
    const lock = readFileSync(path.join(TEMPLATE, 'package-lock.json'), 'utf8')
    expect(lock).not.toMatch(/tailwind/i)
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
    expect(readFileSync(path.join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })

  it('does not leak the repository source or authored sample into the scaffold', () => {
    expect(existsSync(path.join(app, 'src/presentations/how-to-make-a-presentation'))).toBe(false)
    expect(existsSync(path.join(app, 'openspec'))).toBe(false)
  })
})
