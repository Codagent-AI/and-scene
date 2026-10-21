import { render } from '@testing-library/react'
import { Bird } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SymbolChip } from './index'
import type { SceneProps } from './types'

/** Layout and motion plumbing the kit may set; nothing here is a visual treatment. */
const LAYOUT_PROPS = new Set([
  'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'display', 'flex-direction',
  'justify-content', 'align-items', 'overflow', 'pointer-events', 'transform', 'white-space',
  'text-overflow', 'opacity',
])

function Scene(_props: SceneProps<undefined>) {
  return (
    <>
      <Appear>
        <Box id="b" at={{ x: 0, y: 0, w: 10, h: 10 }} Icon={Bird}>box</Box>
        <Label id="l">label</Label>
        <Frame id="f" label="frame" />
        <Emphasis id="e" />
        <SymbolChip id="c" Icon={Bird}>chip</SymbolChip>
        <Arrow id="a" from={[0, 0]} to={[20, 20]} bidirectional />
      </Appear>
    </>
  )
}

describe('style ownership', () => {
  it('renders every primitive and chrome part without visual inline styles or classes', () => {
    render(
      <Presentation
        steps={[{ id: 's', era: 'e', title: 't', caption: 'c', Scene, payload: undefined }]}
        title="x"
      />,
    )
    const elements = [...document.querySelectorAll<HTMLElement>('[data-presentation-root], [data-presentation-root] *')]
    expect(elements.length).toBeGreaterThan(20)
    for (const el of elements) {
      // Lucide's own icon markup carries library classes; the kit adds none.
      if (!(el instanceof SVGElement)) expect(el.getAttribute('class'), el.outerHTML).toBeNull()
      for (const prop of Array.from(el.style)) {
        expect(LAYOUT_PROPS.has(prop), `${el.tagName} sets visual style "${prop}"`).toBe(true)
      }
    }
  })

  it('leaves SVG strokes and fills to inherited currentColor', () => {
    const { container } = render(<Arrow id="a" from={[0, 0]} to={[5, 5]} />)
    for (const shape of container.querySelectorAll('path')) {
      const paint = shape.getAttribute('stroke') ?? shape.getAttribute('fill')
      expect([paint, 'none']).toContain(paint === 'none' ? 'none' : 'currentColor')
    }
  })
})
