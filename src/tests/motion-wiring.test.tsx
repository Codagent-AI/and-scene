import { act, render, screen } from '@testing-library/react'
import { createElement, forwardRef, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Camera } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

// Motion is replaced by a recorder: props that matter to behavior become data attributes.
vi.mock('motion/react', () => {
  const make = (tag: string) =>
    forwardRef<HTMLElement, Record<string, unknown>>(function MockMotion(props, ref) {
      const { layout, layoutId, initial, animate, exit, transition, children, ...rest } = props
      void transition
      return createElement(
        tag,
        {
          ...rest,
          ref,
          'data-m-layout': layout ? 'true' : undefined,
          'data-m-layout-id': layoutId,
          'data-m-initial': initial === undefined ? undefined : JSON.stringify(initial),
          'data-m-animate': animate === undefined ? undefined : JSON.stringify(animate),
          'data-m-exit': exit === undefined ? undefined : JSON.stringify(exit),
        },
        children as ReactNode,
      )
    })
  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get(cache, tag: string) {
        // One stable component per tag, or every render would remount.
        return (cache[tag] ??= make(tag))
      },
    }),
    AnimatePresence: ({ children }: { children?: ReactNode }) => createElement('div', { 'data-m-presence': '' }, children),
    LayoutGroup: ({ children }: { children?: ReactNode }) => createElement('div', { 'data-m-layout-group': '' }, children),
  }
})

import {
  Appear,
  Arrow,
  Box,
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  ENTER_T,
  Emphasis,
  Frame,
  LAYOUT_T,
  Label,
  Presentation,
  SceneLayer,
  Stage,
  SymbolChip,
} from '../presentation-kit'
import type { SceneProps, Step } from '../presentation-kit'
import { StageContext } from '../presentation-kit/stageContext'
import { makeSteps } from './helpers'

const entity = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)!
const parse = (value: string | null) => JSON.parse(value ?? 'null')

describe('persisting entities', () => {
  it('keeps one DOM node and layoutId while geometry, label, and emphasis change', () => {
    const view = (x: number, label: string, emphasis: boolean) => (
      <SceneLayer>
        <Box key="a" id="a" at={{ x, y: 10, w: 50, h: 20 }} emphasis={emphasis}>{label}</Box>
      </SceneLayer>
    )
    const { rerender } = render(view(0, 'old', false))
    const before = entity('a')
    expect(before.getAttribute('data-m-layout-id')).toBe('a')
    expect(before.getAttribute('data-m-layout')).toBe('true')
    expect(before.style.left).toBe('0px')
    expect(before.textContent).toBe('old')
    expect(before.hasAttribute('data-presentation-emphasis')).toBe(false)
    rerender(view(200, 'new', true))
    const after = entity('a')
    expect(after).toBe(before)
    expect(after.style.left).toBe('200px')
    expect(after.textContent).toBe('new')
    expect(after.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(after.getAttribute('data-m-layout-id')).toBe('a')
  })
})

describe('newcomers', () => {
  const settled = LAYOUT_T + ENTER_DELAY

  it('Appear starts only after the layout move, then fades in over ENTER_T', () => {
    render(<Appear>x</Appear>)
    const element = document.querySelector('[data-presentation-appear]')!
    expect(parse(element.getAttribute('data-m-initial'))).toEqual({ opacity: 0 })
    const animate = parse(element.getAttribute('data-m-animate'))
    expect(animate.opacity).toBe(1)
    expect(animate.transition.delay).toBe(settled)
    expect(animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(animate.transition.duration).toBe(ENTER_T)
  })

  it('primitives accept appear with the same timing; without it they never fade', () => {
    render(
      <>
        <Box id="new" appear />
        <Box id="plain" />
      </>,
    )
    const animate = parse(entity('new').getAttribute('data-m-animate'))
    expect(animate.transition.delay).toBe(settled)
    expect(parse(entity('new').getAttribute('data-m-initial'))).toEqual({ opacity: 0 })
    expect(entity('plain').hasAttribute('data-m-initial')).toBe(false)
    expect(entity('plain').hasAttribute('data-m-animate')).toBe(false)
  })

  it('skips the entrance in a canvas remounted by a mode switch', () => {
    render(
      <StageContext.Provider value={{ instant: true }}>
        <Appear>x</Appear>
        <Box id="b" appear />
      </StageContext.Provider>,
    )
    expect(document.querySelector('[data-presentation-appear]')!.getAttribute('data-m-initial')).toBe('false')
    expect(entity('b').getAttribute('data-m-initial')).toBe('false')
  })

  it('continuing entities are bare: no Appear wrapper and no initial opacity reset on update', () => {
    const view = (n: number) => (
      <SceneLayer>
        <Box key="keep" id="keep" at={{ x: n * 10, y: 0 }} />
        {n > 1 ? <Box key="fresh" id="fresh" appear /> : null}
      </SceneLayer>
    )
    const { rerender } = render(view(1))
    const keep = entity('keep')
    expect(keep.closest('[data-presentation-appear]')).toBeNull()
    expect(keep.hasAttribute('data-m-initial')).toBe(false)
    rerender(view(2))
    expect(entity('keep')).toBe(keep)
    expect(keep.hasAttribute('data-m-initial')).toBe(false)
    expect(entity('fresh').getAttribute('data-m-initial')).toBe(JSON.stringify({ opacity: 0 }))
  })
})

describe('departing entities', () => {
  it('declare a non-empty exit animation inside the layer AnimatePresence that owns their keys', () => {
    render(
      <SceneLayer>
        <Box key="b" id="b" />
        <Label key="l" id="l" />
        <SymbolChip key="s" id="s" />
        <Frame key="f" id="f" />
        <Arrow key="a" id="a" from={[0, 0]} to={[10, 10]} />
        <Appear key="p">y</Appear>
      </SceneLayer>,
    )
    for (const id of ['b', 'l', 's', 'f', 'a']) {
      const exit = parse(entity(id).getAttribute('data-m-exit'))
      expect(exit, id).toMatchObject({ opacity: 0 })
      expect(entity(id).parentElement!.hasAttribute('data-m-presence')).toBe(true)
      expect(entity(id).closest('[data-presentation-scene-layer]')).not.toBeNull()
    }
    const appearExit = parse(document.querySelector('[data-presentation-appear]')!.getAttribute('data-m-exit'))
    expect(appearExit).toMatchObject({ opacity: 0 })
  })
})

describe('departing scenes', () => {
  it('declare an exit on the scene wrapper inside the stage AnimatePresence, so a scene swap fades out', () => {
    render(<Stage steps={makeSteps(2)} index={0} mode="browse" />)
    const scene = document.querySelector<HTMLElement>('[data-presentation-scene]')!
    expect(parse(scene.getAttribute('data-m-exit'))).toMatchObject({ opacity: 0 })
    expect(scene.parentElement!.hasAttribute('data-m-presence')).toBe(true)
  })
})

describe('coordinates and composition', () => {
  it('preserves literal overlapping coordinates and stacking before and after an update', () => {
    const view = (tick: number) => (
      <SceneLayer>
        <Box key="under" id="under" at={{ x: 100, y: 100, w: 200, h: 100 }} style={{ zIndex: 1 }} data-tick={tick} />
        <Box key="over" id="over" at={{ x: 150, y: 120, w: 200, h: 100 }} style={{ zIndex: 2 }} />
      </SceneLayer>
    )
    const { rerender } = render(view(1))
    const check = () => {
      expect(entity('under').style).toMatchObject({ position: 'absolute', left: '100px', top: '100px', width: '200px', height: '100px', zIndex: '1' })
      expect(entity('over').style).toMatchObject({ position: 'absolute', left: '150px', top: '120px', zIndex: '2' })
    }
    check()
    rerender(view(2))
    check()
    const layer = document.querySelector<HTMLElement>('[data-presentation-scene-layer]')!
    expect(layer.style).toMatchObject({ position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%' })
  })
})

describe('primitive hooks', () => {
  it('every primitive exposes identity hooks and passes class, style, and data through', () => {
    render(
      <SceneLayer>
        <Box key="b" id="b" className="c-b" style={{ outline: '1px solid red' }} data-x="1" Icon={Camera}>box</Box>
        <Label key="l" id="l" className="c-l" data-x="2">label</Label>
        <SymbolChip key="s" id="s" className="c-s" data-x="3" symbol="?" />
        <Frame key="f" id="f" className="c-f" data-x="4" />
        <Arrow key="a" id="a" className="c-a" data-x="5" from={[0, 0]} to={[50, 50]} bidirectional />
        <Emphasis className="c-e" data-x="6">em</Emphasis>
      </SceneLayer>,
    )
    const nodes: Record<string, string> = { b: 'box', l: 'label', s: 'symbol-chip', f: 'frame', a: 'arrow' }
    Object.entries(nodes).forEach(([id, kind], i) => {
      const element = entity(id)
      expect(element.getAttribute('data-presentation-node')).toBe(kind)
      expect(element.className).toBe(`c-${id}`)
      expect(element.getAttribute('data-x')).toBe(String(i + 1))
    })
    expect(entity('b').style.outline).toBe('1px solid red')
    expect(entity('f').style.pointerEvents).toBe('none')
    const em = document.querySelector('[data-presentation-node="emphasis"]')!
    expect(em.className).toBe('c-e')
    expect(em.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(screen.getByText('?').hasAttribute('data-presentation-symbol')).toBe(true)
  })

  it('renders a supplied Lucide glyph as a component, and none when omitted', () => {
    render(
      <>
        <Box id="with" Icon={Camera}>named</Box>
        <Box id="without">plain</Box>
      </>,
    )
    expect(entity('with').querySelector('svg[data-presentation-glyph]')).not.toBeNull()
    expect(entity('with').textContent).toBe('named')
    expect(entity('with').getAttribute('data-presentation-entity')).toBe('with')
    expect(entity('without').querySelector('svg')).toBeNull()
  })

  it('draws arrows between their points, curved when a control point is given', () => {
    render(
      <>
        <Arrow id="line" from={[10, 10]} to={[110, 10]} />
        <Arrow id="curve" from={[0, 0]} via={[50, 100]} to={[100, 0]} />
      </>,
    )
    expect(entity('line').querySelector('svg > path')!.getAttribute('d')).toMatch(/^M .* L /)
    expect(entity('curve').querySelector('svg > path')!.getAttribute('d')).toMatch(/^M .* Q /)
    expect(entity('line').querySelectorAll('marker')).toHaveLength(1)
  })

  it('has no inline visual styling beyond geometry', () => {
    render(
      <SceneLayer>
        <Box key="b" id="b" at={{ x: 1, y: 2, w: 3, h: 4 }} />
        <Frame key="f" id="f" at={{ x: 1, y: 2, w: 3, h: 4 }} />
      </SceneLayer>,
    )
    for (const id of ['b', 'f']) {
      const names = Array.from(entity(id).style)
      expect(names.filter((n) => !['position', 'left', 'top', 'width', 'height', 'pointer-events'].includes(n))).toEqual([])
    }
  })
})

describe('grouped scenes', () => {
  interface State { n: number }
  const mounts = { count: 0 }
  function Counting({ payload }: SceneProps<State>) {
    const [own] = useState(() => payload.n)
    useEffect(() => {
      mounts.count += 1
    }, [])
    return (
      <SceneLayer>
        <Box key="e" id="e" data-initial-payload={own}>n={payload.n}</Box>
      </SceneLayer>
    )
  }
  function Other({ payload }: SceneProps<State>) {
    return <p>other {payload.n}</p>
  }
  const step = (id: string, n: number, groupKey: string | undefined, Scene: Step<State>['Scene']): Step<State> => ({
    id, era: 'e', title: id, caption: id, groupKey, Scene, payload: { n },
  })
  const press = (key: string) =>
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    })

  it('updates a shared-group Scene in place and remounts when group, Scene, or grouping changes', () => {
    mounts.count = 0
    const steps = [
      step('a', 1, 'g', Counting),
      step('b', 2, 'g', Counting),
      step('c', 3, 'h', Counting),
      step('d', 4, 'h', Other),
      step('e', 5, undefined, Counting),
      step('f', 6, undefined, Counting),
    ]
    render(<Presentation steps={steps} title="T" />)
    expect(mounts.count).toBe(1)
    const node = entity('e')
    press('ArrowRight')
    expect(mounts.count).toBe(1)
    expect(entity('e')).toBe(node)
    expect(entity('e').textContent).toBe('n=2')
    expect(entity('e').getAttribute('data-initial-payload')).toBe('1')
    press('ArrowRight')
    expect(mounts.count).toBe(2)
    expect(entity('e').getAttribute('data-initial-payload')).toBe('3')
    press('ArrowRight')
    expect(screen.getByText('other 4')).toBeTruthy()
    press('ArrowRight')
    expect(mounts.count).toBe(3)
    press('ArrowRight')
    expect(mounts.count).toBe(4)
  })
})

describe('stage geometry', () => {
  function stubSize(width: number, height: number) {
    return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const sized = this.hasAttribute('data-presentation-stage')
      return { x: 0, y: 0, left: 0, top: 0, right: sized ? width : 0, bottom: sized ? height : 0, width: sized ? width : 0, height: sized ? height : 0, toJSON() {} }
    })
  }
  const canvas = () => document.querySelector<HTMLElement>('[data-presentation-canvas]')!

  it('renders a fixed 880 x 380 canvas scaled uniformly, constant across steps, recomputed on resize and mode', () => {
    const spy = stubSize(1000, 800)
    const steps = makeSteps(3)
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    expect(canvas().style.height).toBe(`${DESIGN_H}px`)
    const scale = Number(canvas().getAttribute('data-presentation-scale'))
    expect(scale).toBeCloseTo(952 / 880, 6)
    expect(canvas().style.transform).toContain(`scale(${scale})`)
    rerender(<Stage steps={steps} index={2} mode="browse" />)
    expect(Number(canvas().getAttribute('data-presentation-scale'))).toBe(scale)
    spy.mockRestore()

    const resized = stubSize(500, 800)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(Number(canvas().getAttribute('data-presentation-scale'))).toBeCloseTo(452 / 880, 6)
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    resized.mockRestore()

    const wide = stubSize(1000, 800)
    rerender(<Stage steps={steps} index={2} mode="present" />)
    expect(Number(canvas().getAttribute('data-presentation-scale'))).toBeCloseTo(968 / 880, 6)
    wide.mockRestore()
  })

  it('remounts the layout group on a mode switch instead of morphing between scales', () => {
    const steps = makeSteps(2)
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    const group = document.querySelector('[data-m-layout-group]')
    rerender(<Stage steps={steps} index={0} mode="present" />)
    expect(document.querySelector('[data-m-layout-group]')).not.toBe(group)
  })

  it('supports raw motion elements with a stable layoutId inside a scene', async () => {
    const { motion } = await import('motion/react')
    function Raw({ payload }: SceneProps<{ x: number }>) {
      return <motion.div layoutId="raw" data-presentation-entity="raw" style={{ left: payload.x }} />
    }
    const steps: Step<{ x: number }>[] = [0, 80].map((x, i) => ({
      id: `r${i}`, era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: Raw, payload: { x },
    }))
    const { rerender } = render(<Stage steps={steps} index={0} mode="browse" />)
    const node = entity('raw')
    expect(node.getAttribute('data-m-layout-id')).toBe('raw')
    rerender(<Stage steps={steps} index={1} mode="browse" />)
    expect(entity('raw')).toBe(node)
    expect(node.style.left).toBe('80px')
  })
})
