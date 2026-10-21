// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { render } from '@testing-library/react'
import { Check, Layers } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import { Appear } from '../nodes/Appear'
import { Arrow } from '../nodes/Arrow'
import { Box } from '../nodes/Box'
import { Emphasis } from '../nodes/Emphasis'
import { Frame } from '../nodes/Frame'
import { Label } from '../nodes/Label'
import { SceneLayer } from '../nodes/SceneLayer'
import { SymbolChip } from '../nodes/SymbolChip'
import { makeSteps, setViewport } from './fixtures'

const KIT = join(__dirname, '..')

function sources(dir = KIT): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === '__tests__') return []
    return statSync(path).isDirectory() ? sources(path) : [path]
  })
}

const files = sources().map((path) => ({ name: relative(KIT, path), text: readFileSync(path, 'utf8') }))

describe('kit sources are style neutral', () => {
  it('has kit sources to scan', () => {
    expect(files.length).toBeGreaterThan(15)
    expect(files.every((f) => /\.(ts|tsx)$/.test(f.name))).toBe(true)
  })

  it('imports no stylesheet and ships no CSS file, class names, or theme tokens', () => {
    for (const { name, text } of files) {
      expect(text, name).not.toMatch(/import\s+['"][^'"]+\.(css|scss|sass|less)['"]/)
      expect(text, name).not.toMatch(/\bclassName\s*=\s*["'{`]/)
      expect(text, name).not.toMatch(/--[a-z][\w-]*\s*:/)
      expect(text, name).not.toMatch(/<style\b|\bstyled\.\w+\s*[`(]|\bstyled\(|@apply/)
    }
  })

  it('mentions no styling framework', () => {
    for (const { name, text } of files) expect(text, name).not.toMatch(/tailwind|styled-components|emotion/i)
  })

  it('contains no color or font literals', () => {
    for (const { name, text } of files) {
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(code, name).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(code, name).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/)
      expect(code, name).not.toMatch(/font-?[fF]amily|fontSize|fontWeight/)
    }
  })

  it('sets only geometry and behavior in inline style objects', () => {
    const forbidden = /\b(color|background\w*|border\w*|boxShadow|padding\w*|margin\w*|gap|fontFamily|fontSize|fontWeight|filter|outline)\s*:/
    for (const { name, text } of files) {
      for (const match of text.matchAll(/style=\{\{([\s\S]*?)\}\}/g)) expect(match[1], name).not.toMatch(forbidden)
    }
  })

  it('has no presentation-specific vocabulary or imports from presentations', () => {
    for (const { name, text } of files) {
      expect(text, name).not.toMatch(/from ['"]\.\.\/(\.\.\/)?presentations/)
      expect(text, name).not.toMatch(/how-to-make|you-skill|scene-kit/i)
    }
  })
})

const GEOMETRY = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'transform', 'transform-origin',
  'overflow', 'z-index', 'display', 'flex-direction', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-items', 'justify-content',
  'white-space', 'text-overflow', 'pointer-events', 'opacity', 'will-change', 'min-width',
])

describe('rendered kit output carries no visual defaults', () => {
  it('only sets geometry/behavior properties and no presentational attributes', () => {
    setViewport(1440, 900)
    const { container } = render(
      <>
        <Presentation steps={makeSteps(4, ['a', 'a', 'b', 'b'])} title="Deck" brand={null} />
        <SceneLayer>
          <Box entity="b" Icon={Layers}>box</Box>
          <Label entity="l">l</Label>
          <Frame entity="f" />
          <Emphasis entity="e" />
          <SymbolChip entity="s" Icon={Check} />
          <Appear>a</Appear>
          <Arrow entity="a" from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} bidirectional />
        </SceneLayer>
      </>,
    )
    const elements = Array.from(container.querySelectorAll<HTMLElement>('*'))
    expect(elements.length).toBeGreaterThan(30)
    for (const el of elements) {
      for (let i = 0; i < el.style.length; i++) {
        const prop = el.style.item(i)
        expect(GEOMETRY.has(prop), `${el.tagName} style ${prop}`).toBe(true)
      }
      // Lucide stamps its own class on icons; the kit adds none of its own.
      if (!el.hasAttribute('data-presentation-icon')) {
        expect(el.getAttribute('class') ?? '', `${el.tagName} class`).toBe('')
      }
      for (const attr of ['fill', 'stroke']) {
        const value = el.getAttribute(attr)
        if (value !== null) expect(['currentColor', 'none']).toContain(value)
      }
    }
  })
})
