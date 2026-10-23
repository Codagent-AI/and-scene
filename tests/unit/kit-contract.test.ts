// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const KIT = 'src/presentation-kit'
const BOOT = 'skills/presentation/templates/bootstrap'

export function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}
const kitFiles = files(KIT)
const GEOMETRY = new Set([
  'position', 'left', 'right', 'top', 'bottom', 'width', 'height', 'transform', 'transformOrigin', 'display', 'flexDirection',
  'alignItems', 'justifyContent', 'flex', 'overflow', 'boxSizing', 'pointerEvents', 'zIndex',
])

describe('style ownership boundary (L-10, L-12, I-7, L-40, I-41)', () => {
  it('ships no CSS, CSS imports, styling-framework imports or theme tokens', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const f of kitFiles) {
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/import\s+['"][^'"]*\.(css|scss)['"]|tailwind|styled-components|@emotion|var\(--|--[a-z-]+\s*:/i)
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/)
      expect(src, f).not.toMatch(/createElement\(\s*['"]style['"]|<style|insertRule|adoptedStyleSheets/)
    }
  })
  it('uses inline styles only for geometry and layout behavior', () => {
    for (const f of kitFiles.filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))) {
      const src = readFileSync(f, 'utf8')
      const blocks = [...src.matchAll(/style=\{\{([\s\S]*?)\}\}|return\s*\{\s*(position:[^}]*)\}|style:\s*\{([^}]*)\}/g)]
      for (const m of blocks) {
        const body = m[1] ?? m[2] ?? m[3] ?? ''
        const names = [...body.matchAll(/(?:^|[,{\s])([a-zA-Z]+)\s*:/g)].map((x) => x[1]!)
        for (const n of names) expect(GEOMETRY.has(n), `${f}: style property ${n}`).toBe(true)
      }
    }
  })
  it('keeps the dependency graph free of a styling framework and avoids visual attributes', () => {
    const imports = kitFiles.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!))
    const external = new Set(imports.filter((i) => !i.startsWith('.')))
    expect([...external].sort()).toEqual(['lucide-react', 'motion/react', 'react'])
    for (const pkgPath of ['package.json', `${BOOT}/package.json`]) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      expect(all.filter((d) => /tailwind|styled|emotion|bootstrap$|chakra|mui/i.test(d))).toEqual([])
    }
    for (const cfg of ['vite.config.ts', `${BOOT}/vite.config.ts`]) expect(readFileSync(cfg, 'utf8')).not.toMatch(/tailwind/i)
  })
})

describe('template parity (L-67, I-42)', () => {
  const isTest = (f: string) => /\.test\.|__tests__/.test(f)
  const rel = (list: string[], base: string) => list.map((f) => path.relative(base, f)).sort()
  it('keeps the non-test kit file set and bytes identical to the bootstrap copy', () => {
    const canonical = files(KIT).filter((f) => !isTest(f))
    const copy = files(`${BOOT}/${KIT}`).filter((f) => !isTest(f))
    expect(rel(copy, `${BOOT}/${KIT}`)).toEqual(rel(canonical, KIT))
    for (const f of canonical) expect(readFileSync(path.join(BOOT, f), 'utf8'), f).toBe(readFileSync(f, 'utf8'))
  })
  it('keeps verify, inspect and their library identical to the bootstrap copy', () => {
    const scripts = files('scripts').filter((f) => f !== path.join('scripts', 'sync-template.mjs'))
    expect(rel(files(`${BOOT}/scripts`), `${BOOT}/scripts`)).toEqual(rel(scripts, 'scripts'))
    for (const f of scripts) expect(readFileSync(path.join(BOOT, f), 'utf8'), f).toBe(readFileSync(f, 'utf8'))
  })
})

describe('repository contract (L-68, I-23, I-49, C-3)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
  it('declares the required npm gates, with fast unit tests kept separate from browser-backed suites', () => {
    for (const s of ['test', 'lint', 'build', 'verify', 'inspect', 'test:integration', 'test:e2e']) expect(pkg.scripts[s], s).toBeTruthy()
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
    expect(pkg.scripts['test:integration']).toMatch(/tests\/integration/)
    expect(pkg.scripts['test:e2e']).toMatch(/tests\/e2e/)
    const unit = readFileSync('vitest.config.ts', 'utf8')
    expect(unit).toMatch(/tests\/unit\/\*\*/)
    expect(unit).not.toMatch(/tests\/(integration|e2e)/)
  })
  it('commits no dependencies, build output, screenshots or CI configuration', () => {
    expect(tracked.filter((f) => /(^|\/)node_modules\//.test(f))).toEqual([])
    expect(tracked.filter((f) => /^(dist|inspection)\//.test(f) || /\.png$/.test(f) && !f.startsWith('public/'))).toEqual([])
    expect(tracked.filter((f) => f.startsWith('.github/') || /\.gitlab-ci|circleci|azure-pipelines/.test(f))).toEqual([])
    const ignore = readFileSync('.gitignore', 'utf8')
    expect(ignore).toMatch(/^inspection$/m)
    expect(ignore).toMatch(/^dist$/m)
    expect(ignore).toMatch(/^node_modules$/m)
  })
  it('keeps React StrictMode in the root and bootstrap entry points', () => {
    for (const f of ['src/main.tsx', `${BOOT}/src/main.tsx`]) expect(readFileSync(f, 'utf8')).toMatch(/<StrictMode>[\s\S]*<\/StrictMode>/)
  })
  it('keeps the removed placeholder app out of the tree', () => {
    expect(tracked).not.toContain('src/App.tsx')
  })
})
