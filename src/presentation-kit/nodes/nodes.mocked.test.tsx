import { render } from '@testing-library/react'
import { Bird } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from '../constants'
import { Appear } from './Appear'
import { Arrow } from './Arrow'
import { Box } from './Box'
import { Emphasis } from './Emphasis'
import { Frame } from './Frame'
import { Label } from './Label'
import { SceneLayer } from './SceneLayer'
import { SymbolChip } from './SymbolChip'
import { LAYOUT_TRANSITION } from './geometry'
import { motion } from 'motion/react'
import { motionOf } from '../../../tests/motionMock'

vi.mock('motion/react', async () => await import('../../../tests/motionMock'))

const find = (container: HTMLElement, id: string) => container.querySelector(`[data-presentation-id="${id}"]`) as HTMLElement

describe('generic primitives', () => {
  const cases: Array<[string, (props: object) => React.ReactElement, string]> = [
    ['Box', (p) => <Box id="e" {...p} />, 'box'],
    ['Label', (p) => <Label id="e" {...p} />, 'label'],
    ['Frame', (p) => <Frame id="e" {...p} />, 'frame'],
    ['Emphasis', (p) => <Emphasis id="e" {...p} />, 'emphasis'],
    ['SymbolChip', (p) => <SymbolChip id="e" {...p} />, 'chip'],
    ['Arrow', (p) => <Arrow id="e" from={[0, 0]} to={[10, 10]} {...p} />, 'arrow'],
  ]

  it.each(cases)('%s carries a stable identity as layoutId with layout motion and hooks', (_name, make, kind) => {
    const { container } = render(make({}))
    const el = find(container, 'e')
    expect(el.getAttribute('data-presentation-node')).toBe(kind)
    const motionProps = motionOf(el)
    expect(motionProps.layoutId).toBe('e')
    expect(motionProps.layout).toBe(true)
    expect(motionProps.transition).toEqual(LAYOUT_TRANSITION)
    expect(LAYOUT_TRANSITION.duration).toBe(LAYOUT_T)
  })

  it.each(cases)('%s forwards className, style and custom data props', (_name, make) => {
    const { container } = render(make({ className: 'mine', style: { color: 'red' }, 'data-custom': 'yes' }))
    const el = find(container, 'e')
    expect(el.className).toBe('mine')
    expect(el.style.color).toBe('red')
    expect(el.getAttribute('data-custom')).toBe('yes')
    expect(el.getAttribute('data-presentation-id')).toBe('e')
  })

  it('places a node at literal canvas coordinates that author styles may override', () => {
    const { container } = render(<Box id="e" at={{ x: 12, y: 34, w: 56, h: 78 }} style={{ width: 99 }} />)
    const el = find(container, 'e')
    expect([el.style.position, el.style.left, el.style.top, el.style.height]).toEqual(['absolute', '12px', '34px', '78px'])
    expect(el.style.width).toBe('99px')
  })

  it('adds no positioning when no coordinates are given', () => {
    const { container } = render(<Label id="e">hi</Label>)
    expect(find(container, 'e').style.position).toBe('')
  })

  it('renders an optional Lucide icon-as-component and nothing when omitted', () => {
    const { container } = render(
      <>
        <Box id="with" Icon={Bird}>x</Box>
        <SymbolChip id="chip" Icon={Bird}>y</SymbolChip>
        <Box id="without">z</Box>
      </>,
    )
    expect(find(container, 'with').querySelector('svg[data-presentation-icon]')).not.toBeNull()
    expect(find(container, 'chip').querySelector('svg[data-presentation-icon]')).not.toBeNull()
    expect(find(container, 'without').querySelector('svg')).toBeNull()
    expect(find(container, 'without').textContent).toBe('z')
  })

  it('draws arrows between points, optionally with two heads and a bend', () => {
    const { container } = render(
      <>
        <Arrow id="one" from={[10, 10]} to={[110, 10]} />
        <Arrow id="two" from={[10, 10]} to={[110, 10]} bidirectional bend={20} />
      </>,
    )
    const one = find(container, 'one').querySelector('[data-presentation-arrow-line]')!
    const two = find(container, 'two').querySelector('[data-presentation-arrow-line]')!
    expect(one.getAttribute('marker-end')).toBe('url(#one-head)')
    expect(one.getAttribute('marker-start')).toBeNull()
    expect(one.getAttribute('d')).toMatch(/^M.* L/)
    expect(two.getAttribute('marker-start')).toBe('url(#two-head)')
    expect(two.getAttribute('d')).toMatch(/Q/)
    expect(find(container, 'one').style.pointerEvents).toBe('none')
  })

  it('labels a frame and keeps emphasis markers inert', () => {
    const { container } = render(
      <>
        <Frame id="f" label="Inside" />
        <Emphasis id="m" />
      </>,
    )
    expect(find(container, 'f').querySelector('[data-presentation-frame-label]')!.textContent).toBe('Inside')
    expect(find(container, 'm').style.pointerEvents).toBe('none')
  })

  it('lets a raw motion element with a stable layoutId sit beside the primitives', () => {
    const view = (x: number) => (
      <>
        <Box id="prim" at={{ x, y: 0, w: 10, h: 10 }} />
        <motion.div layout layoutId="raw" data-raw style={{ position: 'absolute', left: x, top: 7 }} />
      </>
    )
    const { container, rerender } = render(view(5))
    const raw = () => container.querySelector('[data-raw]') as HTMLElement
    expect(motionOf(raw()).layoutId).toBe('raw')
    expect(raw().style.left).toBe('5px')
    rerender(view(300))
    expect(motionOf(raw()).layoutId).toBe('raw')
    expect(raw().style.left).toBe('300px')
    expect(find(container, 'prim').style.left).toBe('300px')
    expect(motionOf(find(container, 'prim')).layoutId).toBe('prim')
  })
})

describe('Appear', () => {
  it('fades newcomers in only after persisting entities have settled', () => {
    const { container } = render(<Appear data-x />)
    const props = motionOf(container.querySelector('[data-x]'))
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(props.initial).toEqual({ opacity: 0 })
    expect(props.animate).toEqual({ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T } })
  })

  it('fades departing entities out immediately', () => {
    const { container } = render(<Appear data-x />)
    expect(motionOf(container.querySelector('[data-x]')).exit).toEqual({ opacity: 0, transition: { delay: 0, duration: EXIT_T } })
  })
})

describe('SceneLayer', () => {
  it('absolutely positions every layer over the whole canvas', () => {
    const { container } = render(
      <>
        <SceneLayer data-n="a">first</SceneLayer>
        <SceneLayer data-n="b">second, longer content</SceneLayer>
      </>,
    )
    for (const n of ['a', 'b']) {
      const layer = container.querySelector(`[data-n="${n}"]`) as HTMLElement
      expect([layer.style.position, layer.style.left, layer.style.top, layer.style.width, layer.style.height]).toEqual([
        'absolute', '0px', '0px', '100%', '100%',
      ])
    }
  })
})
