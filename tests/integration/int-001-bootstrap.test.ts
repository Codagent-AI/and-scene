import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { alive, previewPid, REPO, run } from '../helpers/proc.ts'
import { listFiles } from '../helpers/tree.ts'

// The skill resolves templates relative to its own SKILL.md, never the caller's cwd.
const SKILL_DIR = resolve(REPO, 'skills/presentation')
const TEMPLATE = join(SKILL_DIR, 'templates/bootstrap')

let work: string
let app: string
let verify: { code: number; out: string }

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  beforeAll(async () => {
    work = mkdtempSync(join(tmpdir(), 'and-scene-int1-'))
    app = join(work, 'app')
    // Materialize from a working directory unrelated to the source repository.
    const unrelated = mkdtempSync(join(tmpdir(), 'and-scene-cwd-'))
    const cp = await run('cp', ['-r', TEMPLATE, app], unrelated)
    expect(cp.code).toBe(0)
    rmSync(unrelated, { recursive: true, force: true })
    expect((await run('npm', ['ci'], app)).code).toBe(0)
    expect((await run('npm', ['run', 'build'], app)).code).toBe(0)
    verify = await run('npm', ['run', 'verify'], app)
  })
  afterAll(() => rmSync(work, { recursive: true, force: true }))

  it('lives outside the source repository and resolves from the skill directory', () => {
    expect(app.startsWith(REPO)).toBe(false)
    expect(existsSync(join(SKILL_DIR, 'SKILL.md'))).toBe(true)
    expect(existsSync(join(app, 'package.json'))).toBe(true)
  })

  it('has all three scaffold anchors', () => {
    expect(existsSync(join(app, 'vite.config.ts'))).toBe(true)
    expect(existsSync(join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(join(app, 'src/presentations/index.ts'))).toBe(true)
  })

  it('installs the complete dependency set from the committed lock', () => {
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of ['react', 'react-dom', 'vite', 'typescript', 'motion', 'lucide-react', 'eslint', 'playwright', '@vitejs/plugin-react', '@types/react', '@types/react-dom', '@types/node']) {
      expect(deps, d).toHaveProperty(d)
      expect(existsSync(join(app, 'node_modules', d, 'package.json')), `${d} installed`).toBe(true)
    }
  })

  it('builds and passes its route smoke check through the local verify entry point', () => {
    expect(verify.out).toContain('verify: PASS')
    expect(verify.code).toBe(0)
    expect(verify.out).toContain('"starter" is registered with 3 steps in order')
    expect(verify.out).toMatch(/preview ready at http:\/\/127\.0\.0\.1:\d+\//)
    const pid = previewPid(verify.out)
    expect(pid && alive(pid)).toBeFalsy()
  })

  it('passes its own lint', async () => {
    expect((await run('npm', ['run', 'lint'], app)).code).toBe(0)
  })

  it('keeps the non-test kit files aligned with the canonical source', () => {
    const canon = listFiles(join(REPO, 'src/presentation-kit'))
    expect(listFiles(join(app, 'src/presentation-kit'))).toEqual(canon)
    for (const f of canon) {
      expect(readFileSync(join(app, 'src/presentation-kit', f)).equals(readFileSync(join(REPO, 'src/presentation-kit', f))), f).toBe(true)
    }
  })

  it('introduces no Tailwind and no visual defaults', () => {
    const lock = readFileSync(join(app, 'package-lock.json'), 'utf8')
    expect(lock).not.toMatch(/tailwind/i)
    const css = listFiles(join(app, 'src')).filter((f) => f.endsWith('.css'))
    for (const f of css) expect(readFileSync(join(app, 'src', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim(), f).toBe('')
    const built = listFiles(join(app, 'dist/assets')).filter((f) => f.endsWith('.css'))
    for (const f of built) expect(readFileSync(join(app, 'dist/assets', f), 'utf8').trim(), f).toBe('')
  })
})

