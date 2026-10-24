import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { exec, repo } from './helpers.ts'

const cli = path.join(repo, 'skills/presentation/scripts/scaffold.mjs')
let app: string
let outside: string
const log: Record<string, { code: number; output: string }> = {}

function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = path.join(d, n)
    return statSync(p).isDirectory() ? walk(p).map((f) => path.join(n, f)) : [n]
  })
}

beforeAll(async () => {
  app = mkdtempSync(path.join(tmpdir(), 'bootstrap-app-'))
  outside = mkdtempSync(path.join(tmpdir(), 'bootstrap-cwd-'))
  // Invoked from a working directory unrelated to the source repository.
  log.bootstrap = await exec(process.execPath, [cli, 'bootstrap', app], outside)
  log.create = await exec(process.execPath, [cli, 'create', app, 'smoke-test', 'Smoke Test'], outside)
  log.install = await exec('npm', ['ci', '--no-audit', '--no-fund'], app)
  log.lint = await exec('npm', ['run', 'lint'], app)
  log.build = await exec('npm', ['run', 'build'], app)
  log.verify = await exec('npm', ['run', 'verify'], app)
})

afterAll(() => {
  for (const d of [app, outside]) rmSync(d, { recursive: true, force: true })
})

describe('materialized bootstrap template', () => {
  it('materializes from the skill directory regardless of the working directory', () => {
    expect(log.bootstrap.code, log.bootstrap.output).toBe(0)
    expect(log.create.code, log.create.output).toBe(0)
  })

  it('has all three scaffold anchors and the complete dependency set', () => {
    expect(existsSync(path.join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentations/index.ts'))).toBe(true)
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript', 'motion', 'lucide-react', 'eslint', 'playwright']) {
      expect(deps).toContain(dep)
    }
  })

  it('installs from the committed lock data, lints, and builds', () => {
    expect(log.install.code, log.install.output).toBe(0)
    expect(log.lint.code, log.lint.output).toBe(0)
    expect(log.build.code, log.build.output).toBe(0)
  })

  it('renders its registered route through its local verification entry point', () => {
    expect(log.verify.output).toContain('smoke-test: 3 steps rendered without errors')
    expect(log.verify.output).toContain('VERIFY PASSED')
    expect(log.verify.code).toBe(0)
  })

  it('keeps the materialized kit identical to the canonical src/presentation-kit', () => {
    const kit = (root: string) => walk(path.join(root, 'src/presentation-kit')).sort()
    expect(kit(app)).toEqual(kit(repo))
    for (const f of kit(repo)) {
      expect(readFileSync(path.join(app, 'src/presentation-kit', f), 'utf8'), f).toBe(
        readFileSync(path.join(repo, 'src/presentation-kit', f), 'utf8'),
      )
    }
  })

  it('introduces no styling framework and no kit-owned visual defaults', () => {
    const files = walk(app).filter((f) => !f.startsWith('node_modules') && !f.startsWith('dist') && f !== 'package-lock.json')
    expect(files.some((f) => /tailwind/i.test(f))).toBe(false)
    expect(readFileSync(path.join(app, 'package.json'), 'utf8')).not.toMatch(/tailwind/i)
    expect(files.filter((f) => f.startsWith('src/presentation-kit') && f.endsWith('.css'))).toEqual([])
    expect(readFileSync(path.join(app, 'src/index.css'), 'utf8')).not.toMatch(/(#[0-9a-f]{3,8}\b|rgb|font-family|border|shadow)/i)
  })
})
