import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createElement, type ComponentType } from 'react'
import { render } from '@testing-library/react'
import { afterAll, describe, expect, it } from 'vitest'
import { Presentation, type Step } from '../../src/presentation-kit'
import { Box } from '../../src/presentation-kit'
import { SceneLayer } from '../../src/presentation-kit'
import { isStyleClean, scanForStyling } from '../helpers/styleScan'

const KIT = resolve(__dirname, '../../src/presentation-kit')

/** Inline style properties the kit may set: geometry and motion only. */
const ALLOWED_INLINE = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'display', 'flex', 'flexDirection', 'flexWrap', 'flexShrink', 'flexGrow', 'flexBasis', 'alignItems', 'justifyContent',
  'overflow', 'overflowWrap', 'whiteSpace', 'textOverflow', 'zIndex', 'pointerEvents',
  'transform', 'transformOrigin', 'opacity', 'boxSizing', 'listStyle',
])

describe('I-11/I-12/I-35 kit has zero style defaults', () => {
  it('the real kit contains no stylesheet, tailwind, theme token, or visual inline style', () => {
    const result = scanForStyling(KIT)
    expect(result).toEqual({ cssFiles: [], tailwind: [], tokens: [], inlineStyle: [] })
    expect(isStyleClean(result)).toBe(true)
  })

  describe('scanner catches violations (failure modes)', () => {
    const dirs: string[] = []
    function fixture(files: Record<string, string>): string {
      const dir = mkdtempSync(join(tmpdir(), 'style-scan-'))
      dirs.push(dir)
      for (const [name, body] of Object.entries(files)) {
        mkdirSync(join(dir, name, '..'), { recursive: true })
        writeFileSync(join(dir, name), body)
      }
      return dir
    }
    afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

    it('flags css files', () => {
      expect(scanForStyling(fixture({ 'a/theme.css': 'a{}' })).cssFiles).toEqual([join('a', 'theme.css')])
    })
    it('flags tailwind in source and package.json', () => {
      const r = scanForStyling(fixture({ 'x.tsx': "import 'tailwindcss'", 'package.json': '{"dependencies":{"@tailwindcss/vite":"1"}}' }))
      expect(r.tailwind.sort()).toEqual(['package.json', 'x.tsx'])
    })
    it('flags css custom property tokens', () => {
      const r = scanForStyling(fixture({ 'x.tsx': "const s = { '--accent': 'red' }; const t = 'var(--accent)'" }))
      expect(r.tokens.length).toBeGreaterThan(0)
    })
    it.each([
      ["color: 'red'"],
      ["backgroundColor: '#fff'"],
      ["fontFamily: 'serif'"],
      ["borderRadius: 4"],
      ["boxShadow: '0 0 4px'"],
      ["padding: '0 16px'"],
      ["marginTop: 8"],
      ["gap: 8"],
    ])('flags inline %s', (decl) => {
      const r = scanForStyling(fixture({ 'x.tsx': `export const s = <div style={{ ${decl} }} />` }))
      expect(r.inlineStyle).toHaveLength(1)
    })
    it.each([["position: 'absolute', left: 4, width: 10"], ["margin: 0"], ["padding: '0 0'"], ['transform: "scale(2)"']])(
      'accepts geometry/motion %s',
      (decl) => {
        const r = scanForStyling(fixture({ 'x.tsx': `export const s = <div style={{ ${decl} }} />` }))
        expect(isStyleClean(r)).toBe(true)
      },
    )
    it('ignores prohibited words in comments', () => {
      expect(isStyleClean(scanForStyling(fixture({ 'x.ts': '// color: red\n/* padding: 4 */\nexport {}' })))).toBe(true)
    })
  })

  it('unstyled primitives and chrome render only geometry/motion inline styles', () => {
    const Scene: ComponentType<{ payload: undefined; stepIndex: number }> = () =>
      createElement(
        SceneLayer,
        null,
        createElement(Box, { id: 'a', x: 1, y: 2, w: 3, h: 4, label: 'A', emphasis: true }),
      )
    const steps: Step[] = [
      { id: 's1', era: 'E', title: 'T', caption: 'C', Scene },
      { id: 's2', era: 'F', title: 'T2', caption: 'C2', Scene },
    ]
    const { container } = render(createElement(Presentation<undefined>, { steps, title: 'x', brand: 'host' }))
    const offenders: string[] = []
    for (const el of container.querySelectorAll<HTMLElement>('*')) {
      for (let i = 0; i < el.style.length; i++) {
        const prop = el.style[i]!
        const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
        const spacing = camel.startsWith('margin') || camel.startsWith('padding')
        if (spacing) {
          if (!['0px', '0'].includes(el.style.getPropertyValue(prop))) offenders.push(`${el.tagName}.${prop}`)
        } else if (!ALLOWED_INLINE.has(camel)) offenders.push(`${el.tagName}.${prop}`)
      }
    }
    expect(offenders).toEqual([])
    // Fallback look must not come from stylesheets either.
    expect(document.querySelectorAll('style, link[rel="stylesheet"]')).toHaveLength(0)
  })
})
