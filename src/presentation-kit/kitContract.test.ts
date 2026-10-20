import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import { Appear } from './nodes/Appear.tsx'
import { Arrow } from './nodes/Arrow.tsx'
import { Box } from './nodes/Box.tsx'
import { Emphasis } from './nodes/Emphasis.tsx'
import { Frame } from './nodes/Frame.tsx'
import { Label } from './nodes/Label.tsx'
import { SceneLayer } from './nodes/SceneLayer.tsx'
import { SymbolChip } from './nodes/SymbolChip.tsx'
import { makeSteps, type TestPayload } from './__fixtures__/testSteps.ts'

const here = path.dirname(new URL(import.meta.url).pathname)

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const full = path.join(dir, n)
    return statSync(full).isDirectory() ? files(full) : [full]
  })
}
const allKitFiles = files(here)
const sources = allKitFiles.filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.|__fixtures__/.test(f))
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Layout geometry only; opacity/transform are motion's own animation output. */
const ALLOWED_STYLE = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'transform', 'transform-origin',
  'scale', 'display', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction', 'align-items', 'justify-content', 'overflow', 'z-index',
  'pointer-events', 'white-space', 'text-overflow', 'opacity', 'will-change',
])
const FORBIDDEN_KEYS =
  /\b(color|backgroundColor|background|fontFamily|fontSize|fontWeight|border\w*|boxShadow|textShadow|filter|outline\w*|padding\w*|margin\w*|gap|letterSpacing|lineHeight|cursor|textDecoration\w*)\s*:/

describe('style ownership boundary', () => {
  it('ships no stylesheets, CSS imports, CSS-in-JS, or styling framework', () => {
    expect(allKitFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const f of sources) {
      const text = stripComments(readFileSync(f, 'utf8'))
      expect(text, f).not.toMatch(/import\s+['"][^'"]*\.(css|scss)['"]/)
      expect(text, f).not.toMatch(/tailwind|styled-components|@emotion|vanilla-extract|stylex|clsx|twMerge/i)
      expect(text, f).not.toMatch(/--[a-z][\w-]*\s*[:)]/)
      expect(text, f).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i)
    }
  })

  it('sets no visual properties in any inline style object', () => {
    for (const f of sources) {
      expect(stripComments(readFileSync(f, 'utf8')), f).not.toMatch(FORBIDDEN_KEYS)
    }
  })

  it('does not require a styling framework in the manifest', () => {
    const pkg = JSON.parse(readFileSync(path.join(here, '../../package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|styled|emotion|sass|less/i.test(d))).toEqual([])
  })

  it('renders every primitive and chrome piece with geometry-only inline styles and no fallback look', () => {
    const { container } = render(
      createElement(
        'div',
        null,
        createElement(Presentation<TestPayload>, { steps: makeSteps(), title: 'Deck', brand: createElement('b', null, 'x') }),
        createElement(
          SceneLayer,
          null,
          createElement(Box, { layoutId: 'b', key: 'b' }),
          createElement(Label, { layoutId: 'l', key: 'l' }),
          createElement(SymbolChip, { layoutId: 'c', symbol: 's', key: 'c' }),
          createElement(Frame, { layoutId: 'f', x: 1, y: 1, width: 5, height: 5, key: 'f' }),
          createElement(Emphasis, { layoutId: 'e', x: 1, y: 1, width: 5, height: 5, key: 'e' }),
          createElement(Arrow, { layoutId: 'a', from: { x: 0, y: 0 }, to: { x: 5, y: 5 }, key: 'a' }),
          createElement(Appear, { key: 'p' }),
        ),
      ),
    )
    const used = new Set<string>()
    for (const el of container.querySelectorAll<HTMLElement | SVGElement>('*')) {
      for (const prop of Array.from(el.style)) used.add(prop)
      for (const attr of ['fill', 'stroke', 'color', 'font-family', 'stroke-width']) {
        expect(el.hasAttribute(attr), `${el.tagName} ${attr}`).toBe(false)
      }
    }
    expect([...used].filter((p) => !ALLOWED_STYLE.has(p))).toEqual([])
    expect(container.querySelector('style')).toBeNull()
  })
})
