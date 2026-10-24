import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { LayoutGroup, motion } from 'motion/react'
import { StrictMode } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  Appear, Arrow, Box, ENTER_DELAY, ENTER_T, Emphasis, Frame, LAYOUT_T, Label, Presentation, SceneLayer, SymbolChip,
} from '../../src/presentation-kit/index.ts'
import { PositionedNode } from '../../src/presentation-kit/nodes/PositionedNode.tsx'
import type { Step } from '../../src/presentation-kit/index.ts'
import { CountingScene, OtherScene, counters, key, makeSteps, mode, resetCounters, setViewport, stepIndex } from './helpers.tsx'
import type { Payload } from './helpers.tsx'

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
const live = () => counters.mounts - counters.unmounts

beforeEach(() => {
  resetCounters()
  setViewport(1400, 900)
})

describe('grouped scenes', () => {
  const mount = (steps: Step<Payload>[], strict = false) => {
    const el = <Presentation steps={steps} title="T" />
    return render(strict ? <StrictMode>{el}</StrictMode> : el)
  }

  it('keeps one scene instance across a group and updates its payload in place', () => {
    mount(makeSteps(4, { group: () => 'g' }))
    const scene = q('[data-testid="scene"]')!
    const mountsAfterFirst = counters.mounts
    key('ArrowRight')
    key('ArrowRight')
    expect(counters.mounts).toBe(mountsAfterFirst)
    expect(q('[data-testid="scene"]')).toBe(scene)
    expect(scene.textContent).toBe('payload 2')
    expect(scene.getAttribute('data-index')).toBe('2')
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })

  it('keeps the baseline of live instances under StrictMode while navigating a group', () => {
    mount(makeSteps(3, { group: () => 'g' }), true)
    const baseline = live()
    const mounts = counters.mounts
    key('ArrowRight')
    key('ArrowRight')
    expect(live()).toBe(baseline)
    expect(counters.mounts).toBe(mounts)
  })

  it('remounts when the group changes, when the Scene changes, and for ungrouped steps', async () => {
    const [a, b, c, d, e] = makeSteps(5)
    const steps: Step<Payload>[] = [
      { ...a, groupKey: 'one' },
      { ...b, groupKey: 'two' },
      { ...c, groupKey: 'two', Scene: OtherScene },
      { ...d, groupKey: undefined },
      { ...e, groupKey: undefined },
    ]
    mount(steps)
    const before = counters.mounts
    key('ArrowRight') // group one -> two: remount
    expect(counters.mounts).toBe(before + 1)
    key('ArrowRight') // same group, different Scene
    expect(q('[data-testid="other-scene"]')).not.toBeNull()
    key('ArrowRight') // grouped -> ungrouped
    const afterUngrouped = counters.mounts
    key('ArrowRight') // ungrouped -> ungrouped
    expect(counters.mounts).toBe(afterUngrouped + 1)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1))
  })

  it('cross-fades: the previous scene stays until its exit finishes, then unmounts', async () => {
    mount(makeSteps(2, { group: (i) => `g${i}` }))
    key('ArrowRight')
    expect(document.querySelectorAll('[data-presentation-scene]').length).toBeGreaterThan(1)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1))
    expect(q('[data-testid="scene"]')?.textContent).toBe('payload 1')
  })
})

describe('stage geometry', () => {
  it('draws the 880 x 380 canvas at a scale constant across steps and recomputed on resize', () => {
    render(<Presentation steps={makeSteps(3)} title="T" />)
    const stage = () => q('[data-presentation-stage]')!
    const canvas = q('[data-presentation-canvas]')!
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
    const scale = stage().getAttribute('data-presentation-scale')
    key('ArrowRight')
    key('ArrowRight')
    expect(stage().getAttribute('data-presentation-scale')).toBe(scale)
    expect(Number(stage().style.width.replace('px', ''))).toBeCloseTo(880 * Number(scale))
    setViewport(1000, 700)
    expect(stage().getAttribute('data-presentation-scale')).not.toBe(scale)
    expect(canvas.style.width).toBe('880px')
  })

  it('accepts a custom canvas', () => {
    render(<Presentation steps={makeSteps(1)} title="T" canvas={{ width: 440, height: 190 }} />)
    const canvas = q('[data-presentation-canvas]')!
    expect([canvas.style.width, canvas.style.height]).toEqual(['440px', '190px'])
  })

  it('re-renders the stage on a mode switch instead of morphing across geometries', () => {
    render(<Presentation steps={makeSteps(2)} title="T" />)
    const mountsBefore = counters.mounts
    const scale = q('[data-presentation-stage]')!.getAttribute('data-presentation-scale')
    key('p')
    expect(mode()).toBe('present')
    expect(counters.mounts).toBe(mountsBefore + 1)
    expect(q('[data-presentation-stage]')!.getAttribute('data-presentation-scale')).not.toBe(scale)
    expect(stepIndex()).toBe(0)
  })
})

/** Calls function components until the first host-like (motion) element is reached. */
function resolve(element: ReactElement): ReactElement {
  let current = element
  while (typeof current.type === 'function') {
    current = (current.type as (props: unknown) => ReactElement)(current.props)
  }
  return current
}

describe('entity continuity and entry/exit wiring', () => {
  it('gives every positioned primitive a layout-projected motion node keyed by its entity id', () => {
    const props = { id: 'e1', x: 1, y: 2 }
    for (const el of [<Box {...props} />, <Label {...props} />, <Frame {...props} />, <Emphasis {...props} />, <SymbolChip {...props} />]) {
      const node = resolve(el)
      expect(node.type).toBe(motion.div)
      const p = node.props as Record<string, unknown>
      expect(p.layoutId).toBe('e1')
      expect(p.layout).toBe(true)
      expect((p.exit as { opacity: number }).opacity).toBe(0)
    }
    expect((resolve(<PositionedNode kind="box" {...props} />).props as { layoutId: string }).layoutId).toBe('e1')
  })

  it('morphs a persisting entity in place: same node, new geometry and content', () => {
    const view = (x: number, w: number, text: string) => (
      <LayoutGroup>
        <Box id="persist" x={x} y={20} width={w} height={40} data-emphasis={text === 'b' ? 'on' : 'off'}>
          {text}
        </Box>
      </LayoutGroup>
    )
    const { rerender } = render(view(10, 100, 'a'))
    const node = q('[data-presentation-id="persist"]')!
    expect([node.style.left, node.style.width, node.textContent]).toEqual(['10px', '100px', 'a'])
    rerender(view(300, 160, 'b'))
    expect(q('[data-presentation-id="persist"]')).toBe(node)
    expect([node.style.left, node.style.width, node.textContent, node.getAttribute('data-emphasis')]).toEqual(['300px', '160px', 'b', 'on'])
  })

  it('delays newcomers until persisting entities settle and fades them in once', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const el = resolve(<Appear>{null}</Appear>)
    const p = el.props as { initial: { opacity: number }; animate: { opacity: number }; transition: { delay: number; duration: number }; exit: { opacity: number } }
    expect(p.initial.opacity).toBe(0)
    expect(p.animate.opacity).toBe(1)
    expect(p.transition.delay).toBe(ENTER_DELAY)
    expect(p.transition.duration).toBe(ENTER_T)
    expect(p.exit.opacity).toBe(0)
    expect((resolve(<Appear delay={2}>{null}</Appear>).props as { transition: { delay: number } }).transition.delay).toBe(2)
  })

  const layer = (ids: string[]): ReactNode => (
    <SceneLayer>
      {ids.map((id) => (
        <Appear key={id} delay={0.01} data-testid={`appear-${id}`}>
          <Box id={id} x={0} y={0}>
            {id}
          </Box>
        </Appear>
      ))}
    </SceneLayer>
  )

  it('does not re-fade continuing entities; only newcomers start transparent', async () => {
    const { rerender, getByTestId } = render(layer(['a']))
    await waitFor(() => expect(getByTestId('appear-a').style.opacity).toBe('1'))
    const a = getByTestId('appear-a')
    rerender(layer(['a', 'b']))
    expect(getByTestId('appear-a')).toBe(a)
    expect(a.style.opacity).toBe('1')
    expect(getByTestId('appear-b').style.opacity).toBe('0')
    await waitFor(() => expect(getByTestId('appear-b').style.opacity).toBe('1'))
    expect(a.style.opacity).toBe('1')
  })

  it('animates a departing entity out inside a retained scene, then unmounts it', async () => {
    const { rerender, queryByTestId } = render(layer(['a', 'b']))
    await waitFor(() => expect(queryByTestId('appear-b')?.style.opacity).toBe('1'))
    rerender(layer(['a']))
    expect(queryByTestId('appear-b')).not.toBeNull()
    await waitFor(() => expect(queryByTestId('appear-b')).toBeNull(), { timeout: 3000 })
    expect(queryByTestId('appear-a')).not.toBeNull()
  })
})

describe('layers and composition', () => {
  it('positions each layer absolutely so adding one does not move another', () => {
    const base = (extra: boolean) => (
      <div style={{ position: 'relative' }}>
        <SceneLayer data-layer="one">
          <Box id="x" x={10} y={20} width={30} height={40}>x</Box>
        </SceneLayer>
        {extra && (
          <SceneLayer data-layer="two">
            <Box id="y" x={12} y={22} width={30} height={40}>y</Box>
          </SceneLayer>
        )}
      </div>
    )
    const { rerender } = render(base(false))
    const one = q('[data-layer="one"]')!
    const snapshot = [one.style.position, one.style.left, one.style.top, one.style.width, one.style.height]
    const x = q('[data-presentation-id="x"]')!
    const xGeometry = [x.style.left, x.style.top, x.style.width]
    rerender(base(true))
    expect(snapshot).toEqual(['absolute', '0px', '0px', '100%', '100%'])
    expect([one.style.position, one.style.left, one.style.top, one.style.width, one.style.height]).toEqual(snapshot)
    expect([x.style.left, x.style.top, x.style.width]).toEqual(xGeometry)
  })

  it('preserves literal coordinates and stacking order of intentionally overlapping entities', () => {
    render(
      <SceneLayer>
        <Box id="under" x={100} y={100} width={80} height={80} style={{ zIndex: 1 }}>u</Box>
        <Box id="over" x={120} y={120} width={80} height={80} style={{ zIndex: 2 }}>o</Box>
      </SceneLayer>,
    )
    const under = q('[data-presentation-id="under"]')!
    const over = q('[data-presentation-id="over"]')!
    expect([under.style.left, under.style.top, over.style.left, over.style.top]).toEqual(['100px', '100px', '120px', '120px'])
    expect([under.style.zIndex, over.style.zIndex]).toEqual(['1', '2'])
  })

  it('supports raw motion elements with stable layoutIds beside primitives, keeping coordinates', () => {
    const Scene = ({ x }: { x: number }) => (
      <LayoutGroup>
        <SceneLayer>
          <motion.div key="raw" layoutId="raw-entity" data-raw="" style={{ position: 'absolute', left: x, top: 5 }} />
          <Box key="p" id="prim" x={x} y={50} className="styled" style={{ borderStyle: 'dashed' }} />
        </SceneLayer>
      </LayoutGroup>
    )
    const { rerender } = render(<Scene x={10} />)
    const raw = q('[data-raw]')!
    rerender(<Scene x={400} />)
    expect(q('[data-raw]')).toBe(raw)
    expect(raw.style.left).toBe('400px')
    const prim = q('[data-presentation-id="prim"]')!
    expect([prim.style.left, prim.style.top, prim.style.borderStyle, prim.className]).toEqual(['400px', '50px', 'dashed', 'styled'])
  })
})

describe('style hooks reach the DOM element', () => {
  it('forwards className, style, and data attributes on every primitive without erasing hooks', () => {
    const common = { id: 'n', x: 3, y: 4, width: 5, height: 6, className: 'mine', style: { opacity: 0.5, left: 9 }, 'data-custom': 'yes' }
    const cases: [string, ReactElement][] = [
      ['box', <Box {...common} />],
      ['label', <Label {...common} />],
      ['frame', <Frame {...common} />],
      ['emphasis', <Emphasis {...common} />],
      ['symbol-chip', <SymbolChip {...common} />],
    ]
    for (const [kind, el] of cases) {
      const { unmount } = render(el)
      const node = q(`[data-presentation-node="${kind}"]`)!
      expect(node.getAttribute('data-presentation-id'), kind).toBe('n')
      expect(node.className).toBe('mine')
      expect(node.getAttribute('data-custom')).toBe('yes')
      expect(node.style.opacity).toBe('0.5')
      expect([node.style.position, node.style.top, node.style.width, node.style.height]).toEqual(['absolute', '4px', '5px', '6px'])
      unmount()
    }
    const { unmount } = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 10, y: 0 }} className="arr" data-custom="yes" style={{ opacity: 0.3 }} />)
    const arrow = q('[data-presentation-node="arrow"]')!
    expect([arrow.getAttribute('data-presentation-id'), arrow.getAttribute('class'), arrow.getAttribute('data-custom'), arrow.style.opacity]).toEqual(['a', 'arr', 'yes', '0.3'])
    unmount()
    render(<Appear data-custom="yes" className="app" style={{ opacity: 1 }}>x</Appear>)
    const appear = q('[data-presentation-appear]')!
    expect([appear.className, appear.getAttribute('data-custom')]).toEqual(['app', 'yes'])
  })

  it('exposes hooks for every chrome element, forwarding the root className', () => {
    render(<Presentation steps={makeSteps(4)} title="T" className="mine" />)
    expect(q('[data-presentation-root]')!.className).toBe('mine')
    for (const hook of [
      'header', 'brand-slot', 'marker', 'title', 'mode-toggle', 'footer', 'caption', 'progress', 'progress-item', 'prev', 'next',
      'controls', 'toc', 'toc-item', 'attribution', 'stage', 'canvas', 'scene',
    ]) {
      expect(q(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(q('[data-presentation-footer] [data-presentation-title]')).not.toBeNull()
  })

  it('renders Box with an optional Lucide icon component, and without one', () => {
    const { unmount } = render(<Box id="i" x={0} y={0} icon={Check}>with</Box>)
    expect(q('[data-presentation-id="i"] svg[data-presentation-icon]')).not.toBeNull()
    unmount()
    render(<Box id="n" x={0} y={0}>without</Box>)
    expect(q('[data-presentation-id="n"] svg')).toBeNull()
    expect(q('[data-presentation-id="n"]')?.textContent).toBe('without')
  })

  it('renders SymbolChip text symbols and Frame labels independently of any sample content', () => {
    render(
      <>
        <SymbolChip id="c" x={0} y={0} symbol="★" />
        <Frame id="f" x={0} y={0} label="region" />
        <Frame id="g" x={0} y={0} />
      </>,
    )
    expect(q('[data-presentation-id="c"]')?.textContent).toBe('★')
    expect(q('[data-presentation-id="f"] [data-presentation-frame-label]')?.textContent).toBe('region')
    expect(q('[data-presentation-id="g"] [data-presentation-frame-label]')).toBeNull()
    expect(q('[data-presentation-id="f"]')?.hasAttribute('data-presentation-allow-overlap')).toBe(true)
  })
})

describe('typed step boundary', () => {
  it('accepts typed steps without casts (compiled) and a scene uses its payload', () => {
    const steps = makeSteps(2)
    render(<Presentation steps={steps} title="T" />)
    expect(q('[data-testid="scene"]')?.textContent).toBe('payload 0')
    act(() => {})
    expect(CountingScene).toBeTypeOf('function')
  })
})
