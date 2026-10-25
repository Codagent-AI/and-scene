import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { findDrift } from '../../skills/presentation/scripts/sync-templates.mjs'
import { REPO, cleanup, run, tmpDir } from '../helpers.mjs'

const SCAFFOLD = path.join(REPO, 'skills/presentation/scripts/scaffold.mjs')

afterAll(cleanup)

function filesUnder(dir) {
  return readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === 'dist') return []
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? filesUnder(p) : [p]
  })
}

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  const outside = tmpDir('int001-cwd')
  const app = tmpDir('int001-app')
  const steps = {}

  beforeAll(async () => {
    // Invoked from a working directory outside both the source repository and the target.
    steps.apply = await run(process.execPath, [SCAFFOLD, 'apply', app], { cwd: outside })
    steps.add = await run(process.execPath, [SCAFFOLD, 'add', app, 'smoke', 'Smoke Test'], { cwd: outside })
    steps.addQuoted = await run(process.execPath, [SCAFFOLD, 'add', app, 'quoted', `Say "hi" \\ {x} <b> it's`], { cwd: outside })
    steps.install = await run('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], { cwd: app })
    steps.build = await run('npm', ['run', 'build'], { cwd: app })
    steps.lint = await run('npm', ['run', 'lint'], { cwd: app })
    steps.verify = await run('npm', ['run', 'verify'], { cwd: app })
  })

  it('scaffolds, installs from the committed lock data, builds, and lints', () => {
    for (const k of ['apply', 'add', 'addQuoted', 'install', 'build', 'lint']) expect(steps[k].code, `${k}\n${steps[k].out}`).toBe(0)
  })

  it('renders the registered route through its own verification entry point', () => {
    expect(steps.verify.code, steps.verify.out).toBe(0)
    expect(steps.verify.out).toContain('smoke: rendered 2 steps without errors')
    expect(steps.verify.out).toContain('quoted: rendered 2 steps without errors')
    expect(steps.verify.out).toContain('[verify] PASS')
  })

  it('contains all three anchors and the complete dependency set', () => {
    expect(existsSync(path.join(app, 'vite.config.ts'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(readFileSync(path.join(app, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'smoke'")
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of ['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'typescript', 'motion', 'lucide-react', 'eslint', 'playwright']) {
      expect(deps[d], d).toBeDefined()
    }
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('keeps the template kit and verification scripts aligned with the canonical sources', () => {
    expect(findDrift()).toEqual([])
    for (const rel of ['src/presentation-kit/Presentation.tsx', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(path.join(app, rel))).toEqual(readFileSync(path.join(REPO, rel)))
    }
  })

  it('introduces no Tailwind and no visual defaults in the kit or the scaffold host CSS', () => {
    const files = filesUnder(app)
    expect(files.filter((f) => /tailwind/i.test(path.basename(f)))).toEqual([])
    const kitCss = files.filter((f) => f.includes('presentation-kit') && f.endsWith('.css'))
    expect(kitCss).toEqual([])
    const host = readFileSync(path.join(app, 'src/index.css'), 'utf8')
    expect(host).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|font-family|box-shadow|border/i)
    const lock = readFileSync(path.join(app, 'package-lock.json'), 'utf8')
    expect(lock).not.toMatch(/"node_modules\/(@?tailwindcss)/)
  })
})
