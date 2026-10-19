// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { ENTER_DELAY, LAYOUT_T } from '../../src/presentation-kit/constants.ts'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit/index.ts'

vi.mock('motion/react', async () => await import('../helpers/motionMock.tsx'))

const attr = (el: Element, name: string) => JSON.parse(el.getAttribute(name) ?? 'null')

const nodes = [
  ['box', (p: object) => <Box layoutId="e:box" x={1} y={2} w={30} h={40} {...p}>text</Box>],
  ['label', (p: object) => <Label layoutId="e:label" x={1} y={2} w={30} h={40} {...p}>text</Label>],
  ['chip', (p: object) => <SymbolChip layoutId="e:chip" x={1} y={2} w={30} h={40} {...p}>text</SymbolChip>],
  ['frame', (p: object) => <Frame layoutId="e:frame" x={1} y={2} w={30} h={40} {...p}>text</Frame>],
] as const

describe.each(nodes)('%s primitive', (kind, make) => {
  it('exposes stable hooks, forwards class/style/data, and carries its layoutId for morphs', () => {
    const { container } = render(make({ className: 'mine', style: { zIndex: 3 }, 'data-custom': 'yes' }))
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
    expect(el.getAttribute('data-presentation-entity')).toBe(`e:${kind}`)
    expect(el.getAttribute('data-m-layout-id')).toBe(`e:${kind}`)
    expect(el.getAttribute('data-m-layout')).toBe('true')
    expect(el.className).toBe('mine')
    expect(el.getAttribute('data-custom')).toBe('yes')
    expect(el.style.zIndex).toBe('3')
  })

  it('places itself with absolute canvas geometry and nothing visual', () => {
    const { container } = render(make({}))
    const el = container.firstElementChild as HTMLElement
    expect(el.style.position).toBe('absolute')
    expect([el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['1px', '2px', '30px', '40px'])
    expect(el.style.color + el.style.background + el.style.border + el.style.boxShadow + el.style.fontFamily).toBe('')
  })

  it('morphs with a layout transition and fades out when it leaves', () => {
    const { container } = render(make({}))
    const el = container.firstElementChild as HTMLElement
    expect(attr(el, 'data-m-transition').layout.duration).toBe(LAYOUT_T)
    expect(attr(el, 'data-m-exit').opacity).toBe(0)
    expect(attr(el, 'data-m-exit').transition.duration).toBeGreaterThan(0)
    expect(el.getAttribute('data-m-initial')).toBeNull()
  })
})

describe('Box', () => {
  it('renders an optional Lucide icon component and the emphasis hook', () => {
    const { container } = render(<Box layoutId="b" x={0} y={0} Icon={Star} emphasis>hi</Box>)
    expect(container.querySelector('svg[data-presentation-icon]')).not.toBeNull()
    expect(container.firstElementChild?.getAttribute('data-presentation-emphasis')).toBe('true')
  })

  it('has no icon or emphasis hook by default', () => {
    const { container } = render(<Box layoutId="b" x={0} y={0}>hi</Box>)
    expect(container.querySelector('svg')).toBeNull()
    expect(container.firstElementChild?.hasAttribute('data-presentation-emphasis')).toBe(false)
  })
})

describe('Frame', () => {
  it('renders its label with a stable hook', () => {
    const { container } = render(<Frame layoutId="f" x={0} y={0} w={5} h={5} label="frame label" />)
    expect(container.querySelector('[data-presentation-frame-label]')?.textContent).toBe('frame label')
  })
})

describe('Emphasis forwarding', () => {
  it('forwards class and data attributes', () => {
    const { container } = render(<Emphasis className="mine" data-custom="yes">x</Emphasis>)
    expect(container.firstElementChild?.getAttribute('class')).toBe('mine')
    expect(container.firstElementChild?.getAttribute('data-custom')).toBe('yes')
  })
})

describe('Emphasis', () => {
  it('marks content active or inactive through a hook only', () => {
    render(<><Emphasis>on</Emphasis><Emphasis active={false}>off</Emphasis></>)
    expect(screen.getByText('on').getAttribute('data-presentation-emphasis')).toBe('true')
    expect(screen.getByText('off').getAttribute('data-presentation-emphasis')).toBe('false')
    expect(screen.getByText('on').getAttribute('style')).toBeNull()
  })
})

describe('Arrow', () => {
  it('draws a line and one head, or two for a bidirectional arrow, in the inherited color', () => {
    const one = render(<Arrow layoutId="a" from={[0, 0]} to={[10, 0]} />).container
    expect(one.querySelectorAll('polygon')).toHaveLength(1)
    const two = render(<Arrow layoutId="a2" from={[0, 0]} to={[10, 0]} bidirectional />).container
    expect(two.querySelectorAll('polygon')).toHaveLength(2)
    for (const el of [...one.querySelectorAll('path,polygon')]) {
      expect(['currentColor', 'none']).toContain(el.getAttribute('fill') ?? el.getAttribute('stroke'))
    }
    expect(one.querySelector('svg')?.getAttribute('data-presentation-entity')).toBe('a')
  })

  it('carries its identity and forwards class, style and data to the svg', () => {
    const { container } = render(<Arrow layoutId="a" from={[0, 0]} to={[10, 0]} className="mine" style={{ zIndex: 4 }} data-custom="yes" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('data-m-layout-id')).toBe('a')
    expect(svg.getAttribute('class')).toBe('mine')
    expect(svg.style.zIndex).toBe('4')
    expect(svg.style.position).toBe('absolute')
    expect(svg.getAttribute('data-custom')).toBe('yes')
    expect(attr(svg, 'data-m-exit').opacity).toBe(0)
  })

  it('animates its path and heads to new endpoints instead of snapping', () => {
    const view = (to: [number, number]) => <Arrow layoutId="a" from={[0, 0]} to={to} bidirectional />
    const { container, rerender } = render(view([10, 0]))
    const read = () => ({
      d: attr(container.querySelector('path')!, 'data-m-animate').d,
      heads: [...container.querySelectorAll('polygon')].map((p) => attr(p, 'data-m-animate').points),
      t: attr(container.querySelector('path')!, 'data-m-transition').duration,
    })
    const before = read()
    rerender(view([200, 50]))
    const after = read()
    expect(after.d).not.toBe(before.d)
    expect(after.heads[0]).not.toBe(before.heads[0])
    expect(after.heads).toHaveLength(2)
    expect(after.t).toBe(LAYOUT_T)
    expect(container.querySelector('path')?.getAttribute('data-m-initial')).toBe('false')
  })

  it('draws an arc through a control point', () => {
    const { container } = render(<Arrow layoutId="a" from={[0, 0]} to={[10, 10]} via={[10, 0]} />)
    expect(attr(container.querySelector('path')!, 'data-m-animate').d).toContain('Q10,0')
  })
})

describe('Appear', () => {
  it('fades a newcomer in only after the layout morph duration', () => {
    const { container } = render(<Appear enter>child</Appear>)
    const el = container.firstElementChild as HTMLElement
    expect(attr(el, 'data-m-initial')).toEqual({ opacity: 0 })
    const anim = attr(el, 'data-m-animate')
    expect(anim.opacity).toBe(1)
    expect(anim.transition.duration).toBeGreaterThan(0)
    expect(anim.transition.delay).toBe(ENTER_DELAY)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(el.getAttribute('data-presentation-appear')).toBe('enter')
  })

  it('does not fade a continuing entity in', () => {
    const { container } = render(<Appear>child</Appear>)
    const el = container.firstElementChild as HTMLElement
    expect(attr(el, 'data-m-initial')).toBe(false)
    expect(el.getAttribute('data-presentation-appear')).toBe('stay')
  })

  it('fades out on exit', () => {
    const { container } = render(<Appear>child</Appear>)
    expect(attr(container.firstElementChild as Element, 'data-m-exit').opacity).toBe(0)
  })
})

describe('SceneLayer forwarding', () => {
  it('forwards class and data attributes and merges style over the absolute layer', () => {
    const { container } = render(<SceneLayer className="mine" data-custom="yes" style={{ zIndex: 2 }}>x</SceneLayer>)
    const el = container.firstElementChild as HTMLElement
    expect([el.className, el.getAttribute('data-custom'), el.style.zIndex, el.style.position]).toEqual(['mine', 'yes', '2', 'absolute'])
  })
})

describe('SceneLayer', () => {
  it('is an absolute layer so mounting one never reflows another', () => {
    const { container } = render(<><SceneLayer>a</SceneLayer><SceneLayer>b</SceneLayer></>)
    for (const layer of container.querySelectorAll('[data-presentation-layer]')) {
      const s = (layer as HTMLElement).style
      expect(s.position).toBe('absolute')
      expect(s.inset).toBe('0px')
    }
  })

  it('keeps overlapping child coordinates unchanged when another layer mounts', () => {
    const view = (extra: boolean) => (
      <>
        <SceneLayer>
          <Box layoutId="a" x={10} y={10} w={100} h={50} style={{ zIndex: 1 }} />
          <Box layoutId="b" x={60} y={30} w={100} h={50} style={{ zIndex: 2 }} />
        </SceneLayer>
        {extra ? <SceneLayer><Box layoutId="c" x={0} y={0} /></SceneLayer> : null}
      </>
    )
    const { container, rerender } = render(view(false))
    const read = () => [...container.querySelectorAll<HTMLElement>('[data-presentation-entity]')].slice(0, 2).map((e) => [e.style.left, e.style.top, e.style.zIndex])
    const before = read()
    rerender(view(true))
    expect(read()).toEqual(before)
    expect(before).toEqual([['10px', '10px', '1'], ['60px', '30px', '2']])
  })

  it('supports raw motion elements with stable layoutIds next to primitives', async () => {
    const { motion } = await import('motion/react')
    const view = (x: number) => (
      <SceneLayer>
        <Box layoutId="p" x={0} y={0} />
        <motion.div layoutId="raw" layout style={{ position: 'absolute', left: x, top: 5 }} data-testid="raw" />
      </SceneLayer>
    )
    const { rerender } = render(view(10))
    const raw = () => screen.getByTestId('raw')
    expect(raw().getAttribute('data-m-layout-id')).toBe('raw')
    expect(raw().style.left).toBe('10px')
    rerender(view(300))
    expect(raw().getAttribute('data-m-layout-id')).toBe('raw')
    expect(raw().style.left).toBe('300px')
  })
})
