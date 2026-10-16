import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const KIT = path.resolve(__dirname)
const ROOT = path.resolve(KIT, '../..')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}
const kitFiles = files(KIT).filter((f) => !/\.test\.tsx?$/.test(f))

describe('style-neutral kit contract', () => {
  it('contains no stylesheets or CSS-in-JS visual declarations', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|less)$/.test(f))).toEqual([])
    const banned =
      /\b(backgroundColor|background|boxShadow|borderRadius|border|fontFamily|fontSize|fontWeight|color|textShadow|filter)\s*:/
    for (const f of kitFiles) {
      expect(readFileSync(f, 'utf8'), path.relative(ROOT, f)).not.toMatch(banned)
    }
  })

  it('has no color literals, theme tokens or styling-framework references', () => {
    for (const f of kitFiles) {
      const src = readFileSync(f, 'utf8')
      const rel = path.relative(ROOT, f)
      expect(src, rel).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
      expect(src, rel).not.toMatch(/tailwind|styled-components|@emotion|--[a-z]+-[a-z-]+\s*:/i)
    }
  })

  it('does not require a styling framework in the package manifest', () => {
    const pkg = readFileSync(path.join(ROOT, 'package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind/i)
  })
})
