/// <reference lib="dom" />
import { cleanup, render } from '@testing-library/react'
import { createElement as h } from 'react'
import type { FC } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  Presentation,
  SceneLayer,
  SymbolChip,
} from '../../src/presentation-kit'
import type { Step, SceneProps } from '../../src/presentation-kit'
import {
  ALLOWED_INLINE_STYLE,
  KIT_DIRS,
  REPO_ROOT,
  kitAbsolutePaths,
  listKitFiles,
  scanKitDirectory,
  scanKitSources,
} from './helpers/kit-scan'

afterEach(() => cleanup())

describe('kit source scan (L-11)', () => {
  it('scans the repository kit copy and any bootstrap copy that exists', () => {
    expect(KIT_DIRS).toContain('src/presentation-kit')
    for (const dir of kitAbsolutePaths()) {
      expect(listKitFiles(dir).length).toBeGreaterThan(0)
    }
  })

  it.each(KIT_DIRS)('%s ships no stylesheet, CSS-in-JS, visual declarations or theme tokens', (dir) => {
    const findings = scanKitDirectory(join(REPO_ROOT, dir))
    expect(findings).toEqual([])
  })

  it('negative control: flags planted stylesheet, import, CSS-in-JS, colour, font, border, shadow and custom property', () => {
    const root = mkdtempSync(join(tmpdir(), 'kit-scan-'))
    try {
      mkdirSync(join(root, 'nodes'))
      writeFileSync(join(root, 'planted.css'), '.x { color: red; }\n')
      writeFileSync(
        join(root, 'Planted.tsx'),
        [
          "import './planted.css'",
          "import styled from 'styled-components'",
          'export const s = { color: "red", fontFamily: "Inter", border: "1px solid", boxShadow: "0 0 4px #000", "--brand": "x" }',
          'export const t = { background: "#123456", borderRadius: 4 }',
          'export const u = styled.div`color: red;`',
        ].join('\n'),
      )
      writeFileSync(join(root, 'nodes', 'Geo.tsx'), "export const g = { position: 'absolute', left: 1, top: 2, width: 3, height: 4, transform: 'none' }\n")
      writeFileSync(join(root, 'nodes', 'Ignored.test.tsx'), "export const x = { color: 'red' }\n")

      const findings = scanKitDirectory(root)
      const categories = new Set(findings.map((f) => f.category))
      expect(categories).toEqual(
        new Set(['stylesheet', 'stylesheet-import', 'styling-framework', 'css-in-js', 'visual-declaration', 'color-value', 'custom-property']),
      )
      expect(findings.some((f) => f.file.endsWith('Geo.tsx'))).toBe(false)
      expect(findings.some((f) => f.file.endsWith('Ignored.test.tsx'))).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('negative control: flags planted theme tokens and SVG paint, and allows currentColor', () => {
    const findings = scanKitSources([
      { file: 'a.tsx', text: "export const theme = {}\n" },
      { file: 'b.tsx', text: '<line stroke="#ff0000" />\n' },
      { file: 'c.tsx', text: '<line stroke="currentColor" fill="none" />\n' },
    ])
    expect(findings.map((f) => `${f.file}:${f.category}`).sort()).toEqual([
      'a.tsx:theme-token',
      'b.tsx:color-value',
      'b.tsx:svg-paint',
    ])
  })
})

const SceneA: FC<SceneProps> = () =>
  h(
    SceneLayer,
    null,
    h(Box, { key: 'box', id: 'box', x: 10, y: 20, w: 100, h: 40, label: 'Box label' }),
    h(Label, { key: 'label', id: 'label', x: 10, y: 70 }, 'Label text'),
    h(Frame, { key: 'frame', id: 'frame', x: 0, y: 0, w: 300, h: 200, label: 'Frame' }),
    h(Emphasis, { key: 'emph', id: 'emph', x: 120, y: 20, w: 40, h: 40 }),
    h(SymbolChip, { key: 'chip', id: 'chip', x: 200, y: 20, w: 30, h: 30, symbol: '?' }),
    h(Arrow, { key: 'arrow', id: 'arrow', from: [0, 0], to: [50, 50], twoWay: true, dashed: true }),
    h(Appear, { key: 'appear' }, h('span', null, 'new')),
  )

const steps: Step[] = [
  { id: 's1', era: 'One', title: 'First', caption: 'First caption', Scene: SceneA, payload: undefined },
  { id: 's2', era: 'Two', title: 'Second', caption: 'Second caption', Scene: SceneA, payload: undefined },
]

/** Inline styles the kit may set: geometry and motion/layout only, and never a class attribute. */
function visualViolations(root: Element): string[] {
  const out: string[] = []
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const tag = el.tagName.toLowerCase()
    if (el.hasAttribute('class')) out.push(`${tag} has class="${el.getAttribute('class')}"`)
    const style = (el as HTMLElement | SVGElement).style
    if (!style) continue
    for (const prop of Array.from(style)) {
      if (!ALLOWED_INLINE_STYLE.test(prop)) out.push(`${tag} inline ${prop}: ${style.getPropertyValue(prop)}`)
    }
  }
  return out
}

describe('unstyled rendering (L-11)', () => {
  it('primitives and chrome set no visual inline style and no class names', () => {
    const { container } = render(
      h(
        'div',
        null,
        h(
          SceneLayer,
          null,
          h(Box, { id: 'box', x: 1, y: 2, w: 3, h: 4, label: 'b' }),
          h(Label, { id: 'label', x: 1, y: 2 }, 'l'),
          h(Frame, { id: 'frame', x: 1, y: 2, w: 3, h: 4 }),
          h(Emphasis, { id: 'emph', x: 1, y: 2, w: 3, h: 4 }),
          h(SymbolChip, { id: 'chip', x: 1, y: 2, w: 3, h: 4, symbol: 'S' }),
          h(Arrow, { id: 'arrow', from: [0, 0], to: [10, 10] }),
          h(Appear, null, h('span', null, 'x')),
        ),
      ),
    )
    expect(visualViolations(container)).toEqual([])
    expect(container.querySelectorAll('[data-presentation-node]').length).toBeGreaterThanOrEqual(6)
  })

  it('a full Presentation sets no visual inline style and no class names', () => {
    const { container } = render(h(Presentation, { steps, title: 'Neutral deck', initialMode: 'browse' }))
    expect(container.querySelector('[data-presentation-root]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(visualViolations(container)).toEqual([])
  })

  it('the chrome in present mode is also style-neutral', () => {
    const { container } = render(h(Presentation, { steps, title: 'Neutral deck', initialMode: 'present' }))
    expect(container.querySelector('[data-presentation-mode="present"]')).not.toBeNull()
    expect(visualViolations(container)).toEqual([])
  })

  it('negative control: the DOM check flags a planted colour, font, border and class', () => {
    const { container } = render(
      h('div', { className: 'theme-dark', style: { color: 'red', fontFamily: 'serif', border: '1px solid', position: 'absolute' } }),
    )
    const violations = visualViolations(container)
    expect(violations.some((v) => v.includes('has class="theme-dark"'))).toBe(true)
    expect(violations.some((v) => v.includes('inline color'))).toBe(true)
    expect(violations.some((v) => v.includes('inline font-family'))).toBe(true)
    expect(violations.some((v) => v.includes('inline border'))).toBe(true)
    expect(violations.some((v) => v.includes('inline position'))).toBe(false)
  })

  it('allowlist accepts geometry and rejects visual properties', () => {
    for (const ok of ['position', 'left', 'top', 'width', 'height', 'transform', 'overflow', 'display', 'pointer-events', 'grid-template-columns', 'flex-direction']) {
      expect(ALLOWED_INLINE_STYLE.test(ok)).toBe(true)
    }
    for (const bad of ['color', 'background', 'background-color', 'font-family', 'border', 'box-shadow', 'border-radius', 'outline', '--brand', 'padding', 'margin']) {
      expect(ALLOWED_INLINE_STYLE.test(bad)).toBe(false)
    }
  })
})
