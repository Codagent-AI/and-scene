import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')
const kitDir = path.join(root, 'src/presentation-kit')

function kitFiles(dir = kitDir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    return e.isDirectory() ? kitFiles(full) : [full]
  })
}
const sources = kitFiles().filter((f) => !/\.test\.tsx?$/.test(f))
const read = (f: string) => fs.readFileSync(f, 'utf8')

describe('style-neutral kit contract', () => {
  it('contains source files to scan', () => {
    expect(sources.length).toBeGreaterThan(15)
  })

  it('ships no stylesheet and imports none', () => {
    expect(kitFiles().filter((f) => /\.(css|scss|sass|less)$/.test(f))).toEqual([])
    for (const f of sources) expect(read(f), f).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
  })

  it('sets no visual style properties (color, font, border, shadow, spacing, background)', () => {
    const visual = /(?<![-\w])(color|backgroundColor|background|font\w*|border\w*|boxShadow|textShadow|padding\w*|margin\w*|outline\w*|stroke\w*|filter)\s*:/
    for (const f of sources) {
      const code = read(f).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code, path.relative(root, f)).not.toMatch(visual)
    }
  })

  it('contains no hard-coded color values or theme tokens', () => {
    for (const f of sources) {
      const code = read(f).replace(/\/\/.*$/gm, '')
      expect(code, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|--[a-z]+-[a-z-]+\s*:/)
    }
  })

  it('has no styling-framework dependency or import', () => {
    for (const f of sources) expect(read(f), f).not.toMatch(/tailwind|styled-components|@emotion|@stitches/i)
    const pkg = JSON.parse(read(path.join(root, 'package.json')))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|styled-components|emotion/.test(d))).toEqual([])
  })

  it('imports only react, motion, lucide-react, and kit-local modules', () => {
    for (const f of sources) {
      for (const m of read(f).matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(m[1], `${path.relative(root, f)} imports ${m[1]}`).toMatch(/^(\.|react$|react\/|motion\/react$|lucide-react$)/)
      }
    }
  })
})
