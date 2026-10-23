import { StrictMode, useEffect, type ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AnimatePresence, motion } from 'motion/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  Appear,
  Box,
  computeFitScale,
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  MIN_SCALE,
  Presentation,
  sceneKey,
  STAGE_LAYOUT,
  type SceneProps,
  type Step,
} from '../../src/presentation-kit/index.ts'
import { Demo, demoSteps, mountLog, OtherScene, resetMountLog, type DemoPayload } from './helpers.tsx'

const next = () => act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
const scenes = () => document.querySelectorAll('[data-presentation-scene]')

beforeEach(resetMountLog)

describe('canvas and fit scaling', () => {
  it('defaults to 880 x 380 with separate per-mode geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(STAGE_LAYOUT.browse).not.toEqual(STAGE_LAYOUT.present)
    render(<Demo />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
  })

  it('honors a caller canvas override', () => {
    render(<Demo canvas={{ width: 400, height: 200 }} />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([canvas.style.width, canvas.style.height]).toEqual(['400px', '200px'])
  })

  it('computes one uniform min-ratio scale per mode with a MIN_SCALE floor', () => {
    const { insetX: bx, insetY: by } = STAGE_LAYOUT.browse
    const wide = computeFitScale({ width: 1760 + 2 * bx, height: 2000 }, 'browse')
    expect(wide).toBeCloseTo(2)
    const tall = computeFitScale({ width: 2000, height: 190 + 2 * by }, 'browse')
    expect(tall).toBeCloseTo(0.5)
    expect(computeFitScale({ width: 10, height: 10 }, 'present')).toBe(MIN_SCALE)
    const a = computeFitScale({ width: 1200, height: 700 }, 'browse')
    const b = computeFitScale({ width: 1200, height: 700 }, 'present')
    expect(b).toBeLessThanOrEqual(a)
    expect(computeFitScale({ width: 880, height: 380 }, 'browse', { width: 440, height: 190 })).toBeGreaterThan(1)
  })

  it('changes the transform on window resize and mode change, never on step navigation, chrome re-wrapping or inner geometry', () => {
    const size = { width: 1000, height: 600 }
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function () {
      return this.hasAttribute('data-presentation-stage') ? ({ ...size, x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0 } as DOMRect) : original.call(this)
    }
    try {
      render(<Demo />)
      const canvas = () => document.querySelector('[data-presentation-canvas]') as HTMLElement
      const transform = () => canvas().style.transform
      const t0 = transform()
      expect(t0).toContain('scale(')
      for (let i = 0; i < 4; i++) {
        next()
        expect(transform()).toBe(t0)
        expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
      }
      act(() => void (size.height = 300)) // the stage area shrinks without a window resize (e.g. a caption wraps)
      next()
      expect(transform()).toBe(t0)
      act(() => {
        size.height = 600
        size.width = 500
        window.dispatchEvent(new Event('resize'))
      })
      const t1 = transform()
      expect(t1).not.toBe(t0)
      expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
      fireEvent.keyDown(window, { key: 'p' })
      expect(transform()).not.toBe(t1)
      expect(canvas().getAttribute('data-presentation-scale')).toBe(String(computeFitScale(size, 'present')))
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
    }
  })
})

describe('grouped scenes', () => {
  it('keeps one scene instance within a group and only swaps the payload', () => {
    const { unmount } = render(
      <StrictMode>
        <Demo />
      </StrictMode>,
    )
    const entity = screen.getByTestId('entity')
    const scene = scenes()[0]
    const baseline = mountLog.mounts
    next()
    expect(screen.getByTestId('entity')).toBe(entity)
    expect(scenes()).toHaveLength(1)
    expect(scenes()[0]).toBe(scene)
    expect(entity.textContent).toBe('B')
    expect(mountLog.payloads.at(-1)).toBe('B')
    expect(mountLog.mounts).toBe(baseline)
    unmount()
  })

  it('morphs position, size, label in place: same element, updated state', () => {
    render(<Demo />)
    const entity = screen.getByTestId('entity')
    expect(entity.style.left).toBe('0px')
    expect(entity.style.width).toBe('40px')
    next()
    expect(screen.getByTestId('entity')).toBe(entity)
    expect(entity.style.left).toBe('50px')
    expect(entity.style.width).toBe('90px')
    expect(entity.textContent).toBe('B')
  })

  it('gives continuing entities a shared layoutId inside a common LayoutGroup', () => {
    const calls: string[] = []
    function Probe({ payload }: SceneProps<{ on: boolean }>) {
      calls.push(String(payload.on))
      return <Box id="shared" data-testid="shared">x</Box>
    }
    const mk = (id: string, groupKey: string, on: boolean): Step<{ on: boolean }> => ({ id, era: 'e', title: id, caption: id, Scene: Probe, groupKey, payload: { on } })
    render(<Presentation title="t" steps={[mk('a', 'g1', true), mk('b', 'g2', false)]} />)
    expect(document.querySelector('[data-presentation-entity="shared"]')).not.toBeNull()
    next()
    // across groups: the outgoing scene is retained while the incoming one mounts; both carry the same entity id
    expect(document.querySelectorAll('[data-presentation-entity="shared"]')).toHaveLength(2)
  })

  it('remounts and cross-fades when the group or the Scene changes', async () => {
    let mounts = 0
    function Plain({ payload }: SceneProps<DemoPayload>) {
      useEffect(() => {
        mounts++
      }, [])
      return <div data-testid="plain">{payload.label}</div>
    }
    const mk = (id: string, groupKey: string, Scene: Step<DemoPayload>['Scene']): Step<DemoPayload> => ({ ...demoSteps[0], id, groupKey, Scene, payload: { label: id, x: 0 } })
    const steps = [mk('p1', 'g', Plain), mk('p2', 'g', Plain), mk('p3', 'other', Plain), mk('p4', 'other', OtherScene)]
    render(<Presentation steps={steps} title="t" />)
    const baseline = mounts
    next() // same group + Scene: payload only
    expect(mounts).toBe(baseline)
    expect(scenes()).toHaveLength(1)
    next() // same Scene, different groupKey: remount with a cross-fade
    expect(mounts).toBe(baseline + 1)
    expect(scenes()).toHaveLength(2) // outgoing retained until its exit completes
    expect(Number((scenes()[1] as HTMLElement).style.opacity)).toBeLessThan(1)
    await waitFor(() => expect(scenes()).toHaveLength(1))
    expect(screen.getByTestId('plain').textContent).toBe('p3')
    next() // same groupKey, different Scene: remount again
    expect(scenes()).toHaveLength(2)
    await waitFor(() => expect(scenes()).toHaveLength(1))
    expect(screen.getByTestId('other').textContent).toBe('p4')
  })

  it('keys by group + scene identity, and by step id when ungrouped', () => {
    const Scene = () => null
    const Other = () => null
    expect(sceneKey({ id: 'a', groupKey: 'g', Scene })).toBe(sceneKey({ id: 'b', groupKey: 'g', Scene }))
    expect(sceneKey({ id: 'a', groupKey: 'g', Scene })).not.toBe(sceneKey({ id: 'a', groupKey: 'g', Scene: Other }))
    expect(sceneKey({ id: 'a', groupKey: 'g', Scene })).not.toBe(sceneKey({ id: 'a', groupKey: 'h', Scene }))
    expect(sceneKey({ id: 'a', Scene })).not.toBe(sceneKey({ id: 'b', Scene }))
  })

  it('keeps raw motion elements with literal coordinates and layoutId intact across payload updates', () => {
    function Raw({ payload }: SceneProps<{ x: number }>): ReactNode {
      return <motion.div layoutId="raw" data-testid="raw" style={{ position: 'absolute', left: payload.x, top: 7 }} />
    }
    const steps: Step<{ x: number }>[] = [1, 2].map((x) => ({ id: `r${x}`, era: 'e', title: 't', caption: 'c', Scene: Raw, groupKey: 'raw', payload: { x: x * 100 } }))
    render(<Presentation steps={steps} title="t" />)
    const el = screen.getByTestId('raw')
    expect(el.style.left).toBe('100px')
    next()
    expect(screen.getByTestId('raw')).toBe(el)
    expect(el.style.left).toBe('200px')
    expect(el.style.top).toBe('7px')
  })
})

describe('entering and departing entities', () => {
  function Toggle({ payload }: SceneProps<{ show: boolean }>) {
    return (
      <div>
        <Box id="stays" data-testid="stays">
          stays
        </Box>
        <AnimatePresence>
          {payload.show ? (
            <Appear key="newcomer" data-testid="newcomer">
              <Box id="newcomer">new</Box>
            </Appear>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
  const steps: Step<{ show: boolean }>[] = [false, true, false].map((show, i) => ({ id: `t${i}`, era: 'e', title: 't', caption: 'c', Scene: Toggle, groupKey: 'toggle', payload: { show } }))

  it('sequences newcomers after persisting entities settle', async () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    render(<Presentation steps={steps} title="t" />)
    const stays = screen.getByTestId('stays')
    next()
    const wrapper = screen.getByTestId('newcomer')
    expect(screen.getByTestId('stays')).toBe(stays)
    expect(wrapper.style.opacity).toBe('0')
    await new Promise((r) => setTimeout(r, 250))
    expect(Number(wrapper.style.opacity)).toBeLessThan(0.05) // still waiting for the delay
    await waitFor(() => expect(Number(wrapper.style.opacity)).toBe(1), { timeout: 4000 })
  })

  it('adds an extra sequencing delay on top of the settle delay', async () => {
    function Late() {
      return <Appear data-testid="late" delay={0.8}>x</Appear>
    }
    render(<Presentation title="t" steps={[{ id: 'l', era: 'e', title: 't', caption: 'c', Scene: Late }]} />)
    const late = screen.getByTestId('late')
    await new Promise((r) => setTimeout(r, (ENTER_DELAY + 0.3) * 1000))
    expect(Number(late.style.opacity)).toBeLessThan(0.05)
    await waitFor(() => expect(Number(late.style.opacity)).toBe(1), { timeout: 4000 })
  })

  it('keeps a departing entity until its exit completes, then unmounts it', async () => {
    render(<Presentation steps={steps} title="t" />)
    next()
    await waitFor(() => expect(Number(screen.getByTestId('newcomer').style.opacity)).toBe(1), { timeout: 4000 })
    act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    const leaving = screen.queryByTestId('newcomer')
    expect(leaving).not.toBeNull() // still present while it animates out
    await waitFor(() => expect(screen.queryByTestId('newcomer')).toBeNull(), { timeout: 3000 })
    expect(screen.getByTestId('stays')).not.toBeNull()
  })

  it('does not replay the newcomer fade for continuing entities', async () => {
    render(<Presentation steps={steps} title="t" />)
    next()
    await waitFor(() => expect(Number(screen.getByTestId('newcomer').style.opacity)).toBe(1), { timeout: 4000 })
    const wrapper = screen.getByTestId('newcomer')
    const stays = screen.getByTestId('stays')
    expect(stays.closest('[data-presentation-appear]')).toBeNull() // continuing entity has no newcomer wrapper
    act(() => void fireEvent.keyDown(window, { key: 'ArrowLeft' }))
    act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    expect(screen.getByTestId('stays')).toBe(stays)
    expect(stays.style.opacity).not.toBe('0')
    expect(wrapper.isConnected || screen.queryByTestId('newcomer') !== null).toBe(true)
  })
})
