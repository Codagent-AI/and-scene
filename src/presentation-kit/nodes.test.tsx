import { cleanup, render, waitFor } from '@testing-library/react'
import { Box as BoxIcon } from 'lucide-react'
import { afterEach, describe, expect, it } from 'vitest'
import { Appear } from './nodes/Appear.tsx'
import { Arrow } from './nodes/Arrow.tsx'
import { Box } from './nodes/Box.tsx'
import { Emphasis } from './nodes/Emphasis.tsx'
import { Frame } from './nodes/Frame.tsx'
import { Label } from './nodes/Label.tsx'
import { SceneLayer } from './nodes/SceneLayer.tsx'
import { SymbolChip } from './nodes/SymbolChip.tsx'
import { ENTER_DELAY, LAYOUT_T } from './constants.ts'

afterEach(cleanup)

describe('node primitives', () => {
  it.each([
    ['box', Box],
    ['label', Label],
    ['frame', Frame],
    ['emphasis', Emphasis],
    ['symbol-chip', SymbolChip],
  ] as const)('%s exposes identity hooks and passes class, data and style through', (kind, Node) => {
    const { container } = render(
      <Node id="e1" className="mine" data-extra="1" style={{ opacity: 0.5 }} at={{ x: 10, y: 20, w: 30, h: 40 }}>
        text
      </Node>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
    expect(el.getAttribute('data-presentation-id')).toBe('e1')
    expect(el.className).toBe('mine')
    expect(el.getAttribute('data-extra')).toBe('1')
    expect(el.style.position).toBe('absolute')
    expect([el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['10px', '20px', '30px', '40px'])
    expect(el.style.opacity).toBe('0.5')
  })

  it('renders without placement as unpositioned content', () => {
    const { container } = render(<Label id="plain">x</Label>)
    expect((container.firstElementChild as HTMLElement).style.position).toBe('')
  })

  it('renders a Lucide icon passed as a component, and works without one', () => {
    const withIcon = render(<Box id="a" Icon={BoxIcon} label="L" />)
    expect(withIcon.container.querySelector('svg[data-presentation-glyph]')).not.toBeNull()
    expect(withIcon.container.querySelector('[data-presentation-box-label]')!.textContent).toBe('L')
    cleanup()
    const without = render(<Box id="a" />)
    expect(without.container.querySelector('svg')).toBeNull()
  })

  it('exposes semantic state on chips', () => {
    const { container } = render(<SymbolChip id="c" state="pass" />)
    expect(container.firstElementChild!.getAttribute('data-presentation-state')).toBe('pass')
  })

  it('draws arrows with heads at the requested ends and no baked-in colours', () => {
    const one = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 50, y: 0 }} />)
    expect(one.container.querySelectorAll('polygon')).toHaveLength(1)
    cleanup()
    const two = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 50, y: 0 }} bidirectional bend={20} className="k" />)
    expect(two.container.querySelectorAll('polygon')).toHaveLength(2)
    expect(two.container.querySelector('path')!.getAttribute('d')).toContain('Q')
    expect(two.container.firstElementChild!.getAttribute('class')).toBe('k')
    expect(two.container.firstElementChild!.getAttribute('data-presentation-id')).toBe('a')
  })

  it('positions scene layers absolutely so one layer cannot reflow another', () => {
    const { container } = render(
      <>
        <SceneLayer data-n="1" />
        <SceneLayer data-n="2" />
      </>,
    )
    for (const layer of container.querySelectorAll<HTMLElement>('[data-presentation-layer]')) {
      expect(layer.style.position).toBe('absolute')
    }
  })

  it('delays newcomers until after the layout transition completes', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const { container } = render(<Appear>child</Appear>)
    expect(container.querySelector('[data-presentation-appear]')).not.toBeNull()
  })
})

describe('Appear', () => {
  it('fades in newcomers only; an entity that persists is not re-animated when others arrive', async () => {
    const scene = (ids: string[]) => (
      <SceneLayer>
        {ids.map((id) => (
          <Appear key={id}>
            <Box id={id} />
          </Appear>
        ))}
      </SceneLayer>
    )
    const opacityOf = (id: string) =>
      Number(document.querySelector(`[data-presentation-id="${id}"]`)!.closest<HTMLElement>('[data-presentation-appear]')!.style.opacity)
    const view = render(scene(['a']))
    await waitFor(() => expect(opacityOf('a')).toBe(1), { timeout: 4000 })
    view.rerender(scene(['a', 'b']))
    expect(opacityOf('b')).toBeLessThan(1)
    expect(opacityOf('a')).toBe(1)
  })
})
