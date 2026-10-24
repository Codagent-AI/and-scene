import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { alignedPairs, driftedPairs, strayTemplateFiles } from '../../scripts/sync-templates.mjs'
import { makeTempDir, removeDir, REPO, run, runAsync } from '../helpers'

const SKILL_SCRIPTS = path.join(REPO, 'skills', 'presentation', 'scripts')
let tmp: string
let app: string

beforeAll(async () => {
  tmp = makeTempDir('and-scene-int1-')
  app = path.join(tmp, 'app')
  fs.mkdirSync(app)
  // Run from a working directory unrelated to the source repository.
  const scaffold = run('node', [path.join(SKILL_SCRIPTS, 'scaffold.mjs'), app, '--no-install'], os.tmpdir())
  if (scaffold.status !== 0) throw new Error(scaffold.output)
  const ci = await runAsync('npm', ['ci', '--no-audit', '--no-fund'], app)
  if (ci.status !== 0) throw new Error(ci.output)
}, 600_000)

afterAll(() => removeDir(tmp))

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('has all three scaffold anchors, detected from outside the repository', () => {
    const res = run('node', [path.join(SKILL_SCRIPTS, 'detect-scaffold.mjs'), app], os.tmpdir())
    const plan = JSON.parse(res.stdout)
    expect(plan.target).toBe('root')
    expect(plan.anchors).toEqual({ build: true, kit: true, index: true })
    expect(plan.missing).toEqual([])
  })

  it('declares the complete dependency set', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', '@eslint/js', 'globals', 'playwright',
    ]) {
      expect(deps, name).toHaveProperty(name)
      expect(fs.existsSync(path.join(app, 'node_modules', name)), `${name} installed`).toBe(true)
    }
    expect(pkg.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: expect.any(String), inspect: expect.any(String) })
  })

  it('builds, lints, and passes its local verification on the registered route', async () => {
    const build = await runAsync('npm', ['run', 'build'], app)
    expect(build.status, build.output).toBe(0)
    const lint = await runAsync('npm', ['run', 'lint'], app)
    expect(lint.status, lint.output).toBe(0)
    const verify = await runAsync('npm', ['run', 'verify'], app)
    expect(verify.status, verify.output).toBe(0)
    expect(verify.output).toContain('render: /getting-started ok (3 steps)')
    expect(verify.output).toContain('[verify] PASS')
    expect(verify.output).toMatch(/127\.0\.0\.1/)
  })

  it('keeps the canonical kit, scripts, and router aligned with the template', () => {
    expect(alignedPairs(REPO).length).toBeGreaterThan(20)
    expect(driftedPairs(REPO)).toEqual([])
    expect(strayTemplateFiles(REPO)).toEqual([])
  })

  it('materializes the same kit bytes as the canonical source', () => {
    for (const [from, to] of alignedPairs(REPO).filter(([f]) => f.startsWith(path.join('src', 'presentation-kit')))) {
      const dest = path.join(app, 'src', 'presentation-kit', path.relative(path.join('src', 'presentation-kit'), from))
      expect(fs.readFileSync(dest).equals(fs.readFileSync(path.join(REPO, from))), to).toBe(true)
    }
  })

  it('imposes no styling framework or kit-owned visual defaults', () => {
    const pkg = fs.readFileSync(path.join(app, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind/i)
    expect(fs.existsSync(path.join(app, 'node_modules', 'tailwindcss'))).toBe(false)
    expect(fs.readFileSync(path.join(app, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
    const kit = path.join(app, 'src', 'presentation-kit')
    const files: string[] = []
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))))
    walk(kit)
    expect(files.filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([])
    const sources = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    expect(sources.replace(/currentColor/g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|var\(--/)
    // Host-owned CSS in the scaffold is limited to a page reset.
    expect(fs.readFileSync(path.join(app, 'src', 'index.css'), 'utf8')).not.toMatch(/color|font|background/i)
  })
})
