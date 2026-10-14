import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot, run } from './helpers'
import { findDrift } from '../scripts/sync-templates.mjs'
import { templatesDir } from '../skills/presentation/scripts/scaffold-lib.mjs'

function walk(d: string): string[] {
  return readdirSync(d).flatMap((f) => {
    const p = path.join(d, f)
    return f === 'node_modules' ? [] : statSync(p).isDirectory() ? walk(p) : [p]
  })
}

// INT-001: the materialized bootstrap template is complete, builds, passes its own verify, and is style-neutral.
describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  const outside = mkdtempSync(path.join(tmpdir(), 'and-scene-int001-'))
  const app = path.join(outside, 'app')

  it('resolves templates independent of the caller cwd and has the full dependency set', () => {
    const before = process.cwd()
    process.chdir(outside)
    try {
      const dir = templatesDir('bootstrap')
      expect(existsSync(path.join(dir, 'package.json'))).toBe(true)
      cpSync(dir, app, { recursive: true })
    } finally {
      process.chdir(before)
    }
    const skill = readFileSync(path.join(repoRoot, 'skills/presentation/SKILL.md'), 'utf8')
    expect(skill).toMatch(/`SKILL_DIR` is the directory that contains this `SKILL.md`/)
    expect(skill).toMatch(/never\*\* relative to the\s+caller's working directory/)

    const pkg = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const d of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react',
      '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps, d).toHaveProperty(d)
    }
    for (const s of ['build', 'lint', 'verify', 'inspect', 'dev', 'preview', 'test']) expect(pkg.scripts, s).toBeTruthy()
    expect(Object.keys(deps).filter((n) => /tailwind/.test(n))).toEqual([])
    expect(existsSync(path.join(app, 'package-lock.json'))).toBe(true)
    // anchors: build setup, scene kit, presentation index
    expect(existsSync(path.join(app, 'vite.config.ts'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(app, 'src/presentations/index.ts'))).toBe(true)
  })

  it('keeps kit and scripts aligned with the canonical copies', () => {
    expect(findDrift(repoRoot)).toEqual([])
  })

  it('has no Tailwind or visual defaults in the kit or host CSS', () => {
    const sources = walk(app).filter((f) => /\.(tsx?|css|mjs|json)$/.test(f) && !f.endsWith('package-lock.json'))
    for (const f of sources) expect(readFileSync(f, 'utf8'), f).not.toMatch(/tailwind/i)
    const css = readFileSync(path.join(app, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/--[\w-]+\s*:|#[0-9a-f]{3,8}\b|\brgba?\(|font-family|box-shadow|\bborder(-\w+)?\s*:|background\s*:/i)
    expect(walk(path.join(app, 'src/presentation-kit')).filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([])
  })

  it('installs, builds, and passes its own route smoke verification', async () => {
    const install = await run('npm', ['ci'], app)
    expect(install.code, install.output).toBe(0)
    const build = await run('npm', ['run', 'build'], app)
    expect(build.code, build.output).toBe(0)
    const lint = await run('npm', ['run', 'lint'], app)
    expect(lint.code, lint.output).toBe(0)
    const verify = await run('npm', ['run', 'verify'], app)
    expect(verify.output).toContain('VERIFY PASS')
    expect(verify.code).toBe(0)
  })
})
