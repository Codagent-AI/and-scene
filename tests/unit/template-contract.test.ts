import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JS module without types
import { SYNCED_FILES, SYNCED_SCRIPTS, isKitSource } from '../../scripts/template-sync.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const bootstrap = path.join(root, 'skills/presentation/templates/bootstrap')

function walk(dir: string): string[] {
  return (fs.readdirSync(dir, { recursive: true }) as string[]).filter((f) => fs.statSync(path.join(dir, f)).isFile())
}
const rel = (base: string, sub: string) => walk(path.join(base, sub)).map((f) => path.join(sub, f))
const same = (a: string, b: string) => fs.readFileSync(a).equals(fs.readFileSync(b))

describe('bootstrap template stays aligned with the canonical sources', () => {
  it('mirrors every non-test kit file byte for byte, with no extras', () => {
    const canonical = rel(root, 'src/presentation-kit').filter(isKitSource).sort()
    const template = rel(bootstrap, 'src/presentation-kit').sort()
    expect(template).toEqual(canonical)
    for (const f of canonical) expect(same(path.join(root, f), path.join(bootstrap, f)), f).toBe(true)
  })

  it('does not ship kit tests in the template', () => {
    expect(rel(bootstrap, 'src/presentation-kit').filter((f) => /\.test\./.test(f))).toEqual([])
  })

  it.each([...SYNCED_FILES, ...SYNCED_SCRIPTS] as string[])('mirrors %s', (f) => {
    expect(same(path.join(root, f), path.join(bootstrap, f))).toBe(true)
  })
})

describe('bootstrap template is complete and style-neutral', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(bootstrap, 'package.json'), 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  it('declares the full dependency set', () => {
    for (const name of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) {
      expect(deps[name], name).toBeTruthy()
    }
  })

  it('declares the verify, inspect, build, and lint scripts', () => {
    expect(Object.keys(pkg.scripts)).toEqual(expect.arrayContaining(['build', 'lint', 'verify', 'inspect']))
    expect(pkg.scripts.build).toBe('tsc -b && vite build')
  })

  it('has no Tailwind or other styling framework', () => {
    expect(Object.keys(deps).filter((d) => /tailwind|styled-components|emotion/.test(d))).toEqual([])
    const vite = fs.readFileSync(path.join(bootstrap, 'vite.config.ts'), 'utf8')
    expect(vite).not.toMatch(/tailwind/i)
  })

  it('ships a lockfile for reproducible installs', () => {
    const lock = JSON.parse(fs.readFileSync(path.join(bootstrap, 'package-lock.json'), 'utf8'))
    expect(lock.packages['node_modules/playwright']).toBeTruthy()
  })

  it('defines no presentation styling outside the starter presentation', () => {
    const host = fs.readFileSync(path.join(bootstrap, 'src/index.css'), 'utf8')
    expect(host).not.toMatch(/color|font|background|border|shadow|--/i)
    const stylesheets = walk(bootstrap).filter((f) => f.endsWith('.css'))
    expect(stylesheets.sort()).toEqual(['src/index.css', 'src/presentations/starter/style.css'])
    // The starter's stylesheet is an empty placeholder: no rule, so no colors, fonts, spacing, or cards.
    const starter = fs.readFileSync(path.join(bootstrap, 'src/presentations/starter/style.css'), 'utf8')
    expect(starter.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe('')
  })

  it('registers a starter presentation so the app has a route to verify', () => {
    const index = fs.readFileSync(path.join(bootstrap, 'src/presentations/index.ts'), 'utf8')
    expect(index).toContain("slug: 'starter'")
    expect(fs.existsSync(path.join(bootstrap, 'src/presentations/starter/Talk.tsx'))).toBe(true)
  })

  it('does not mark the template as requiring the reference sample', () => {
    expect(pkg.andScene).toBeUndefined()
  })
})
