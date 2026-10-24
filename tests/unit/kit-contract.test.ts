// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')
const KIT = path.join(root, 'src', 'presentation-kit')

function kitSources(): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = []
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (!/\.test\.tsx?$/.test(e.name)) out.push({ file: path.relative(KIT, p), text: fs.readFileSync(p, 'utf8') })
    }
  }
  walk(KIT)
  return out
}

// Style properties the kit must never set: palette, type, borders, shadows,
// spacing, and control treatments belong to presentations.
const VISUAL_PROPS =
  /\b(color|background\w*|border\w*|boxShadow|textShadow|fontFamily|fontSize|fontWeight|lineHeight|letterSpacing|padding\w*|margin\w*|gap|outline\w*|listStyle|textDecoration|cursor)\s*:/

describe('scene kit style neutrality', () => {
  const sources = kitSources()

  it('has sources to inspect', () => {
    expect(sources.length).toBeGreaterThan(10)
  })

  it('imports no stylesheets', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/)
    }
  })

  it('sets no visual style properties', () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(VISUAL_PROPS)
    }
  })

  it('uses no hard-coded colour values or theme tokens', () => {
    for (const { file, text } of sources) {
      const stripped = text.replace(/currentColor/g, '')
      expect(stripped, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|var\(--/)
    }
  })

  it('depends on no styling framework', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(names.filter((n) => /tailwind|styled-components|emotion|bootstrap|chakra/i.test(n))).toEqual([])
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/tailwind|styled-components|@emotion/i)
    }
  })
})
