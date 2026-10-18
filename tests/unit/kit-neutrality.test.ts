import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOOTSTRAP, listFiles, read, ROOT } from './helpers'

const KITS = [
  ['canonical kit', path.join(ROOT, 'src/presentation-kit')],
  ['bootstrap kit', path.join(BOOTSTRAP, 'src/presentation-kit')],
]

// The kit may set layout geometry only; these are the visual properties it must never set.
const VISUAL_PROPS =
  /\b(color|background\w*|font\w*|border\w*|boxShadow|textShadow|outline\w*|padding\w*|margin\w*|fill|stroke\w*|filter)\s*:/
const FRAMEWORKS = /tailwind|styled-components|@emotion|emotion|bootstrap|chakra|mui|@mui|vanilla-extract/i

describe.each(KITS)('%s has zero styling defaults', (_name, dir) => {
  const files = listFiles(dir, { skipTests: true })

  it('ships no style sheets and imports none', () => {
    expect(files.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const f of files) expect(read(dir, f), f).not.toMatch(/import\s+['"][^'"]*\.(css|scss|less)['"]/)
  })

  it('sets no color, font, border, shadow, spacing scale, CSS variable or color literal', () => {
    for (const f of files) {
      const src = read(dir, f)
      expect(src, `${f} visual property`).not.toMatch(VISUAL_PROPS)
      expect(src, `${f} css variable`).not.toMatch(/var\(--|['"`]--[a-z]/)
      expect(src, `${f} color literal`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
      expect(src, `${f} framework`).not.toMatch(FRAMEWORKS)
    }
  })

  it('applies no className of its own', () => {
    for (const f of files) expect(read(dir, f), f).not.toMatch(/className=(["'`]|\{\s*["'`])/)
  })
})

describe('manifests', () => {
  const manifests = [path.join(ROOT, 'package.json'), path.join(BOOTSTRAP, 'package.json')]

  it.each(manifests)('%s requires no styling framework', (file) => {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => FRAMEWORKS.test(n))).toEqual([])
  })

  it('bootstrap vite config has no styling plugin', () => {
    expect(read(BOOTSTRAP, 'vite.config.ts')).not.toMatch(FRAMEWORKS)
  })

  it('the scaffold-wide stylesheet defines no visual defaults', () => {
    const css = read(BOOTSTRAP, 'src/index.css')
    expect(css).not.toMatch(/\b(color|background|font|border|box-shadow|text-shadow|outline|padding)[\w-]*\s*:/)
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|--[a-z]|rgba?\(/i)
  })

  it('stylesheets in the scaffold are presentation-owned and scoped to their presentation class', () => {
    const css = listFiles(path.join(BOOTSTRAP, 'src')).filter((f) => f.endsWith('.css') && f !== 'index.css')
    expect(css).toEqual(['presentations/example/talk.css'])
    const text = read(BOOTSTRAP, 'src/presentations', 'example/talk.css')
    const selectors = [...text.matchAll(/([^{}/]+)\{/g)].map((m) => m[1].trim()).filter(Boolean)
    for (const s of selectors) expect(s.startsWith('.p-example'), s).toBe(true)
    const importers = listFiles(path.join(BOOTSTRAP, 'src')).filter((f) => /\.tsx?$/.test(f) && read(BOOTSTRAP, 'src', f).includes('talk.css'))
    expect(importers).toEqual(['presentations/example/Talk.tsx'])
  })
})
