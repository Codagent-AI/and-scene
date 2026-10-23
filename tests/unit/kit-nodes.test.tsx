import { fireEvent, render } from '@testing-library/react'
import { Check } from 'lucide-react'
import { createRef } from 'react'
import { motion } from 'motion/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  Presentation,
  SceneLayer,
  SymbolChip,
  type SceneProps,
  type Step,
} from '../../src/presentation-kit/index.ts'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants.ts'
import { headPath, shaftPath } from '../../src/presentation-kit/nodes/arrowPaths.ts'

vi.mock('motion/react', async () => (await import('./motion-mock.tsx')).motionMock)

const q = (sel: string) => document.querySelector(sel) as HTMLElement
const json = (el: HTMLElement, k: 'mInitial' | 'mAnimate' | 'mExit' | 'mTransition') =>
  el.dataset[k] ? JSON.parse(el.dataset[k]!) : undefined

const PRIMITIVES = [
  ['box', (p: object) => <Box id="e" {...p}>x</Box>],
  ['label', (p: object) => <Label id="e" {...p}>x</Label>],
  ['frame', (p: object) => <Frame id="e" {...p} />],
  ['emphasis', (p: object) => <Emphasis id="e" {...p} />],
  ['symbol-chip', (p: object) => <SymbolChip id="e" {...p}>x</SymbolChip>],
] as const

describe('generic node primitives', () => {
  it.each(PRIMITIVES)('%s exposes hooks and passes class, style and data-* through', (kind, make) => {
    render(
      make({
        className: 'mine',
        style: { zIndex: 3 },
        x: 10,
        y: 20,
        w: 30,
        h: 40,
        'data-custom': 'yes',
        'aria-label': 'named',
      }),
    )
    const el = q(`[data-presentation-node="${kind}"]`)
    expect(el.dataset.presentationEntity).toBe('e')
    expect(el.dataset.layoutId).toBe('e')
    expect(el.classList.contains('mine')).toBe(true)
    expect(el.dataset.custom).toBe('yes')
    expect(el.getAttribute('aria-label')).toBe('named')
    expect(el.style.position).toBe('absolute')
    expect([el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['10px', '20px', '30px', '40px'])
    expect(el.style.zIndex).toBe('3')
  })

  it.each(PRIMITIVES)('%s morphs in place: stable layout id and a timed layout transition', (_k, make) => {
    const { rerender } = render(make({ x: 0, y: 0 }))
    const el = q('[data-layout-id="e"]')
    expect(json(el, 'mTransition').layout.duration).toBe(LAYOUT_T)
    rerender(make({ x: 100, y: 50 }))
    expect(q('[data-layout-id="e"]')).toBe(el)
    expect(el.style.left).toBe('100px')
  })

  it('caller style overrides placement and does not add visual defaults', () => {
    render(<Box id="b" x={1} style={{ left: 9 }} />)
    const el = q('[data-presentation-node="box"]')
    expect(el.style.left).toBe('9px')
    expect(el.getAttribute('style')).toBe('position: absolute; left: 9px;')
  })

  it('Box renders an optional Lucide glyph and keeps identity and hooks either way', () => {
    const { rerender } = render(<Box id="b" data-x="1">label</Box>)
    expect(q('[data-presentation-icon]')).toBeNull()
    const plain = q('[data-presentation-node="box"]')
    expect(plain.textContent).toBe('label')
    rerender(
      <Box id="b" data-x="1" Icon={Check}>
        label
      </Box>,
    )
    expect(q('[data-presentation-icon]')).not.toBeNull()
    const withIcon = q('[data-presentation-node="box"]')
    expect(withIcon.dataset.layoutId).toBe('b')
    expect(withIcon.dataset.x).toBe('1')
    expect(withIcon.textContent).toBe('label')
  })

  it('Arrow draws a shaft and an end head, a start head when bidirectional, and animates d on change', () => {
    const { rerender } = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} className="c" />)
    const svg = q('[data-presentation-node="arrow"]')
    expect(svg.dataset.presentationEntity).toBe('a')
    expect(svg.classList.contains('c')).toBe(true)
    expect(svg.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(1)
    const shaft = () => json(q('[data-presentation-arrow-shaft]'), 'mAnimate').d
    expect(shaft()).toBe(shaftPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0))
    rerender(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 100, y: 50 }} bidirectional bend={20} />)
    expect(q('[data-presentation-node="arrow"]')).toBe(svg)
    expect(svg.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    expect(shaft()).toBe(shaftPath({ x: 0, y: 0 }, { x: 100, y: 50 }, 20))
    expect(shaft()).not.toBe(shaftPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0))
  })

  it('arrow path helpers are deterministic', () => {
    expect(shaftPath({ x: 0, y: 0 }, { x: 10, y: 0 }, 0)).toBe('M 0 0 Q 5 0 10 0')
    expect(headPath({ x: 10, y: 0 }, { x: 0, y: 0 }, 4)).toMatch(/^M 10 0 L .+ L .+ Z$/)
  })
})

describe('Arrow continuity across scene instances', () => {
  it('starts a continuing arrow from its previous shape when its scene instance is replaced', () => {
    const first = render(<Arrow id="carry" from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} />)
    const was = shaftPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0)
    expect(json(q('[data-presentation-arrow-shaft]'), 'mInitial')).toBe(false) // first sight: no morph
    first.unmount()
    render(<Arrow id="carry" from={{ x: 0, y: 0 }} to={{ x: 100, y: 80 }} bend={10} />)
    const shaft = q('[data-presentation-arrow-shaft]')
    expect(json(shaft, 'mInitial')).toEqual({ d: was })
    expect(json(shaft, 'mAnimate').d).toBe(shaftPath({ x: 0, y: 0 }, { x: 100, y: 80 }, 10))
    expect(json(q('[data-presentation-arrow-head="end"]'), 'mInitial').d).toBe(headPath({ x: 100, y: 0 }, { x: 0, y: 0 }, 10))
  })
})

describe('Arrow, Appear and SceneLayer passthrough', () => {
  it('apply class, style and data-* to their rendered node', () => {
    render(
      <SceneLayer className="layer" style={{ zIndex: 2 }} data-layer="1">
        <Appear key="a" className="appear" style={{ zIndex: 5 }} data-appear="1">
          <Arrow id="ar" from={{ x: 0, y: 0 }} to={{ x: 5, y: 5 }} className="arrow" style={{ zIndex: 7 }} data-arrow="1" />
        </Appear>
      </SceneLayer>,
    )
    const layer = q('[data-presentation-scene-layer]')
    expect([layer.className, layer.style.zIndex, layer.dataset.layer]).toEqual(['layer', '2', '1'])
    const appear = q('[data-presentation-appear]')
    expect([appear.className, appear.style.zIndex, appear.dataset.appear, appear.style.position]).toEqual(['appear', '5', '1', 'absolute'])
    const arrow = q('[data-presentation-node="arrow"]')
    expect([arrow.getAttribute('class'), arrow.style.zIndex, arrow.dataset.arrow]).toEqual(['arrow', '7', '1'])
  })
})

describe('newcomer sequencing and scene layers', () => {
  it('Appear fades newcomers in after the persisting layout morph and fades them out on exit', () => {
    render(<Appear>child</Appear>)
    const el = q('[data-presentation-appear]')
    expect(json(el, 'mInitial')).toEqual({ opacity: 0 })
    const anim = json(el, 'mAnimate')
    expect(anim.opacity).toBe(1)
    expect(anim.transition.duration).toBe(ENTER_T)
    expect(anim.transition.delay).toBe(ENTER_DELAY)
    expect(anim.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(json(el, 'mExit').opacity).toBe(0)
    expect(el.style.position).toBe('absolute')
  })

  it('Appear accepts a custom delay', () => {
    render(<Appear delay={1.5}>x</Appear>)
    expect(json(q('[data-presentation-appear]'), 'mAnimate').transition.delay).toBe(1.5)
  })

  it('SceneLayer absolutely positions its diagram inside a presence host and leaves siblings alone', () => {
    const { rerender } = render(
      <div>
        <SceneLayer className="one">
          <Box id="a" x={5} y={6} />
        </SceneLayer>
        <SceneLayer className="two">
          <Box id="c" x={50} y={60} />
        </SceneLayer>
      </div>,
    )
    const one = q('.one')
    const two = q('.two')
    for (const l of [one, two]) {
      expect(l.style.position).toBe('absolute')
      expect(l.hasAttribute('data-presentation-scene-layer')).toBe(true)
      expect(l.querySelector('[data-mock-presence]')).not.toBeNull()
    }
    const beforeTwo = two.innerHTML
    rerender(
      <div>
        <SceneLayer className="one">
          <Box id="a" x={5} y={6} />
          <Appear key="n">
            <Box id="n" x={7} y={8} />
          </Appear>
        </SceneLayer>
        <SceneLayer className="two">
          <Box id="c" x={50} y={60} />
        </SceneLayer>
      </div>,
    )
    expect(q('.two').innerHTML).toBe(beforeTwo)
    expect(q('[data-layout-id="a"]').style.left).toBe('5px')
  })

  it('continuing entities keep their DOM instance without newcomer wrapping; additions are wrapped', () => {
    const Scene = ({ payload }: SceneProps<{ more: boolean; moved: boolean }>) => (
      <SceneLayer>
        <Box id="keep" x={payload.moved ? 200 : 10} y={0} />
        {payload.more && (
          <Appear key="new">
            <Box id="added" x={0} y={0} />
          </Appear>
        )}
      </SceneLayer>
    )
    const steps: Step<{ more: boolean; moved: boolean }>[] = [
      { id: 'a', era: 'e', title: 'A', caption: 'a', Scene, payload: { more: false, moved: false }, groupKey: 'g' },
      { id: 'b', era: 'e', title: 'B', caption: 'b', Scene, payload: { more: true, moved: true }, groupKey: 'g' },
    ]
    render(<Presentation steps={steps} title="d" />)
    const keep = q('[data-layout-id="keep"]')
    expect(keep.closest('[data-presentation-appear]')).toBeNull()
    expect(keep.dataset.mInitial).toBeUndefined()
    expect(q('[data-layout-id="added"]')).toBeNull()
    fireEvent.click(q('[data-presentation-next]'))
    expect(q('[data-layout-id="keep"]')).toBe(keep)
    expect(keep.style.left).toBe('200px')
    expect(keep.closest('[data-presentation-appear]')).toBeNull()
    const added = q('[data-layout-id="added"]')
    expect(added.closest('[data-presentation-appear]')).not.toBeNull()
    // departing: back removes the newcomer's wrapper
    fireEvent.click(q('[data-presentation-prev]'))
    expect(q('[data-layout-id="added"]')).toBeNull()
    expect(q('[data-layout-id="keep"]')).toBe(keep)
    expect(keep.style.left).toBe('10px')
  })

  it('supports raw motion elements with a stable layoutId at literal coordinates', () => {
    const ref = createRef<HTMLDivElement>()
    const Scene = ({ payload }: SceneProps<{ x: number }>) => (
      <motion.div ref={ref} layoutId="raw" style={{ position: 'absolute', left: payload.x, top: 12 }} data-raw="1" />
    )
    const steps: Step<{ x: number }>[] = [
      { id: 'a', era: 'e', title: 'A', caption: 'a', Scene, payload: { x: 11 }, groupKey: 'g' },
      { id: 'b', era: 'e', title: 'B', caption: 'b', Scene, payload: { x: 222 }, groupKey: 'g' },
    ]
    render(<Presentation steps={steps} title="d" />)
    const raw = q('[data-raw]')
    expect(raw.dataset.layoutId).toBe('raw')
    expect(raw.style.left).toBe('11px')
    fireEvent.click(q('[data-presentation-next]'))
    expect(q('[data-raw]')).toBe(raw)
    expect(raw.style.left).toBe('222px')
    expect(raw.style.top).toBe('12px')
    expect(raw.dataset.layoutId).toBe('raw')
  })
})
