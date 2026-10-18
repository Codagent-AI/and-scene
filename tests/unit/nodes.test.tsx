// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { Star } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'

afterEach(cleanup)

describe('kit primitives expose stable hooks and forward author props', () => {
  it('forwards class, style and data attributes to the node element', () => {
    const { container } = render(
      <SceneLayer>
        <Box layoutId="b" className="mine" style={{ opacity: 1 }} data-x="1" x={5} y={6} width={7} height={8} />
        <Frame layoutId="f" className="mine" data-x="1" label="L" />
        <Emphasis layoutId="e" className="mine" data-x="1" />
        <SymbolChip layoutId="c" className="mine" data-x="1" />
        <Label layoutId="l" className="mine" data-x="1">
          text
        </Label>
      </SceneLayer>,
    )
    const kinds: Record<string, string> = { b: 'box', f: 'frame', e: 'emphasis', c: 'symbol-chip', l: 'label' }
    for (const [id, kind] of Object.entries(kinds)) {
      const el = container.querySelector(`[data-presentation-id="${id}"]`) as HTMLElement
      expect(el.getAttribute('data-presentation-node')).toBe(kind)
      expect(el.className).toContain('mine')
      expect(el.getAttribute('data-x')).toBe('1')
    }
    const box = container.querySelector('[data-presentation-id="b"]') as HTMLElement
    expect(box.style.left).toBe('5px')
    expect(box.style.top).toBe('6px')
    expect(box.style.width).toBe('7px')
    expect(box.style.position).toBe('absolute')
    expect(container.querySelector('[data-presentation-frame-label]')?.textContent).toBe('L')
  })

  it('Arrow positions and rotates itself and exposes line/head hooks for local CSS', () => {
    const { container } = render(
      <SceneLayer>
        <Arrow id="a" bidirectional from={{ x: 10, y: 10 }} to={{ x: 10, y: 110 }} className="mine" />
      </SceneLayer>,
    )
    const arrow = container.querySelector('[data-presentation-id="a"]') as HTMLElement
    expect(arrow.getAttribute('data-presentation-node')).toBe('arrow')
    expect(arrow.getAttribute('data-presentation-arrow-direction')).toBe('both')
    expect(arrow.style.width).toBe('100px')
    expect(arrow.style.transform).toContain('rotate(90deg)')
    expect(arrow.className).toContain('mine')
    expect(arrow.querySelector('[data-presentation-arrow-line]')).not.toBeNull()
    expect(arrow.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
  })

  it('renders an optional Lucide icon component, and nothing when omitted', () => {
    const { container } = render(
      <SceneLayer>
        <Box layoutId="with" Icon={Star}>
          x
        </Box>
        <Box layoutId="without">y</Box>
        <SymbolChip layoutId="chip" Icon={Star} />
      </SceneLayer>,
    )
    expect(container.querySelector('[data-presentation-id="with"] svg[data-presentation-icon]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-id="without"] svg')).toBeNull()
    expect(container.querySelector('[data-presentation-id="chip"] svg')).not.toBeNull()
  })

  it('SceneLayer is an absolute, canvas-filling layer and Appear fills it without moving children', () => {
    const { container } = render(
      <div>
        <SceneLayer data-testid="one" className="layer" />
        <SceneLayer>
          <Appear>
            <Box layoutId="inside" x={30} y={40} />
          </Appear>
        </SceneLayer>
      </div>,
    )
    const layers = container.querySelectorAll<HTMLElement>('[data-presentation-scene-layer]')
    for (const layer of layers) {
      expect(layer.style.position).toBe('absolute')
      expect(layer.style.width).toBe('100%')
      expect(layer.style.height).toBe('100%')
    }
    expect(layers[0].className).toBe('layer')
    const wrapper = container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.position).toBe('absolute')
    expect((wrapper.querySelector('[data-presentation-id="inside"]') as HTMLElement).style.left).toBe('30px')
  })
})
