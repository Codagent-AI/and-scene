// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..', '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const isTest = (file: string) => /\.test\.tsx?$/.test(file) || path.basename(file).startsWith('testing.')
const kitDir = path.join(root, 'src', 'presentation-kit')
const kitFiles = walk(kitDir).filter((f) => !isTest(f))
const bootstrapKit = path.join(root, 'skills', 'presentation', 'templates', 'bootstrap', 'src', 'presentation-kit')

const ALLOWED_INLINE = new Set([
  'position', 'inset', 'top', 'right', 'bottom', 'left', 'width', 'height', 'transform', 'transformOrigin',
  'display', 'overflow', 'pointerEvents', 'zIndex',
])

/** Property names written in `style={{ ... }}` literals and in `...Style` style objects. */
function inlineStyleKeys(source: string): string[] {
  const keys: string[] = []
  for (const match of source.matchAll(/style=\{\{([\s\S]*?)\}\}/g)) {
    for (const prop of match[1].matchAll(/(?:^|,|\n)\s*(?:\.\.\.\w+|(\w+)\s*(?::|,|$))/g)) if (prop[1]) keys.push(prop[1])
  }
  for (const match of source.matchAll(/return \{ position: 'absolute'([^}]*)\}/g)) {
    for (const prop of ('position' + match[1]).matchAll(/(\w+)\s*:/g)) keys.push(prop[1])
  }
  return keys
}

describe('style neutrality of the kit', () => {
  it('ships no stylesheets and imports no CSS or styling framework', () => {
    expect(walk(kitDir).filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const file of kitFiles) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)].map((m) => m[1])
      for (const spec of imports) {
        const ok = spec.startsWith('.') || ['react', 'motion/react', 'lucide-react'].includes(spec)
        expect(ok, `${path.relative(root, file)} imports ${spec}`).toBe(true)
        expect(spec).not.toMatch(/\.css$|tailwind|styled|emotion/)
      }
    }
  })

  it('sets only geometry and behavior in inline styles', () => {
    for (const file of kitFiles) {
      for (const key of inlineStyleKeys(readFileSync(file, 'utf8'))) {
        expect(ALLOWED_INLINE.has(key), `${path.relative(root, file)} sets style.${key}`).toBe(true)
      }
    }
  })

  it('contains no colors, fonts, borders, shadows, theme variables or utility classes', () => {
    const forbidden = [
      /#[0-9a-fA-F]{3,8}\b/, /\brgba?\(/, /\bhsla?\(/, /font-family|fontFamily|fontSize|fontWeight/, /\bborder(?!-)/i,
      /boxShadow|box-shadow|textShadow/, /background/i, /var\(--/, /--[a-z]+-[a-z]+:/, /className=\{?['"`][^'"`]+['"`]/,
    ]
    for (const file of kitFiles) {
      const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      for (const pattern of forbidden) expect(source, `${path.relative(root, file)} matches ${pattern}`).not.toMatch(pattern)
    }
  })

  it('keeps Tailwind and other styling frameworks out of the manifests', () => {
    const manifests = [path.join(root, 'package.json'), path.join(root, 'skills/presentation/templates/bootstrap/package.json')]
    for (const manifest of manifests) {
      const deps = Object.keys({ ...JSON.parse(readFileSync(manifest, 'utf8')).dependencies, ...JSON.parse(readFileSync(manifest, 'utf8')).devDependencies })
      expect(deps.filter((d) => /tailwind|styled-components|emotion|bootstrap|bulma|@mui|chakra/.test(d))).toEqual([])
    }
  })

  it('has a bootstrap template kit with the same non-test files and bytes', () => {
    const list = (dir: string) => walk(dir).filter((f) => !isTest(f)).map((f) => path.relative(dir, f)).sort()
    expect(list(bootstrapKit)).toEqual(list(kitDir))
    for (const rel of list(kitDir)) {
      expect(readFileSync(path.join(bootstrapKit, rel), 'utf8'), rel).toBe(readFileSync(path.join(kitDir, rel), 'utf8'))
    }
  })
})
