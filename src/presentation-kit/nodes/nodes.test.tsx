import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { Box } from './Box'
import { Label } from './Label'
import { Arrow } from './Arrow'
import { Frame } from './Frame'
import { Emphasis } from './Emphasis'
import { SymbolChip } from './SymbolChip'
import { Appear } from './Appear'
import { SceneLayer } from './SceneLayer'

describe('scene kit node primitives', () => {
  it('render without any inline color, font, border, or shadow defaults', () => {
    const { container } = render(
      <div>
        <Box layoutId="box-1" Icon={Sparkles}>
          topic
        </Box>
        <Label layoutId="label-1">caption</Label>
        <Arrow layoutId="arrow-1" />
        <Frame layoutId="frame-1">grouped</Frame>
        <Emphasis layoutId="emph-1" active>
          focus
        </Emphasis>
        <SymbolChip layoutId="chip-1" Icon={Sparkles} label="chip" />
      </div>,
    )

    for (const el of container.querySelectorAll('[data-scene-kit]')) {
      const style = (el as HTMLElement).style
      expect(style.color).toBe('')
      expect(style.backgroundColor).toBe('')
      expect(style.border).toBe('')
      expect(style.boxShadow).toBe('')
      expect(style.fontFamily).toBe('')
    }
  })

  it('exposes stable data-scene-kit hooks for presentation-owned CSS', () => {
    const { container } = render(<Box layoutId="box-1">hi</Box>)
    expect(container.querySelector('[data-scene-kit="box"]')).not.toBeNull()
  })

  it('Emphasis exposes semantic active state', () => {
    const { container, rerender } = render(
      <Emphasis layoutId="e" active>
        x
      </Emphasis>,
    )
    expect(container.querySelector('[data-active="true"]')).not.toBeNull()

    rerender(
      <Emphasis layoutId="e" active={false}>
        x
      </Emphasis>,
    )
    expect(container.querySelector('[data-active="false"]')).not.toBeNull()
  })

  it('Appear and SceneLayer expose stable hooks and accept author classNames', () => {
    const { container } = render(
      <SceneLayer className="talk-layer">
        <Appear className="talk-appear">newcomer</Appear>
      </SceneLayer>,
    )
    const layer = container.querySelector('[data-scene-kit="scene-layer"]')
    expect(layer).not.toBeNull()
    expect(layer).toHaveClass('talk-layer')
    const appear = container.querySelector('[data-scene-kit="appear"]')
    expect(appear).toHaveClass('talk-appear')
  })
})
