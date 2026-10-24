import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/scaffold.mjs'
import { ROOT, discard, leftoverPreviews, run } from './helpers.ts'

// INT-001: the distributable bootstrap works outside the repository that authored it.
const SKILL = path.join(ROOT, 'skills/presentation')
const walk = (dir: string, base = dir): string[] =>
  readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n === 'dist') return []
    const f = path.join(dir, n)
    return statSync(f).isDirectory() ? walk(f, base) : [path.relative(base, f)]
  })

describe('INT-001 materialized bootstrap is complete and style-neutral', () => {
  let app: string
  let elsewhere: string
  const steps: Record<string, ReturnType<typeof run>> = {}

  beforeAll(() => {
    app = mkdtempSync(path.join(tmpdir(), 'bootstrap-app-'))
    elsewhere = mkdtempSync(path.join(tmpdir(), 'unrelated-cwd-'))
    // Invoke the skill's scripts by absolute path from an unrelated working directory.
    steps.apply = run('node', [path.join(SKILL, 'scripts/scaffold.mjs'), 'apply', app], { cwd: elsewhere })
    steps.create = run('node', [path.join(SKILL, 'scripts/scaffold.mjs'), 'create', app, 'second-talk', 'Second Talk'], { cwd: elsewhere })
    steps.install = run('npm', ['ci'], { cwd: app })
    steps.build = run('npm', ['run', 'build'], { cwd: app })
    steps.lint = run('npm', ['run', 'lint'], { cwd: app })
    steps.verify = run('npm', ['run', 'verify'], { cwd: app, env: { VERIFY_SETTLE_MS: '700' } })
    steps.inspect = run('npm', ['run', 'inspect', '--', 'starter', '--no-build', '--settle', '400'], { cwd: app })
    steps.verifySecond = run('npm', ['run', 'verify', '--', 'second-talk'], { cwd: app, env: { VERIFY_SETTLE_MS: '700' } })
  })
  afterAll(() => {
    discard(app)
    discard(elsewhere)
  })

  it('materializes from the skill directory even when run from an unrelated working directory', () => {
    expect(steps.apply.code).toBe(0)
    expect(steps.create.code).toBe(0)
    expect(existsSync(path.join(app, 'src/presentation-kit/Stage.tsx'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentations/second-talk/Talk.tsx'))).toBe(true)
  })

  it('has all three anchors and installs from the committed lock data', async () => {
    expect(await detectAnchors(app)).toEqual({ build: true, kit: true, index: true })
    expect(steps.install.code, steps.install.output).toBe(0)
    const manifest = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    for (const dep of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', 'playwright',
    ]) {
      const declared = manifest.dependencies?.[dep] ?? manifest.devDependencies?.[dep]
      expect(declared, dep).toBeTruthy()
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), `installed: ${dep}`).toBe(true)
    }
  })

  it('builds and lints with no type errors', () => {
    expect(steps.build.code, steps.build.output).toBe(0)
    expect(steps.lint.code, steps.lint.output).toBe(0)
    expect(existsSync(path.join(app, 'dist/index.html'))).toBe(true)
  })

  it('renders its registered starter route through its local verification entry point', () => {
    expect(steps.verify.code, steps.verify.output).toBe(0)
    expect(steps.verify.output).toContain('VERIFY PASSED (build, sample, render)')
    expect(steps.verify.output).toMatch(/open http:\/\/127\.0\.0\.1:\d+\/starter/)
    expect(steps.verify.output).toContain('step 2/2 rendered')
    expect(leftoverPreviews(app)).toEqual([])
  })

  it('verifies a presentation created from the presentation template through the same entry point', () => {
    expect(steps.verifySecond.code, steps.verifySecond.output).toBe(0)
    expect(steps.verifySecond.output).toMatch(/open http:\/\/127\.0\.0\.1:\d+\/second-talk/)
    expect(steps.verifySecond.output).toContain('step 2/2 rendered')
    expect(existsSync(path.join(app, 'scripts/inspect-presentation.mjs'))).toBe(true)
  })

  it('ships a working project-local screenshot helper entry point', () => {
    expect(steps.inspect.code, steps.inspect.output).toBe(0)
    expect(steps.inspect.output).toMatch(/production preview http:\/\/127\.0\.0\.1:\d+\/starter/)
    expect(existsSync(path.join(app, 'inspection/starter/step-01.png'))).toBe(true)
    expect(existsSync(path.join(app, 'inspection/starter/step-02.png'))).toBe(true)
    expect(JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8')).scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
  })

  it('keeps the canonical kit and scripts aligned with the materialized copies, both directions', () => {
    const pairs: [string, string][] = [['src/presentation-kit', 'src/presentation-kit'], ['scripts/lib', 'scripts/lib']]
    for (const [canonical, copy] of pairs) {
      const a = walk(path.join(ROOT, canonical)).sort()
      const b = walk(path.join(app, copy)).sort()
      expect(b, canonical).toEqual(a)
      for (const f of a) expect(readFileSync(path.join(app, copy, f)).equals(readFileSync(path.join(ROOT, canonical, f))), f).toBe(true)
    }
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(readFileSync(path.join(app, f)).equals(readFileSync(path.join(ROOT, f))), f).toBe(true)
    }
  })

  it('introduces no styling framework and no visual defaults in the kit, CSS, or host files', () => {
    const files = walk(app).filter((f) => !f.startsWith('node_modules') && f !== 'package-lock.json')
    for (const f of files) {
      if (/\.(css|ts|tsx|mjs|json|html)$/.test(f)) expect(readFileSync(path.join(app, f), 'utf8'), f).not.toMatch(/tailwind/i)
    }
    const css = files.filter((f) => f.endsWith('.css'))
    expect(css.every((f) => !f.startsWith('src/presentation-kit/'))).toBe(true)
    const visual = /(^|[\s{;])(color|background(-color|-image)?|font(-family|-size|-weight)?|border(-[a-z]+)?|box-shadow|padding(-[a-z]+)?|margin(-[a-z]+)?|gap|border-radius|text-shadow)\s*:/m
    for (const f of css) expect(readFileSync(path.join(app, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), f).not.toMatch(visual)
    expect(readFileSync(path.join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })
})

