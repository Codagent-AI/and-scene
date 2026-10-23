import { render, screen } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import {
  Appear, Arrow, arrowHead, arrowShaft, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip,
} from '../../src/presentation-kit'

const entity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement

describe('entity primitives', () => {
  it.each([
    ['box', (p: object) => <Box id="n" {...p} />],
    ['label', (p: object) => <Label id="n" {...p} />],
    ['frame', (p: object) => <Frame id="n" {...p} />],
    ['emphasis', (p: object) => <Emphasis id="n" {...p} />],
    ['symbol-chip', (p: object) => <SymbolChip id="n" {...p} />],
  ])('%s exposes stable hooks and passes className, style, data-* and coordinates through', (kind, build) => {
    render(build({ x: 12, y: 34, width: 56, height: 78, className: 'mine', style: { zIndex: 4 }, 'data-extra': 'yes', 'data-testid': 'node' }))
    const el = screen.getByTestId('node')
    expect(el.getAttribute('data-presentation-entity')).toBe('n')
    expect(el.getAttribute('data-presentation-kind')).toBe(kind)
    expect(el.className).toBe('mine')
    expect(el.getAttribute('data-extra')).toBe('yes')
    expect([el.style.position, el.style.left, el.style.top, el.style.width, el.style.height, el.style.zIndex])
      .toEqual(['absolute', '12px', '34px', '56px', '78px', '4'])
  })

  it('emphasis marks the entity; box emphasis prop is exposed as a hook', () => {
    render(<><Emphasis id="e" /><Box id="b" emphasis="flag" /><Box id="plain" /></>)
    expect(entity('e').getAttribute('data-presentation-emphasis')).toBe('true')
    expect(entity('b').getAttribute('data-presentation-emphasis')).toBe('flag')
    expect(entity('plain').hasAttribute('data-presentation-emphasis')).toBe(false)
  })

  it('keeps the same node when the entity changes position, size and label (morph in place)', () => {
    const { rerender } = render(<Box id="m" x={0} y={0} width={10} height={10}>one</Box>)
    const el = entity('m')
    rerender(<Box id="m" x={100} y={50} width={40} height={30} emphasis>two</Box>)
    expect(entity('m')).toBe(el)
    expect([el.style.left, el.style.top, el.style.width, el.style.height, el.textContent]).toEqual(['100px', '50px', '40px', '30px', 'two'])
  })

  it('Box renders an optional Lucide glyph component and is topic-agnostic', () => {
    const { rerender } = render(<Box id="g" Icon={Star} iconSize={20} data-testid="g">label</Box>)
    const icon = entity('g').querySelector('svg[data-presentation-icon]')!
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.getAttribute('width')).toBe('20')
    rerender(<Box id="g" data-testid="g">label</Box>)
    expect(entity('g').querySelector('svg')).toBeNull()
    expect(entity('g').getAttribute('data-presentation-kind')).toBe('box')
  })

  it('SymbolChip accepts a glyph and text', () => {
    render(<SymbolChip id="c" Icon={Star}>ok</SymbolChip>)
    expect(entity('c').textContent).toBe('ok')
    expect(entity('c').querySelector('svg')).not.toBeNull()
  })
})

describe('Arrow', () => {
  it('draws from/to coordinates unchanged and exposes hooks', () => {
    render(<Arrow id="a" from={{ x: 1, y: 2 }} to={{ x: 30, y: 40 }} bidirectional className="c" />)
    const svg = entity('a')
    expect(svg.getAttribute('data-presentation-kind')).toBe('arrow')
    expect(svg.getAttribute('class')).toBe('c')
    expect(svg.querySelector('[data-presentation-arrow-shaft]')!.getAttribute('d')).toBe(arrowShaft({ x: 1, y: 2 }, { x: 30, y: 40 }))
    expect(svg.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
  })

  it('computes a straight and a bent shaft and a triangular head at the tip', () => {
    expect(arrowShaft({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe('M 0 0 Q 5 0 10 0')
    expect(arrowShaft({ x: 0, y: 0 }, { x: 10, y: 0 }, 4)).toBe('M 0 0 Q 5 4 10 0')
    expect(arrowHead({ x: 10, y: 0 }, { x: 0, y: 0 }, 4).startsWith('M 10 0 L')).toBe(true)
  })
})

describe('Appear and SceneLayer', () => {
  it('Appear starts hidden, wraps absolutely, and SceneLayer positions the layer', () => {
    render(<SceneLayer className="layer"><Appear key="a" className="ap"><i data-testid="child" /></Appear></SceneLayer>)
    const layer = document.querySelector('[data-presentation-scene-layer]') as HTMLElement
    expect([layer.style.position, layer.className]).toEqual(['absolute', 'layer'])
    const wrap = screen.getByTestId('child').parentElement as HTMLElement
    expect(wrap.hasAttribute('data-presentation-appear')).toBe(true)
    expect([wrap.style.position, wrap.style.opacity, wrap.className]).toEqual(['absolute', '0', 'ap'])
  })
})

describe('Appear timing wiring', () => {
  it('passes the newcomer delay, never earlier than the layout transition, to motion', async () => {
    vi.resetModules()
    const seen: Record<string, unknown>[] = []
    vi.doMock('motion/react', () => ({
      motion: { div: (props: Record<string, unknown>) => { seen.push(props); return null } },
      AnimatePresence: ({ children }: { children: unknown }) => children,
    }))
    const constants = await import('../../src/presentation-kit/constants')
    const { Appear: MockedAppear } = await import('../../src/presentation-kit/nodes/Appear')
    render(<><MockedAppear /><MockedAppear offset={0.2} /><MockedAppear offset={-5} /></>)
    const delays = seen.map((p) => (p.animate as { transition: { delay: number } }).transition.delay)
    expect(delays[0]).toBeGreaterThanOrEqual(constants.LAYOUT_T)
    expect(delays[1]).toBeCloseTo(constants.ENTER_DELAY + 0.2, 10)
    expect(delays[2]).toBeGreaterThanOrEqual(constants.LAYOUT_T) // offsets cannot start a newcomer early
    expect(seen[0].initial).toEqual({ opacity: 0 })
    expect((seen[0].exit as { opacity: number }).opacity).toBe(0)
    // kit primitives take the same newcomer timing through `appear`
    seen.length = 0
    const { Box: MockedBox } = await import('../../src/presentation-kit/nodes/Box')
    render(<><MockedBox id="a" appear /><MockedBox id="b" appear={0.3} /><MockedBox id="c" /></>)
    const [a, b, c] = seen
    expect((a.animate as { transition: { delay: number } }).transition.delay).toBeGreaterThanOrEqual(constants.LAYOUT_T)
    expect((b.animate as { transition: { delay: number } }).transition.delay).toBeCloseTo(constants.ENTER_DELAY + 0.3, 10)
    expect(c.initial).toBeUndefined() // continuing entities get no enter behavior
    expect(c.animate).toBeUndefined()
    expect((c.exit as { opacity: number }).opacity).toBe(0) // but can still exit
    vi.doUnmock('motion/react')
    vi.resetModules()
  })
})

describe('author hooks reach every kit part', () => {
  const extras = { className: 'mine', 'data-extra': 'yes', style: { zIndex: 7 } }
  const check = (el: Element | null, hookAttr: string) => {
    expect(el, hookAttr).not.toBeNull()
    expect(el!.hasAttribute(hookAttr)).toBe(true)
    expect(el!.getAttribute('class')).toContain('mine')
    expect(el!.getAttribute('data-extra')).toBe('yes')
    expect((el as HTMLElement | SVGElement).style.zIndex).toBe('7')
  }
  const meta = { id: 's', era: 'e', title: 't', caption: 'c' }

  it('Arrow, Appear and SceneLayer pass className, style and data-* through', () => {
    const { container } = render(
      <SceneLayer {...extras}>
        <Appear key="a" {...extras}>
          <Arrow id="ar" from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} {...extras} />
        </Appear>
      </SceneLayer>,
    )
    check(container.querySelector('[data-presentation-scene-layer]'), 'data-presentation-scene-layer')
    check(container.querySelector('[data-presentation-appear]'), 'data-presentation-appear')
    check(container.querySelector('[data-presentation-kind="arrow"]'), 'data-presentation-entity')
  })

  it('Header, Footer, Toc, Attribution and Stage pass className, style and data-* through', async () => {
    const { Header, Footer, Toc, Attribution, Stage } = await import('../../src/presentation-kit')
    const step = { ...meta, Scene: () => null, payload: undefined }
    const { container } = render(
      <>
        <Header marker="01" era="e" mode="browse" onToggleMode={() => {}} {...extras} />
        <Footer mode="browse" step={step} steps={[step]} index={0} onPrev={() => {}} onNext={() => {}} onJump={() => {}} {...extras} />
        <Toc steps={[step]} index={0} top={0} onJump={() => {}} {...extras} />
        <Attribution {...extras} />
        <Stage step={step} index={0} scale={1} {...extras} />
      </>,
    )
    for (const hook of ['header', 'footer', 'toc', 'attribution', 'stage']) {
      check(container.querySelector(`[data-presentation-${hook}]`), `data-presentation-${hook}`)
    }
  })

  it('Presentation passes data-* through to its root', async () => {
    const { Presentation } = await import('../../src/presentation-kit')
    const step = { ...meta, Scene: () => null, payload: undefined }
    const { container } = render(<Presentation steps={[step]} title="t" {...extras} />)
    check(container.querySelector('[data-presentation-root]'), 'data-presentation-root')
  })
})
