import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { SYNCED } from '../../scripts/sync-templates.mjs'

const KIT = 'src/presentation-kit'
const BOOTSTRAP = 'skills/presentation/templates/bootstrap'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

describe('style-neutral kit contract', () => {
  const files = walk(KIT)

  it('ships no stylesheets and no styling framework imports (I-11, I-12)', () => {
    expect(files.filter((f) => /\.(css|scss|sass|less|pcss)$/.test(f))).toEqual([])
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(m[1], `${f} imports ${m[1]}`).toMatch(/^(\.|react$|motion\/react$|lucide-react$|react\/jsx-runtime$)/)
      }
      expect(src).not.toMatch(/tailwind/i)
    }
  })

  it('sets no colors, fonts, borders, shadows, radii, padding, margins or theme tokens (I-11)', () => {
    const visual =
      /\b(color|background|backgroundColor|border\w*|boxShadow|textShadow|fontFamily|fontSize|fontWeight|padding\w*|margin\w*|gap|filter)\s*:/
    for (const f of files.filter((f) => /\.tsx?$/.test(f))) {
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(visual)
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|--[a-z][\w-]*\s*:/)
    }
  })

  it('does not require Tailwind in the app or the scaffold (I-12)', () => {
    for (const pkgFile of ['package.json', `${BOOTSTRAP}/package.json`]) {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
      const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      expect(names.filter((n) => /tailwind/i.test(n))).toEqual([])
    }
    expect(walk(BOOTSTRAP).filter((f) => !f.includes('node_modules') && /tailwind/i.test(f))).toEqual([])
  })

  it('scaffold CSS defines no theme, colors, fonts or component styles (I-11)', () => {
    const css = readFileSync(`${BOOTSTRAP}/src/index.css`, 'utf8')
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/color|font|background|border|shadow|--/i)
  })

  it('declares the complete dependency set in the scaffold (I-36)', () => {
    const pkg = JSON.parse(readFileSync(`${BOOTSTRAP}/package.json`, 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    for (const dep of [
      'react', 'react-dom', 'motion', 'lucide-react', 'vite', '@vitejs/plugin-react', 'typescript',
      '@types/react', '@types/react-dom', '@types/node', 'eslint', 'typescript-eslint', 'playwright',
    ]) expect(names, dep).toContain(dep)
    expect(pkg.scripts).toMatchObject({ build: expect.any(String), lint: expect.any(String), verify: expect.any(String) })
  })
})

describe('template and canonical source parity (I-69)', () => {
  const same = (rel: string) => {
    const canonical = statSync(rel).isDirectory() ? walk(rel) : [rel]
    expect(canonical.length).toBeGreaterThan(0)
    for (const file of canonical) {
      const copy = path.join(BOOTSTRAP, file)
      expect(readFileSync(copy, 'utf8'), `${copy} drifted from ${file}; run npm run sync:templates`).toBe(
        readFileSync(file, 'utf8'),
      )
    }
    if (statSync(rel).isDirectory()) {
      expect(walk(path.join(BOOTSTRAP, rel)).length).toBe(canonical.length)
    }
  }
  for (const rel of SYNCED) it(`${rel} is aligned`, () => same(rel))
})
