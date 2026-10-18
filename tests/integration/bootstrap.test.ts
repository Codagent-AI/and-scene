import { cp, readFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BOOTSTRAP, diffTrees, listFiles } from '../support/fs'
import { REPO, remove, run, tempDir, type RunResult } from '../support/sandbox'

// INT-001: the distributable bootstrap works outside the repository that authored it.
describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  let work: string
  let app: string
  const results: Record<string, RunResult> = {}

  beforeAll(async () => {
    work = await tempDir('bootstrap')
    app = path.join(work, 'app')
    // Resolve the template from the skill's own location (absolute), never from the caller's cwd,
    // and run the materialisation from an unrelated working directory.
    const skillDir = path.join(REPO, 'skills/presentation')
    const copy = `
      import { cp } from 'node:fs/promises'
      await cp(${JSON.stringify(path.join(skillDir, 'templates/bootstrap'))}, ${JSON.stringify(app)}, {
        recursive: true,
        filter: (s) => !/node_modules|\\/dist(\\/|$)/.test(s),
      })`
    const materialised = await run(process.execPath, ['--input-type=module', '-e', copy], work)
    expect(materialised.code, materialised.stderr).toBe(0)
    await rename(path.join(app, 'gitignore'), path.join(app, '.gitignore'))

    results.ci = await run('npm', ['ci'], app)
    results.build = await run('npm', ['run', 'build'], app)
    results.lint = await run('npm', ['run', 'lint'], app)
    results.verify = await run('npm', ['run', 'verify'], app)
  })
  afterAll(() => remove(work))

  it('installs from the committed lock data without touching the lock', async () => {
    expect(results.ci.code, results.ci.stderr).toBe(0)
    const lock = await readFile(path.join(app, 'package-lock.json'), 'utf8')
    expect(lock).toBe(await readFile(path.join(REPO, BOOTSTRAP, 'package-lock.json'), 'utf8'))
  })

  it('builds with no type errors', () => {
    expect(results.build.code, results.build.stdout + results.build.stderr).toBe(0)
  })

  it('lints clean', () => {
    expect(results.lint.code, results.lint.stdout + results.lint.stderr).toBe(0)
  })

  it('passes its own verification entry point on the registered starter route', () => {
    expect(results.verify.code, results.verify.stdout + results.verify.stderr).toBe(0)
    expect(results.verify.stdout).toMatch(/\[sample\] starter registered/)
    expect(results.verify.stdout).toMatch(/\[render\] http:\/\/127\.0\.0\.1:\d+\/starter 2 steps ok/)
    expect(results.verify.stdout).toContain('PASS verify')
  })

  it('has all three anchors and the executable helper scripts', () => {
    for (const f of ['vite.config.ts', 'src/presentation-kit/Presentation.tsx', 'src/presentations/index.ts', 'scripts/verify.mjs', 'scripts/inspect-presentation.mjs']) {
      expect(existsSync(path.join(app, f)), f).toBe(true)
    }
  })

  it('installs the complete dependency set', () => {
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), dep).toBe(true)
    }
  })

  it('keeps the kit and scripts aligned with the canonical sources', () => {
    expect(diffTrees(path.join(REPO, 'src/presentation-kit'), path.join(app, 'src/presentation-kit'))).toEqual([])
    expect(diffTrees(path.join(REPO, 'scripts'), path.join(app, 'scripts'))).toEqual([])
  })

  it('introduces no Tailwind and no visual defaults', async () => {
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
    const css = listFiles(app).filter((f) => f.endsWith('.css') && !f.startsWith('node_modules') && !f.startsWith('dist'))
    expect(css.length).toBeGreaterThan(0)
    for (const f of css) {
      expect((await readFile(path.join(app, f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').trim(), f).toBe('')
    }
    await cp(path.join(app, 'package.json'), path.join(work, 'pkg.json'))
  })
})
