// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SceneProps } from '../../src/presentation-kit/index.ts'
import { captured, resetCaptured } from '../support/motionMock.tsx'

vi.mock('motion/react', async () => (await import('../support/motionMock.tsx')).motionMock)

const kit = await import('../../src/presentation-kit/index.ts')
const { Appear, Box, EASE, ENTER_DELAY, ENTER_T, LAYOUT_T, SceneLayer, Stage } = kit
const { SampleScene } = await import('../../src/presentations/how-to-make-a-presentation/SampleScene.tsx')
const { ENTITIES, entitiesAt } = await import('../../src/presentations/how-to-make-a-presentation/entities.ts')

type Payload = { stage: number; moved: boolean }

describe('persisting entities morph in place (M-04)', () => {
  function MorphScene({ payload }: SceneProps<Payload>) {
    const { moved } = payload
    return (
      <SceneLayer>
        <Box
          key="e"
          id="entity-1"
          x={moved ? 300 : 10}
          y={moved ? 200 : 20}
          w={moved ? 120 : 60}
          h={moved ? 90 : 40}
          label={moved ? 'after' : 'before'}
          data-emphasis={moved ? 'on' : 'off'}
        />
      </SceneLayer>
    )
  }
  const step = (moved: boolean) => ({ id: `s${moved}`, era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: MorphScene, payload: { stage: 1, moved } })

  it('keeps the node and layoutId while position, size, label and emphasis change, with kit transition wiring', () => {
    resetCaptured()
    const view = render(<Stage step={step(false)} index={0} mode="browse" />)
    const node = () => view.container.querySelector('[data-presentation-box]') as HTMLElement
    const before = node()
    expect(before.getAttribute('data-layout-id')).toBe('entity-1')
    expect([before.style.left, before.style.top, before.style.width, before.style.height]).toEqual(['10px', '20px', '60px', '40px'])
    view.rerender(<Stage step={step(true)} index={1} mode="browse" />)
    const after = node()
    expect(after).toBe(before) // same DOM node: projected, not remounted
    expect(after.getAttribute('data-layout-id')).toBe('entity-1')
    expect(after.getAttribute('data-layout')).toBe('true')
    expect([after.style.left, after.style.top, after.style.width, after.style.height]).toEqual(['300px', '200px', '120px', '90px'])
    expect(after.textContent).toBe('after')
    expect(after.getAttribute('data-emphasis')).toBe('on')
    expect(after.closest('[data-mock-layout-group]')).not.toBeNull() // shared LayoutGroup ancestry
    const boxProps = captured.filter((c) => c.props['data-presentation-box'] !== undefined).at(-1)!.props
    expect(boxProps.transition).toEqual({ layout: { duration: LAYOUT_T, ease: EASE } })
  })

  it('wires the scene cross-fade through the Stage AnimatePresence wrapper', () => {
    resetCaptured()
    render(<Stage step={step(false)} index={0} mode="browse" />)
    const wrapper = captured.find((c) => c.props['data-presentation-scene'] !== undefined)!.props
    expect(wrapper.initial).toEqual({ opacity: 0 })
    expect(wrapper.exit).toMatchObject({ opacity: 0 })
  })
})

describe('Appear (M-05, M-08)', () => {
  it('fades in after the layout morph using the kit delay, duration and easing, and fades out on exit', () => {
    resetCaptured()
    render(
      <Appear>
        <i />
      </Appear>,
    )
    const props = captured.find((c) => c.props['data-presentation-appear'] !== undefined)!.props as {
      initial: { opacity: number }
      animate: { opacity: number; transition: { delay: number; duration: number; ease: unknown } }
      exit: { opacity: number }
    }
    expect(props.initial.opacity).toBe(0)
    expect(props.animate.transition).toEqual({ delay: ENTER_DELAY, duration: ENTER_T, ease: EASE })
    expect(props.animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(props.exit.opacity).toBe(0)
  })

  it('lets a caller override the delay', () => {
    resetCaptured()
    render(<Appear delay={2}>x</Appear>)
    expect(captured[0].props.animate).toMatchObject({ transition: { delay: 2 } })
  })
})

describe('sample scene: continuing entities are not re-wrapped as newcomers (M-08)', () => {
  const scene = (stage: number) => (
    <SampleScene payload={{ stage }} step={{ id: 's', era: 'e', title: 't', caption: 'c' }} index={stage - 1} mode="browse" />
  )
  const nodes = (container: HTMLElement) =>
    new Map(Array.from(container.querySelectorAll('[data-presentation-entity]')).map((e) => [e.getAttribute('data-presentation-entity')!, e]))

  it.each([
    [3, 4],
    [6, 7],
  ])('stage %i -> %i keeps every existing node and adds a wrapper only for new entities', (from, to) => {
    const view = render(scene(from))
    const before = nodes(view.container)
    const wrappersBefore = Array.from(view.container.querySelectorAll('[data-presentation-appear]'))
    view.rerender(scene(to))
    const after = nodes(view.container)
    for (const [id, el] of before) expect(after.get(id), id).toBe(el)
    const added = [...after.keys()].filter((id) => !before.has(id))
    expect(added.sort()).toEqual(ENTITIES.filter((e) => e.since > from && e.since <= to).map((e) => e.id).sort())
    const wrappersAfter = Array.from(view.container.querySelectorAll('[data-presentation-appear]'))
    expect(wrappersAfter).toHaveLength(entitiesAt(to).length)
    for (const wrapper of wrappersBefore) expect(wrappersAfter).toContain(wrapper) // not recreated
  })

  it('also handles a direct jump forwards and backwards', () => {
    const view = render(scene(2))
    view.rerender(scene(8))
    expect(nodes(view.container).size).toBe(entitiesAt(8).length)
    view.rerender(scene(2))
    expect(nodes(view.container).size).toBe(entitiesAt(2).length)
  })
})

describe('intentional composition and raw motion elements (M-09, M-12)', () => {
  it('keeps literal coordinates and stacking of overlapping layers when another layer mounts', async () => {
    const { motion } = await import('motion/react')
    const Raw = motion.div as unknown as React.ElementType
    const Scene = ({ extra }: { extra: boolean }) => (
      <>
        <SceneLayer>
          <Box key="a" id="a" x={100} y={50} w={200} h={80} style={{ zIndex: 2, transform: 'rotate(3deg)' }} />
          <Raw key="raw" layoutId="raw-1" layout style={{ position: 'absolute', left: 120, top: 60, width: 50, height: 50 }} data-raw="" />
        </SceneLayer>
        {extra ? (
          <SceneLayer key="second">
            <Box id="b" x={110} y={55} w={200} h={80} />
          </SceneLayer>
        ) : null}
      </>
    )
    const Wrapper = ({ payload }: SceneProps<{ extra: boolean }>) => <Scene extra={payload.extra} />
    const step = (extra: boolean) => ({ id: 's', era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: Wrapper, payload: { extra } })
    const view = render(<kit.Stage step={step(false)} index={0} mode="browse" />)
    const a = () => view.container.querySelector('[data-presentation-entity="a"]') as HTMLElement
    const snapshot = () => [a().style.left, a().style.top, a().style.width, a().style.height, a().style.zIndex, a().style.transform, a().style.position]
    const before = snapshot()
    expect(before).toEqual(['100px', '50px', '200px', '80px', '2', 'rotate(3deg)', 'absolute'])
    view.rerender(<kit.Stage step={step(true)} index={1} mode="browse" />)
    expect(view.container.querySelectorAll('[data-presentation-scene-layer]')).toHaveLength(2)
    expect(snapshot()).toEqual(before) // mounting a second, overlapping layer leaves the first untouched
    // a layer is absolutely positioned, so mounting another never reflows it
    for (const layer of view.container.querySelectorAll<HTMLElement>('[data-presentation-scene-layer]')) expect(layer.style.position).toBe('absolute')
    const raw = view.container.querySelector('[data-raw]') as HTMLElement
    expect(raw.getAttribute('data-layout-id')).toBe('raw-1')
    expect(raw.closest('[data-mock-layout-group]')).toBe(a().closest('[data-mock-layout-group]'))
    expect([raw.style.left, raw.style.top, raw.style.width, raw.style.height]).toEqual(['120px', '60px', '50px', '50px'])
  })

  it('never rewrites coordinates: author style wins and values pass through unchanged', () => {
    const view = render(<Box id="z" x={1.5} y={-7} w={33} h={0.5} style={{ left: 99 }} />)
    const el = view.container.firstElementChild as HTMLElement
    expect([el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['99px', '-7px', '33px', '0.5px'])
  })
})
