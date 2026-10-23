import { act, fireEvent, render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Appear, Box, Presentation, SceneLayer, sceneKey, type SceneProps } from '../../../src/presentation-kit/index.ts'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T, STAGE_LAYOUT } from '../../../src/presentation-kit/constants.ts'
import { makeSteps, setViewport, TextScene, type Payload } from '../helpers/fixtures.tsx'
import { motionOf } from '../helpers/motionMock.tsx'

vi.mock('motion/react', async () => (await import('../helpers/motionMock.tsx')).motionModule)

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

describe('grouped scenes (L-7, C-1)', () => {
  function counted() {
    const log = { mounts: 0, unmounts: 0 }
    function Counted({ payload }: SceneProps<Payload>) {
      useEffect(() => {
        log.mounts++
        return () => void log.unmounts++
      }, [])
      return <div data-testid="scene">n={payload.n}</div>
    }
    return { log, Counted }
  }

  it('updates one scene instance in place within a group', () => {
    const { log, Counted } = counted()
    const { getByTestId } = render(<Presentation steps={makeSteps(4, Counted)} title="T" />)
    const first = getByTestId('scene')
    key('ArrowRight')
    key('ArrowRight')
    expect(getByTestId('scene')).toBe(first)
    expect(getByTestId('scene').textContent).toBe('n=3')
    key('ArrowLeft')
    expect(getByTestId('scene').textContent).toBe('n=2')
    expect(log).toEqual({ mounts: 1, unmounts: 0 })
  })

  it('remounts across groups with presence configured for enter and exit', () => {
    const { log, Counted } = counted()
    const steps = makeSteps(3, Counted).map((s, i) => ({ ...s, groupKey: i < 2 ? 'a' : 'b' }))
    const { container } = render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    expect(log.mounts).toBe(1)
    key('ArrowRight')
    expect(log.mounts).toBe(2)
    const scene = container.querySelector('[data-presentation-scene]')!
    const m = motionOf(scene) as { initial: object; animate: object; exit: object }
    expect(m.initial).toEqual({ opacity: 0 })
    expect(m.animate).toEqual({ opacity: 1 })
    expect(m.exit).toEqual({ opacity: 0 })
    expect(container.querySelector('[data-mock-presence]')).not.toBeNull()
  })

  it('replaces the scene when the group key is kept but the Scene component changes', () => {
    const a = counted()
    const b = counted()
    const steps = [...makeSteps(2, a.Counted), ...makeSteps(2, b.Counted).map((s, i) => ({ ...s, id: `x${i}` }))]
    render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    expect(a.log).toEqual({ mounts: 1, unmounts: 0 })
    key('ArrowRight')
    expect(a.log.unmounts).toBe(1)
    expect(b.log.mounts).toBe(1)
  })

  it('derives scene keys from group + Scene, or from the step id when ungrouped', () => {
    const steps = makeSteps(2)
    expect(sceneKey(steps[0])).toBe(sceneKey(steps[1]))
    expect(sceneKey({ ...steps[0], groupKey: undefined })).not.toBe(sceneKey({ ...steps[1], groupKey: undefined }))
    expect(sceneKey(steps[0])).not.toBe(sceneKey({ ...steps[0], Scene: () => null }))
  })
})

describe('stage geometry (L-25, L-26, C-2)', () => {
  it('lays out the default 880x380 canvas with a uniform scale', () => {
    setViewport(1280, 720)
    const { container } = render(<Presentation steps={makeSteps(2)} title="T" />)
    const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect(canvas.style.width).toBe(`${DESIGN_W}px`)
    expect(canvas.style.height).toBe(`${DESIGN_H}px`)
    expect(canvas.style.scale).not.toBe('')
    expect(canvas.style.scale).not.toContain(' ')
    expect(motionOf(canvas).layoutRoot).toBe(true)
  })

  it('keeps the same scale across steps and recomputes on resize', () => {
    setViewport(1280, 720)
    const { container } = render(<Presentation steps={makeSteps(3)} title="T" />)
    const scale = () => container.querySelector<HTMLElement>('[data-presentation-canvas]')!.style.scale
    const first = scale()
    key('ArrowRight')
    key('ArrowRight')
    expect(scale()).toBe(first)
    act(() => setViewport(700, 720))
    expect(scale()).not.toBe(first)
    expect(Number(scale())).toBeLessThan(Number(first))
  })

  it('uses mode-specific reservations and rerenders (no morph) on mode switch', () => {
    setViewport(1280, 720)
    const { container } = render(<Presentation steps={makeSteps(2)} title="T" />)
    const stage = () => container.querySelector<HTMLElement>('[data-presentation-stage]')!
    expect(stage().style.bottom).toBe(`${STAGE_LAYOUT.browse.bottom}px`)
    expect(stage().style.left).toBe(`${STAGE_LAYOUT.browse.side}px`)
    key('p')
    expect(stage().style.bottom).toBe(`${STAGE_LAYOUT.present.bottom}px`)
    expect(stage().style.left).toBe('0px')
    expect(container.querySelector('[data-presentation-canvas]')!.getAttribute('data-layout-id')).toBeNull()
  })

  it('honours a design override', () => {
    const { container } = render(<Presentation steps={makeSteps(2)} title="T" design={{ width: 400, height: 200 }} />)
    expect(container.querySelector<HTMLElement>('[data-presentation-canvas]')!.style.width).toBe('400px')
  })

  it('wraps the scene in a LayoutGroup', () => {
    const { container } = render(<Presentation steps={makeSteps(2)} title="T" />)
    expect(container.querySelector('[data-mock-layout-group] [data-presentation-scene]')).not.toBeNull()
  })

  it('isolates each SceneLayer so adding one cannot reflow another (C-2)', () => {
    const { container, rerender } = render(
      <div>
        <SceneLayer data-testid="a"><Box rect={{ x: 5, y: 6, w: 7, h: 8 }} /></SceneLayer>
      </div>,
    )
    const box = container.querySelector<HTMLElement>('[data-presentation-box]')!
    const before = box.style.cssText
    rerender(
      <div>
        <SceneLayer data-testid="a"><Box rect={{ x: 5, y: 6, w: 7, h: 8 }} /></SceneLayer>
        <SceneLayer data-testid="b"><Box rect={{ x: 1, y: 1, w: 1, h: 1 }} /></SceneLayer>
      </div>,
    )
    const layers = container.querySelectorAll<HTMLElement>('[data-presentation-scene-layer]')
    expect(layers).toHaveLength(2)
    for (const layer of layers) {
      expect(layer.style.position).toBe('absolute')
      expect(layer.style.left).toBe('0px')
      expect(layer.style.top).toBe('0px')
      expect(layer.style.width).toBe('100%')
    }
    expect(container.querySelector<HTMLElement>('[data-presentation-box]')!.style.cssText).toBe(before)
  })
})

describe('entities (L-4, L-5, L-6, L-8)', () => {
  it('forwards a stable layoutId and layout projection on Box', () => {
    const { container, rerender } = render(
      <SceneLayer><Box key="e" layoutId="e" rect={{ x: 0, y: 0, w: 10, h: 10 }}>A</Box></SceneLayer>,
    )
    const el = container.querySelector('[data-presentation-box]')!
    expect(el.getAttribute('data-layout-id')).toBe('e')
    expect(motionOf(el).layout).toBe(true)
    rerender(<SceneLayer><Box key="e" layoutId="e" rect={{ x: 50, y: 40, w: 90, h: 70 }}>B</Box></SceneLayer>)
    const after = container.querySelector<HTMLElement>('[data-presentation-box]')!
    expect(after).toBe(el)
    expect(after.textContent).toBe('B')
    expect(after.style).toMatchObject({ left: '50px', top: '40px', width: '90px', height: '70px' })
    expect(after.getAttribute('data-layout-id')).toBe('e')
  })

  it('delays newcomers until after the layout move and exits them symmetrically', () => {
    const { container } = render(<Appear data-testid="a" />)
    const m = motionOf(container.querySelector('[data-presentation-appear]')!) as {
      initial: { opacity: number }
      animate: { opacity: number; transition: { delay: number; duration: number } }
      exit: { opacity: number; transition: { duration: number } }
    }
    expect(m.initial.opacity).toBe(0)
    expect(m.animate.opacity).toBe(1)
    expect(m.animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(m.animate.transition.delay).toBe(ENTER_DELAY)
    expect(m.animate.transition.duration).toBe(ENTER_T)
    expect(m.exit).toEqual({ opacity: 0, transition: { duration: ENTER_T } })
  })

  it('applies the entrance only to entities that are new at a step', () => {
    function Scene({ payload }: SceneProps<{ ids: string[] }>) {
      return (
        <SceneLayer>
          {payload.ids.map((id) => (
            <Appear key={id} data-id={id}>
              <Box layoutId={id}>{id}</Box>
            </Appear>
          ))}
        </SceneLayer>
      )
    }
    const mk = (ids: string[], i: number) => ({
      id: `s${i}`, era: 'e', title: 't', caption: 'c', Scene, payload: { ids }, groupKey: 'g',
    })
    const steps = [mk(['a', 'b'], 0), mk(['a', 'b', 'c'], 1), mk(['a', 'c'], 2)]
    const { container } = render(<Presentation steps={steps} title="T" />)
    const node = (id: string) => container.querySelector<HTMLElement>(`[data-id="${id}"]`)
    const a = node('a')!
    const b = node('b')!
    key('ArrowRight')
    expect(node('a')).toBe(a) // continuing entities are not remounted, so not re-faded
    expect(node('b')).toBe(b)
    const c = node('c')!
    expect(c).not.toBeNull()
    expect(c.getAttribute('data-layout-id')).toBeNull()
    expect(motionOf(c).initial).toEqual({ opacity: 0 })
    expect(c.querySelector('[data-presentation-box]')!.getAttribute('data-layout-id')).toBe('c')
  })

  it('keeps presence-managed children under SceneLayer', () => {
    const { container } = render(<SceneLayer><Appear key="x" /></SceneLayer>)
    expect(container.querySelector('[data-presentation-scene-layer] > [data-mock-presence] [data-presentation-appear]')).not.toBeNull()
  })

  it('keeps TextScene fixture usable', () => {
    expect(TextScene).toBeTypeOf('function')
  })
})
