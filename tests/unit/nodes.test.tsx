import type { ReactNode } from 'react'
import { render, renderHook } from '@testing-library/react'
import { Circle } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import {
  Appear,
  Arrow,
  Attribution,
  Box,
  ENTER_DELAY,
  ENTER_T,
  Emphasis,
  Footer,
  Frame,
  Header,
  Label,
  Progress,
  SceneLayer,
  SymbolChip,
  Toc,
} from '../../src/presentation-kit'
import { useEntityProps, placement } from '../../src/presentation-kit/nodes/shared'
import { useAppearMotion } from '../../src/presentation-kit/nodes/appearMotion'

const hooks = (el: Element) => ({
  node: el.getAttribute('data-presentation-node'),
  entity: el.getAttribute('data-presentation-entity'),
})

describe('node primitives', () => {
  const cases: [string, (p: object) => ReactNode, string][] = [
    ['Box', (p) => <Box {...p} id="e" />, 'box'],
    ['Label', (p) => <Label {...p} id="e" />, 'label'],
    ['Frame', (p) => <Frame {...p} id="e" />, 'frame'],
    ['Emphasis', (p) => <Emphasis {...p} id="e" />, 'emphasis'],
    ['SymbolChip', (p) => <SymbolChip {...p} id="e" symbol="?" />, 'symbol-chip'],
  ]

  it.each(cases)('%s exposes stable hooks plus className, style, and data-* pass-through', (_n, make, kind) => {
    const { container } = render(<>{make({ className: 'mine', style: { zIndex: 4 }, 'data-extra': 'yes', x: 10, y: 20, w: 30, h: 40 })}</>)
    const el = container.firstElementChild as HTMLElement
    expect(hooks(el)).toEqual({ node: kind, entity: 'e' })
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.getAttribute('data-extra')).toBe('yes')
    expect(el.style.zIndex).toBe('4')
    expect(el.style).toMatchObject({ position: 'absolute', left: '10px', top: '20px', width: '30px', height: '40px' })
  })

  it('Arrow exposes hooks, class, style, data-*, and a line with a head, plus a second head when bidirectional', () => {
    const { container, rerender } = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} className="mine" data-extra="yes" style={{ zIndex: 7 }} />)
    const svg = container.querySelector('svg')!
    expect(hooks(svg)).toEqual({ node: 'arrow', entity: 'a' })
    expect(svg.classList.contains('mine')).toBe(true)
    expect(svg.getAttribute('data-extra')).toBe('yes')
    expect(svg.style.zIndex).toBe('7')
    expect(svg.style.position).toBe('absolute')
    expect(svg.querySelectorAll('line')).toHaveLength(1)
    expect(svg.querySelectorAll('[data-presentation-arrowhead]')).toHaveLength(1)
    rerender(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} bidirectional />)
    expect(container.querySelectorAll('[data-presentation-arrowhead]')).toHaveLength(2)
  })

  it('chrome pieces expose their hook and pass className, style, and data-* through to their element', () => {
    const common = { className: 'mine', style: { zIndex: 9 }, 'data-extra': 'yes' }
    const noop = () => {}
    const step = { id: 's', era: 'e', title: 'T', caption: 'C' }
    const cases: [string, ReactNode][] = [
      ['header', <Header {...common} title="t" mode="browse" />],
      ['footer', <Footer {...common} mode="browse" step={step} index={0} count={2} titles={['a', 'b']} onJump={noop} onPrev={noop} onNext={noop} />],
      ['footer', <Footer {...common} mode="present" step={step} index={0} count={2} titles={['a', 'b']} onJump={noop} onPrev={noop} onNext={noop} />],
      ['toc', <Toc {...common} sections={[{ era: 'e', first: 0, indices: [0] }]} active={0} onJump={noop} />],
      ['progress', <Progress {...common} titles={['a']} index={0} onJump={noop} />],
      ['attribution', <Attribution {...common} />],
    ]
    for (const [hook, element] of cases) {
      const { container, unmount } = render(<>{element}</>)
      const el = container.querySelector<HTMLElement>(
        hook === 'progress' ? '[data-presentation-progress]' : hook === 'attribution' ? '[data-presentation-attribution]' : `[data-presentation-chrome="${hook}"]`,
      )!
      expect(el, hook).not.toBeNull()
      expect(el.classList.contains('mine'), hook).toBe(true)
      expect(el.getAttribute('data-extra'), hook).toBe('yes')
      expect(el.style.zIndex, hook).toBe('9')
      expect(el.style.position === 'absolute' || hook === 'progress', hook).toBe(true)
      unmount()
    }
  })

  it('Box renders an optional Lucide glyph only when given an icon component', () => {
    const { container, rerender } = render(<Box id="b">text</Box>)
    expect(container.querySelector('[data-presentation-glyph]')).toBeNull()
    rerender(<Box id="b" icon={Circle}>text</Box>)
    const glyph = container.querySelector('[data-presentation-glyph]')!
    expect(glyph.tagName.toLowerCase()).toBe('svg')
    expect(glyph.getAttribute('aria-hidden')).toBe('true')
    expect(container.textContent).toBe('text')
  })

  it('SceneLayer is an absolutely positioned layer and passes attributes through', () => {
    const { container } = render(<SceneLayer className="l" data-x="1" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.hasAttribute('data-presentation-layer')).toBe(true)
    expect(el.style.position).toBe('absolute')
    expect(el.className).toBe('l')
    expect(el.getAttribute('data-x')).toBe('1')
  })

  it('placement only emits geometry, leaving unspecified values off', () => {
    expect(placement({ x: 1 })).toEqual({ position: 'absolute', left: 1, top: undefined, width: undefined, height: undefined })
  })
})

describe('entity motion props', () => {
  it('forwards the id as a stable layoutId with layout morphing and a non-empty exit transition', () => {
    const { result } = renderHook(() => useEntityProps('box', 'thing'))
    expect(result.current.layoutId).toBe('thing')
    expect(result.current['data-presentation-entity']).toBe('thing')
    expect(result.current.layout).toBe(true)
    expect(result.current.transition.layout.duration).toBeGreaterThan(0)
    expect(result.current.exit.transition.duration).toBeGreaterThan(0)
    expect(result.current.exit.opacity).toBe(0)
  })

  it('gives continuing entities no enter motion', () => {
    const { result } = renderHook(() => useEntityProps('box', 'thing'))
    expect(result.current).not.toHaveProperty('initial')
    expect(result.current).not.toHaveProperty('animate')
  })

  it('makes newcomers fade in only after the layout settle delay', () => {
    const wrap = ({ children }: { children: ReactNode }) => <Appear delay={0.2}>{children}</Appear>
    const { result } = renderHook(() => useAppearMotion(), { wrapper: wrap })
    expect(result.current.initial).toEqual({ opacity: 0 })
    expect(result.current.animate!.opacity).toBe(1)
    expect(result.current.animate!.transition.duration).toBe(ENTER_T)
    expect(result.current.animate!.transition.delay).toBeCloseTo(ENTER_DELAY + 0.2)
    expect(ENTER_DELAY).toBeGreaterThan(0)
  })

  it('treats Appear active={false} as a continuing entity with no enter motion', () => {
    const wrap = ({ children }: { children: ReactNode }) => <Appear active={false}>{children}</Appear>
    const { result } = renderHook(() => useAppearMotion(), { wrapper: wrap })
    expect(result.current).toEqual({})
  })

  it('applies newcomer motion to rendered primitives only inside an active Appear', () => {
    const { container } = render(
      <>
        <Appear>
          <Box id="new" />
        </Appear>
        <Appear active={false}>
          <Box id="old" />
        </Appear>
      </>,
    )
    const fresh = container.querySelector<HTMLElement>('[data-presentation-entity="new"]')!
    const kept = container.querySelector<HTMLElement>('[data-presentation-entity="old"]')!
    expect(fresh.style.opacity).toBe('0')
    expect(kept.style.opacity).toBe('')
  })
})
