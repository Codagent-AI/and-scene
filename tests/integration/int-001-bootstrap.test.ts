import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { REPO, makeTempDir, remove, run, type RunResult } from '../support/sandbox'

// INT-001: the distributable bootstrap, materialized outside this repository and exercised
// through its own package scripts.
const SKILL = path.join(REPO, 'skills/presentation')
const TEMPLATE = path.join(SKILL, 'templates/bootstrap')
const KIT_PARITY_IGNORE = /\.test\.tsx?$/

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)).map((f) => path.join(e.name, f)) : [e.name]))

let work = ''
let app = ''
let elsewhere = ''
let scaffoldRun: RunResult
let install: RunResult
let build: RunResult
let verify: RunResult
let lint: RunResult

beforeAll(async () => {
  work = makeTempDir('int-001-')
  app = path.join(work, 'app')
  elsewhere = path.join(work, 'unrelated-cwd')
  await run('mkdir', ['-p', elsewhere], { cwd: work })
  // Invoke the skill's scaffold helper from an unrelated working directory with a relative target.
  scaffoldRun = await run('node', [path.join(SKILL, 'scripts/scaffold.mjs'), '../app'], { cwd: elsewhere })
  install = await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app })
  build = await run('npm', ['run', 'build'], { cwd: app })
  verify = await run('npm', ['run', 'verify'], { cwd: app, env: { VERIFY_STEP_TIMEOUT: '5000' } })
  lint = await run('npm', ['run', 'lint'], { cwd: app })
})
afterAll(() => remove(work))

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('resolves templates from the skill directory regardless of the caller cwd', () => {
    expect(scaffoldRun.code, scaffoldRun.output).toBe(0)
    expect(existsSync(path.join(elsewhere, 'src'))).toBe(false)
    for (const rel of ['package.json', 'package-lock.json', 'src/presentations/index.ts', 'src/presentation-kit/Presentation.tsx', 'scripts/verify.mjs']) {
      expect(readFileSync(path.join(app, rel)), rel).toEqual(readFileSync(path.join(TEMPLATE, rel)))
    }
  })

  it('installs from the committed lock data, builds, and passes lint', () => {
    expect(install.code, install.output).toBe(0)
    expect(build.code, build.output).toBe(0)
    expect(existsSync(path.join(app, 'dist/index.html'))).toBe(true)
    expect(lint.code, lint.output).toBe(0)
  })

  it('has all three anchors and the complete dependency set installed', async () => {
    const detect = await run('node', [path.join(SKILL, 'scripts/detect.mjs'), app], { cwd: elsewhere })
    const found = JSON.parse(detect.output)
    expect(found.anchors).toEqual({ build: true, kit: true, index: true })
    expect(found.missing).toEqual([])
    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright']) {
      expect(deps, dep).toContain(dep)
      expect(existsSync(path.join(app, 'node_modules', dep, 'package.json')), `${dep} installed`).toBe(true)
    }
  })

  it('opens the registered route through its local verification entry point', () => {
    expect(verify.code, verify.output).toBe(0)
    expect(verify.output).toMatch(/^VERIFY PASS$/m)
    expect(verify.output).toMatch(/phase registry: ok \(starter\)/)
    expect(verify.output).toMatch(/phase render: http:\/\/127\.0\.0\.1:\d+\/starter/)
    expect(verify.output).toMatch(/starter step 1\/3 index=0 "Start with the subject"/)
    expect(verify.output).toMatch(/starter step 3\/3 index=2 "Summarize"/)
    expect(verify.output).not.toMatch(/console\.error|pageerror|localhost/)
  })

  it('keeps canonical kit files and verification scripts aligned with the template copy', () => {
    const canonical = files(path.join(REPO, 'src/presentation-kit')).filter((f) => !KIT_PARITY_IGNORE.test(f)).sort()
    expect(files(path.join(app, 'src/presentation-kit')).filter((f) => !KIT_PARITY_IGNORE.test(f)).sort()).toEqual(canonical)
    for (const f of canonical) expect(readFileSync(path.join(app, 'src/presentation-kit', f)), f).toEqual(readFileSync(path.join(REPO, 'src/presentation-kit', f)))
    for (const f of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']) {
      expect(readFileSync(path.join(app, f)), f).toEqual(readFileSync(path.join(REPO, f)))
    }
  })

  it('introduces no Tailwind and no visual defaults owned by the kit or scaffold', () => {
    expect(existsSync(path.join(app, 'node_modules/tailwindcss'))).toBe(false)
    expect(existsSync(path.join(app, 'node_modules/@tailwindcss'))).toBe(false)
    const css = files(path.join(app, 'src')).filter((f) => f.endsWith('.css'))
    expect(css.sort()).toEqual(['index.css', path.join('presentations', 'starter', 'styles.css')])
    const built = readdirSync(path.join(app, 'dist/assets')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(path.join(app, 'dist/assets', f), 'utf8')).join('\n')
    expect(built).not.toMatch(/color\s*:|background|font-family|box-shadow|border\s*:/)
  })
})
