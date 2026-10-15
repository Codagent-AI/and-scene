import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { REPO, processesMentioning, run } from './helpers'

const BOOTSTRAP = path.join(REPO, 'skills/presentation/templates/bootstrap')
const dir = mkdtempSync(path.join(tmpdir(), 'and-scene-bootstrap-'))
const outside = mkdtempSync(path.join(tmpdir(), 'and-scene-cwd-'))
afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
})

function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = path.join(d, n)
    if (n === 'node_modules' || n === 'dist') return []
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('INT-001: materialized bootstrap is complete and style-neutral', () => {
  it('materializes via the helper from an unrelated cwd, installs from lock data, builds, lints, and verifies', async () => {
    const helper = path.join(REPO, 'skills/presentation/scripts/scaffold.mjs')
    const scaffold = await run('node', [helper, '--target', dir], outside)
    expect(scaffold.code, scaffold.output).toBe(0)
    expect(readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).toBe(readFileSync(path.join(BOOTSTRAP, 'package-lock.json'), 'utf8'))

    const ci = await run('npm', ['ci', '--no-audit', '--no-fund'], dir)
    expect(ci.code, ci.output).toBe(0)

    const build = await run('npm', ['run', 'build'], dir)
    expect(build.code, build.output).toBe(0)
    const lint = await run('npm', ['run', 'lint'], dir)
    expect(lint.code, lint.output).toBe(0)
    const verify = await run('npm', ['run', 'verify', '--silent'], dir)
    expect(verify.output).toContain('PASS build')
    expect(verify.output).toContain('PASS sample: "starter" is registered')
    expect(verify.output).toMatch(/PASS render: 3 steps rendered cleanly on 127\.0\.0\.1/)
    expect(verify.code, verify.output).toBe(0)
    expect(await processesMentioning(dir)).toEqual([])
  })

  it('has all three anchors, the starter registered, and the full dependency set', () => {
    expect(existsSync(path.join(dir, 'src/presentation-kit/Presentation.tsx'))).toBe(true)
    expect(existsSync(path.join(dir, 'src/presentations/index.ts'))).toBe(true)
    expect(readFileSync(path.join(dir, 'src/presentations/index.ts'), 'utf8')).toContain("slug: 'starter'")
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const d of ['react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'typescript-eslint', 'playwright']) {
      expect(deps, d).toContain(d)
    }
    for (const s of ['dev', 'build', 'lint', 'preview', 'verify', 'inspect']) expect(pkg.scripts[s], s).toBeTruthy()
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('kit is byte-aligned with canonical src/presentation-kit', () => {
    const kit = (root: string) => walk(path.join(root, 'src/presentation-kit')).map((p) => [path.relative(root, p), readFileSync(p, 'utf8')])
    expect(kit(dir)).toEqual(kit(REPO))
  })

  it('contains no Tailwind and no visual defaults', () => {
    const all = walk(dir).filter((p) => !p.endsWith('package-lock.json'))
    expect(all.filter((p) => p.includes(`${path.sep}presentation-kit${path.sep}`) && p.endsWith('.css'))).toEqual([])
    for (const p of all) {
      const text = readFileSync(p, 'utf8')
      expect(text, p).not.toMatch(/tailwind|@theme|@apply/i)
    }
    const pkgText = readFileSync(path.join(dir, 'package.json'), 'utf8')
    expect(pkgText).not.toMatch(/tailwind/i)
    expect(readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).not.toMatch(/tailwind/i)
    for (const p of all.filter((f) => f.endsWith('.css'))) {
      const css = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(css, p).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|font-family|font-size|box-shadow|border(-radius)?\s*:|background|--[\w-]+\s*:/i)
    }
  })

  it('exposes the route smoke target independent of this repository', async () => {
    const mod = await import(pathToFileURL(path.join(dir, 'scripts/verify.mjs')).href)
    expect(mod.SAMPLE.slug).toBe('starter')
  })
})
