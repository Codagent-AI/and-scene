import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST } from '../../scripts/lib/preview.mjs'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const kitFiles = walk('src/presentation-kit').filter((f) => !f.includes('__tests__'))
const read = (f: string) => readFileSync(f, 'utf8')

describe('style-neutral kit', () => {
  it('ships no stylesheets, theme tokens or colors', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([])
    for (const file of kitFiles) {
      const source = read(file)
      expect(source, file).not.toMatch(/\.css['"]/)
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(source, file).not.toMatch(/\b(rgba?|hsla?)\(/)
      expect(source, file).not.toMatch(/--[a-z][\w-]*\s*:/)
      for (const property of ['color', 'background', 'fontFamily', 'fontSize', 'border', 'boxShadow', 'borderRadius', 'padding', 'gap']) {
        expect(source, `${file} sets ${property}`).not.toMatch(new RegExp(`\\b${property}\\s*:`))
      }
    }
  })

  it('does not depend on a styling framework', () => {
    const pkg = JSON.parse(read('package.json'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind/i.test(d))).toEqual([])
    for (const file of kitFiles) expect(read(file), file).not.toMatch(/tailwind|styled-components|emotion/i)
  })
})

describe('verification automation', () => {
  it('uses the IPv4 loopback address and never localhost', () => {
    expect(HOST).toBe('127.0.0.1')
    for (const file of walk('scripts')) expect(read(file), file).not.toMatch(/localhost/)
  })

  it('keeps StrictMode in the app entry point', () => {
    expect(read('src/main.tsx')).toContain('<StrictMode>')
  })
})
