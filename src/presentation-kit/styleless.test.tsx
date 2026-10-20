// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { key, setViewport } from '../../tests/helpers/events.ts'
import { makeSteps } from '../../tests/helpers/fixtures.tsx'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip } from './index.ts'
import type { Step } from './types.ts'

// Layout and geometry only: no color, font, border, shadow, background, padding, margin, gap or list styling.
const GEOMETRY = new Set([
  'position', 'inset', 'top', 'left', 'right', 'bottom', 'width', 'height', 'transform', 'transform-origin',
  'display', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction', 'align-items', 'justify-content', 'overflow', 'pointer-events',
  'z-index', 'opacity', 'will-change',
])

function offenders(root: ParentNode): string[] {
  const found: string[] = []
  root.querySelectorAll<HTMLElement | SVGElement>('[style]').forEach((el) => {
    for (const name of Array.from(el.style)) if (!GEOMETRY.has(name)) found.push(`${el.tagName.toLowerCase()} ${name}`)
  })
  return found
}

function Everything() {
  return (
    <SceneLayer>
      <Appear delay={0}>
        <Box id="box" icon={Star}>box</Box>
        <Label id="label">label</Label>
        <Frame id="frame" />
        <Emphasis id="emphasis" />
        <SymbolChip id="chip">chip</SymbolChip>
        <Arrow id="arrow" twoWay from={{ x: 0, y: 0 }} to={{ x: 50, y: 50 }} />
      </Appear>
    </SceneLayer>
  )
}

const steps: Step[] = makeSteps(3).map((s) => ({ ...s, Scene: Everything, payload: undefined }))

describe('the kit renders without visual defaults', () => {
  it.each(['browse', 'present'] as const)('uses only geometry-class inline styles in %s mode, with all chrome and primitives', (mode) => {
    setViewport(1440, 900)
    const { container } = render(<Presentation steps={steps} title="Deck" initialMode={mode} />)
    expect(container.querySelectorAll('[data-presentation-entity]').length).toBeGreaterThanOrEqual(6)
    expect(offenders(container)).toEqual([])
    key(document.body, 'ArrowRight')
    expect(offenders(container)).toEqual([])
  })

  it('emits no class names, style elements or stylesheet links of its own', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(container.querySelectorAll('[class]:not([data-presentation-entity]):not([data-presentation-icon])')).toHaveLength(0)
    expect(document.querySelectorAll('style, link[rel="stylesheet"]')).toHaveLength(0)
  })

  it('does not set presentation attributes that carry color', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    for (const attr of ['fill', 'color', 'bgcolor']) {
      expect(container.querySelectorAll(`[${attr}]:not([fill="currentColor"]):not([data-presentation-icon])`)).toHaveLength(0)
    }
  })
})
