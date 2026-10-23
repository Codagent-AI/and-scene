import { act, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { useEffect, useState, type ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import {
  Appear,
  Box,
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  ENTER_T,
  LAYOUT_T,
  MIN_SCALE,
  Presence,
  Presentation,
  SceneLayer,
  Stage,
  STAGE_LAYOUT,
  computeFitScale,
  type SceneProps,
  type Step,
} from '../../src/presentation-kit'
import { availableSpace } from '../../src/presentation-kit/useFitScale'
import { key, makeSteps, setViewport } from './helpers'

const read = (f: string) => readFileSync(`src/presentation-kit/${f}`, 'utf8')
let mounts = 0

interface P { n: number; x: number; label: string; hot?: boolean }
function Counting({ payload }: SceneProps<P>) {
  const [id] = useState(() => ++mounts)
  const [clicks, setClicks] = useState(0)
  useEffect(() => void 0, [])
  return (
    <SceneLayer>
      <button data-testid="local" onClick={() => setClicks((c) => c + 1)}>{clicks}</button>
      <span data-testid="mount">{id}</span>
      <Box entity="e" data-testid="box" data-hot={payload.hot ? 'yes' : 'no'} at={{ x: payload.x, y: 5, w: 40 + payload.x, h: 20 }}>
        {payload.label}
      </Box>
    </SceneLayer>
  )
}
function Other({ payload }: SceneProps<P>) {
  return <Box entity="e" data-testid="box" at={{ x: payload.x, y: 5, w: 10, h: 10 }}>{payload.label}</Box>
}
const step = (id: string, p: P, Scene: ComponentType<SceneProps<P>>, groupKey?: string): Step<P> => ({
  id, era: 'e', title: id, caption: id, Scene, groupKey, payload: p,
})
const hosts = () => document.querySelectorAll('[data-presentation-scene-host]')

function mountDeck(steps: Step<P>[]) {
  setViewport(1200)
  mounts = 0
  return render(<Presentation steps={steps} title="d" />)
}

describe('grouped scenes persist (L-4, L-7, I-5)', () => {
  const a = step('a', { n: 1, x: 10, label: 'first', hot: false }, Counting, 'g')
  const b = step('b', { n: 2, x: 200, label: 'second', hot: true }, Counting, 'g')

  it('keeps one instance, DOM node and local state while geometry, label and emphasis morph in place', () => {
    mountDeck([a, b])
    const box = screen.getByTestId('box')
    const host = hosts()[0]
    act(() => screen.getByTestId('local').click())
    key('ArrowRight')
    expect(screen.getByTestId('box')).toBe(box)
    expect(hosts()).toHaveLength(1)
    expect(hosts()[0]).toBe(host)
    expect(screen.getByTestId('mount').textContent).toBe('1')
    expect(screen.getByTestId('local').textContent).toBe('1')
    expect(mounts).toBe(1)
    expect(box.textContent).toBe('second')
    expect(box.getAttribute('data-hot')).toBe('yes')
    expect(box.style.left).toBe('200px')
    expect(box.getAttribute('data-presentation-entity')).toBe('e')
  })

  it('remounts and cross-fades when only the group changes', async () => {
    mountDeck([a, step('c', { n: 3, x: 50, label: 'third' }, Counting, 'other')])
    const first = hosts()[0] as HTMLElement
    key('ArrowRight')
    expect(mounts).toBe(2)
    expect(hosts()).toHaveLength(2)
    expect(first.isConnected).toBe(true)
    const incoming = [...hosts()].find((h) => h !== first) as HTMLElement
    expect(incoming.style.opacity).toBe('0')
    await waitFor(() => expect(hosts()).toHaveLength(1), { timeout: 3000 })
    expect(first.isConnected).toBe(false)
    await waitFor(() => expect(incoming.style.opacity).toBe('1'), { timeout: 3000 })
  })

  it('remounts when only the Scene component changes, keeping the shared entity id on both sides', () => {
    mountDeck([a, step('d', { n: 4, x: 90, label: 'other scene' }, Other, 'g')])
    key('ArrowRight')
    expect(mounts).toBe(1)
    expect(hosts()).toHaveLength(2)
    const entities = [...document.querySelectorAll('[data-presentation-entity="e"]')]
    expect(entities).toHaveLength(2)
    // Exit completion under shared layoutIds needs real layout, so it is asserted in the browser-backed suite.
  })

  it('wires shared-layout projection, presence and exit configuration in the kit sources', () => {
    const stage = read('Stage.tsx')
    expect(stage).toMatch(/<LayoutGroup>[\s\S]*<AnimatePresence[\s\S]*<motion\.div[\s\S]*exit=\{\{ opacity: 0 \}\}/)
    expect(stage).toMatch(/initial=\{\{ opacity: 0 \}\}[\s\S]*animate=\{\{ opacity: 1 \}\}[\s\S]*transition=\{\{ duration: ENTER_T/)
    for (const f of ['Box', 'Label', 'Arrow', 'Frame', 'Emphasis', 'SymbolChip']) {
      const src = read(`nodes/${f}.tsx`)
      expect(src).toMatch(/\blayout\b/)
      expect(src).toMatch(/layoutId=\{entity\}/)
      expect(src).toMatch(/duration: LAYOUT_T/)
    }
  })
})

describe('newcomers, continuing and departing entities (L-5, L-6, L-8, I-4, I-6)', () => {
  function Story({ payload }: SceneProps<{ n: number }>) {
    return (
      <SceneLayer>
        <Box entity="old" data-testid="old" at={{ x: 10, y: 10, w: 50, h: 20 }} />
        <Presence>
          {payload.n >= 2 && (
            <Appear key="new" data-testid="new-group">
              <Box entity="new" data-testid="new" at={{ x: 100, y: 10, w: 50, h: 20 }} />
            </Appear>
          )}
        </Presence>
      </SceneLayer>
    )
  }
  const steps: Step<{ n: number }>[] = [1, 2, 3].map((n) => ({ id: `s${n}`, era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: Story, payload: { n: n === 3 ? 1 : n } }))

  it('uses a settle delay of at least the layout time before newcomers fade in', async () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
    setViewport(1200)
    render(<Presentation steps={steps} title="d" />)
    const old = screen.getByTestId('old')
    key('ArrowRight')
    const group = screen.getByTestId('new-group')
    expect(group.style.opacity).toBe('0')
    await new Promise((r) => setTimeout(r, 150))
    expect(group.style.opacity).toBe('0')
    await waitFor(() => expect(Number(group.style.opacity)).toBe(1), { timeout: 4000 })
    expect(screen.getByTestId('old')).toBe(old)
  })

  it('never resets the continuing entity to a newcomer fade, going forward or back', async () => {
    setViewport(1200)
    render(<Presentation steps={steps} title="d" />)
    const old = screen.getByTestId('old')
    const seen: string[] = []
    const watch = new MutationObserver(() => seen.push(old.style.opacity))
    watch.observe(old, { attributes: true })
    key('ArrowRight')
    key('ArrowLeft')
    key('ArrowRight')
    await new Promise((r) => setTimeout(r, 100))
    watch.disconnect()
    expect(old.isConnected).toBe(true)
    expect(screen.getByTestId('old')).toBe(old)
    expect(seen.filter((o) => o !== '' && o !== '1')).toEqual([])
    expect(old.closest('[data-presentation-appear]')).toBeNull()
  })

  it('keeps a departing entity in the DOM while it exits, then removes it', async () => {
    setViewport(1200)
    render(<Presentation steps={steps} title="d" />)
    key('ArrowRight')
    await waitFor(() => expect(screen.getByTestId('new-group').style.opacity).toBe('1'), { timeout: 4000 })
    const leaving = screen.getByTestId('new-group')
    key('ArrowRight')
    expect(leaving.isConnected).toBe(true)
    await waitFor(() => expect(leaving.isConnected).toBe(false), { timeout: 4000 })
    expect(screen.getByTestId('old')).toBeTruthy()
  })
})

describe('fixed-canvas fit scaling (L-28, L-29, I-18)', () => {
  it('defaults to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })
  it.each(['browse', 'present'] as const)('computes min(availW/W, availH/H) for %s, floored at MIN_SCALE', (mode) => {
    for (const [w, h] of [[1600, 1200], [600, 1200], [1600, 500], [200, 200]]) {
      const avail = availableSpace(w!, h!, mode)
      const expected = Math.max(MIN_SCALE, Math.min(avail.width / DESIGN_W, avail.height / DESIGN_H))
      expect(computeFitScale(w!, h!, mode)).toBeCloseTo(expected, 10)
    }
    expect(computeFitScale(50, 50, mode)).toBe(MIN_SCALE)
  })
  it('depends on the mode geometry and on explicit canvas dimensions', () => {
    expect(computeFitScale(1600, 700, 'present')).toBeGreaterThan(computeFitScale(1600, 700, 'browse'))
    const big = computeFitScale(1600, 900, 'present', { width: 1760, height: 760 })
    expect(big).toBeCloseTo(computeFitScale(1600, 900, 'present') / 2, 10)
    expect(STAGE_LAYOUT.browse.top).toBeGreaterThan(0)
  })
  it('applies one factor to both axes, is step-independent, recomputes on resize and re-renders on mode change', () => {
    setViewport(1400, 900)
    const steps = makeSteps(3)
    const { container } = render(<Presentation steps={steps} title="d" />)
    const stage = () => container.querySelector('[data-presentation-stage]')!
    const inner = () => container.querySelector('[data-presentation-canvas-inner]') as HTMLElement
    const scale = () => Number(stage().getAttribute('data-presentation-scale'))
    const s0 = scale()
    expect(s0).toBeCloseTo(computeFitScale(1400, 900, 'browse'), 3)
    expect(inner().style.transform).toBe(`scale(${s0})`)
    expect(inner().style.width).toBe('880px')
    expect(inner().style.height).toBe('380px')
    key('ArrowRight')
    key('ArrowRight')
    expect(scale()).toBe(s0)
    setViewport(1000, 600)
    expect(scale()).toBeCloseTo(computeFitScale(1000, 600, 'browse'), 3)
    expect(scale()).not.toBe(s0)
    expect(inner().style.width).toBe('880px')
    const before = scale()
    key('p')
    expect(scale()).toBeCloseTo(computeFitScale(1000, 600, 'present'), 3)
    expect(scale()).not.toBe(before)
  })
  it('lays the canvas out from an override fixture and the stage default', () => {
    setViewport(1400, 900)
    const { container, rerender } = render(<Presentation steps={makeSteps(1)} title="d" />)
    const inner = () => container.querySelector('[data-presentation-canvas-inner]') as HTMLElement
    expect(inner().style.width).toBe('880px')
    rerender(<Presentation steps={makeSteps(1)} title="d" canvas={{ width: 1000, height: 500 }} />)
    expect(inner().style.width).toBe('1000px')
    expect(Number(container.querySelector('[data-presentation-stage]')!.getAttribute('data-presentation-scale'))).toBeCloseTo(
      computeFitScale(1400, 900, 'browse', { width: 1000, height: 500 }),
      3,
    )
  })
  it('renders nothing for an empty step list (Stage)', () => {
    const { container } = render(<Stage steps={[]} index={0} mode="browse" />)
    expect(container.firstChild).toBeNull()
  })
})
