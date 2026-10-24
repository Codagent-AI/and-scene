import { act, render, waitFor } from '@testing-library/react'
import { Box as BoxIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, LAYOUT_T } from '../constants'
import { Appear } from './Appear'
import { Arrow } from './Arrow'
import { Box } from './Box'
import { Emphasis } from './Emphasis'
import { Frame } from './Frame'
import { Label } from './Label'
import { SceneLayer } from './SceneLayer'
import { SymbolChip } from './SymbolChip'

const pos = { x: 10, y: 20, w: 30, h: 40 }

describe('node primitives', () => {
  const cases: [string, React.ReactElement][] = [
    ['box', <Box id="e" {...pos} className="mine" style={{ opacity: 0.9 }} />],
    ['label', <Label id="e" {...pos} className="mine" style={{ opacity: 0.9 }} />],
    ['chip', <SymbolChip id="e" {...pos} className="mine" style={{ opacity: 0.9 }} />],
    ['frame', <Frame id="e" {...pos} className="mine" style={{ opacity: 0.9 }} />],
    ['emphasis', <Emphasis id="e" {...pos} className="mine" style={{ opacity: 0.9 }} />],
  ]

  it.each(cases)('%s exposes stable hooks and passes class/style through', (kind, el) => {
    const { container } = render(el)
    const node = container.querySelector(`[data-presentation-node="${kind}"]`) as HTMLElement
    expect(node).not.toBeNull()
    expect(node.getAttribute('data-presentation-id')).toBe('e')
    expect(node.classList.contains('mine')).toBe(true)
    expect(node.style.left).toBe('10px')
    expect(node.style.top).toBe('20px')
    expect(node.style.width).toBe('30px')
    expect(node.style.height).toBe('40px')
    expect(node.style.opacity).toBe('0.9')
  })

  it('arrow exposes hooks and strokes with currentColor only', () => {
    const { container } = render(
      <Arrow id="a" from={[0, 0]} to={[10, 10]} width={100} height={50} className="mine" />,
    )
    const svg = container.querySelector('[data-presentation-node="arrow"]')!
    expect(svg.getAttribute('data-presentation-id')).toBe('a')
    expect(svg.classList.contains('mine')).toBe(true)
    expect(container.querySelector('[data-presentation-arrow-path]')!.getAttribute('stroke')).toBe('currentColor')
  })

  it('box renders an optional icon glyph and variant hook', () => {
    const { container } = render(<Box id="e" {...pos} Icon={BoxIcon} variant="ghost" />)
    expect(container.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-variant="ghost"]')).not.toBeNull()
  })

  it('persisting entities carry their id as layoutId-driven identity', () => {
    const { container, rerender } = render(<Box id="same" x={0} y={0} />)
    const before = container.querySelector('[data-presentation-id="same"]')
    rerender(<Box id="same" x={200} y={100} />)
    const after = container.querySelector('[data-presentation-id="same"]') as HTMLElement
    expect(after).toBe(before)
    expect(after.style.left).toBe('200px')
  })
})

describe('Appear and SceneLayer', () => {
  it('delays newcomers until persisting entities have moved', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('fades a newcomer in from transparent', () => {
    const tree = (show: boolean) => (
      <SceneLayer>
        {show && (
          <Appear key="n">
            <Box id="n" x={0} y={0} />
          </Appear>
        )}
      </SceneLayer>
    )
    const { container, rerender } = render(tree(false))
    rerender(tree(true))
    const wrapper = container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).toBe('0')
  })

  it('keeps a departing entity mounted while it animates out, then removes it', async () => {
    const tree = (show: boolean) => (
      <SceneLayer>
        {show && (
          <Appear key="n">
            <Box id="gone" x={0} y={0} />
          </Appear>
        )}
      </SceneLayer>
    )
    const { container, rerender } = render(tree(true))
    expect(container.querySelector('[data-presentation-id="gone"]')).not.toBeNull()
    await act(async () => {
      rerender(tree(false))
    })
    // Still present immediately after removal: the exit animation is pending.
    expect(container.querySelector('[data-presentation-id="gone"]')).not.toBeNull()
    await waitFor(() => expect(container.querySelector('[data-presentation-id="gone"]')).toBeNull(), {
      timeout: 3000,
    })
  })

  it('absolutely positions the layer so it never reflows siblings', () => {
    const { container } = render(<SceneLayer>{null}</SceneLayer>)
    const layer = container.querySelector('[data-presentation-layer]') as HTMLElement
    expect(layer.style.position).toBe('absolute')
  })
})
