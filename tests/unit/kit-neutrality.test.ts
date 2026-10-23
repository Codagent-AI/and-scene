import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { walk } from './fs-helpers.ts'

const root = path.resolve(import.meta.dirname, '../..')

const kitDir = path.join(root, 'src/presentation-kit')
const kitFiles = walk(kitDir)
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Visual style literals the kit must not carry. Geometry and animation plumbing are allowed. */
const VISUAL = [
  /#[0-9a-fA-F]{3,8}\b/, // hex colors
  /\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/, // color functions
  /\b(background|backgroundColor|background-color|color|borderColor|border-color|fontFamily|font-family|fontSize|fontWeight|boxShadow|box-shadow|textShadow|filter|borderRadius|border-radius|outline)\s*:/, // visual style properties
  /\bborder\s*:/,
  /\b(border|borderTop|borderBottom|borderLeft|borderRight)\s*:/,
  /var\(--/, // theme tokens
  /--[a-z][\w-]*\s*:/, // custom property declarations
  /\b(tailwind|styled-components|@emotion|@stitches|vanilla-extract)\b/i,
]

describe('kit style neutrality', () => {
  it('ships no stylesheet and imports none', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const file of kitFiles) {
      expect(fs.readFileSync(file, 'utf8'), file).not.toMatch(/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/)
    }
  })

  it.each(VISUAL.map((re) => [String(re), re] as const))('contains no visual style literal matching %s', (_name, re) => {
    for (const file of kitFiles) {
      const source = stripComments(fs.readFileSync(file, 'utf8'))
      expect(re.test(source), `${path.relative(root, file)} matches ${re}`).toBe(false)
    }
  })

  it('inline styles in the kit are geometry or animation plumbing only', () => {
    const allowed = new Set([
      'position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'minWidth', 'minHeight', 'overflow',
      'transform', 'transformOrigin', 'display', 'gridTemplateRows', 'gridTemplateColumns', 'alignItems', 'justifyContent',
      'pointerEvents', 'listStyle', 'margin', 'padding', 'marginLeft', 'whiteSpace', 'textOverflow', 'opacity',
    ])
    const found = new Map<string, string[]>()
    for (const file of kitFiles.filter((f) => /\.tsx?$/.test(f))) {
      const source = stripComments(fs.readFileSync(file, 'utf8'))
      for (const block of source.matchAll(/style=\{\{([\s\S]*?)\}\}/g)) {
        for (const key of block[1].matchAll(/(?:^|[,\s])([a-zA-Z]+)\s*:/g)) {
          found.set(key[1], [...(found.get(key[1]) ?? []), path.basename(file)])
        }
      }
    }
    const disallowed = [...found.keys()].filter((k) => !allowed.has(k))
    expect(disallowed).toEqual([])
    // geometry plumbing must not hide a spacing scale: only zero margins and padding are permitted
    for (const file of kitFiles.filter((f) => /\.tsx$/.test(f))) {
      expect(stripComments(fs.readFileSync(file, 'utf8')), path.basename(file)).not.toMatch(/(margin|padding)[A-Za-z]*:\s*(?!0\b|'auto')[\d'"]/)
    }
  })

  it('renders no inline visual defaults for primitives or chrome', async () => {
    const { render } = await import('@testing-library/react')
    const { createElement } = await import('react')
    const { Demo } = await import('./helpers.tsx')
    const kit = await import('../../src/presentation-kit/index.ts')
    const { container } = render(
      createElement('div', null, createElement(Demo), createElement(kit.Box, { id: 'b' }), createElement(kit.Label, {}), createElement(kit.Arrow, { from: [0, 0], to: [1, 1] })),
    )
    const visual = ['color', 'background', 'backgroundColor', 'border', 'borderColor', 'boxShadow', 'fontFamily', 'fontSize', 'fontWeight', 'borderRadius', 'outline']
    for (const el of Array.from(container.querySelectorAll<HTMLElement | SVGElement>('*'))) {
      for (const prop of visual) {
        expect((el.style as unknown as Record<string, string>)[prop] ?? '', `${el.tagName}.${prop}`).toBe('')
      }
    }
  })
})

describe('styling frameworks stay optional', () => {
  const frameworks = /tailwind|styled-components|@emotion|@stitches|vanilla-extract|@mui|chakra|mantine|unocss|windicss|react-bootstrap|"bootstrap"/i

  it('root and bootstrap manifests, Vite configs and kit imports name no styling framework', () => {
    const targets = ['package.json', 'vite.config.ts', 'skills/presentation/templates/bootstrap/package.json', 'skills/presentation/templates/bootstrap/vite.config.ts']
    for (const rel of targets) {
      const file = path.join(root, rel)
      if (!fs.existsSync(file)) continue
      expect(fs.readFileSync(file, 'utf8'), rel).not.toMatch(frameworks)
    }
    for (const file of kitFiles) expect(fs.readFileSync(file, 'utf8'), file).not.toMatch(frameworks)
  })
})
