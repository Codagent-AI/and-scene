import { StrictMode, useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { act, render, renderHook, waitFor } from '@testing-library/react'
import {
  Appear, Box, ENTER_DELAY, ENTER_T, LAYOUT_T, Presentation, SceneLayer,
  type SceneProps, type Step,
} from '../../src/presentation-kit'
import {
  buildEntrance, EntityRegistry, EntityRegistryContext, useEntrance,
} from '../../src/presentation-kit/entrance'
import type { ReactNode } from 'react'
import { currentIndex, press, setViewport } from './helpers'

interface Payload {
  boxes: Array<{ id: string; x: number; w?: number; label?: string; emphasis?: boolean }>
}

const counts = { mounts: 0 }

function GroupScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    counts.mounts++
  }, [])
  return (
    <SceneLayer>
      {payload.boxes.map((b) => (
        <Box key={b.id} id={b.id} x={b.x} y={10} w={b.w ?? 50} h={20} emphasis={b.emphasis}>
          {b.label ?? b.id}
        </Box>
      ))}
    </SceneLayer>
  )
}

function OtherScene(props: SceneProps<Payload>) {
  return <GroupScene {...props} />
}

const step = (id: string, boxes: Payload['boxes'], extra: Partial<Step<Payload>> = {}): Step<Payload> => ({
  id, era: 'e', title: id, caption: id, groupKey: 'g', Scene: GroupScene, payload: { boxes }, ...extra,
})

const entity = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)
const next = () => act(() => void press('ArrowRight'))

function mountDeck(steps: Step<Payload>[], strict = false) {
  setViewport(1280, 800)
  counts.mounts = 0
  const deck = <Presentation steps={steps} title="deck" />
  return render(strict ? <StrictMode>{deck}</StrictMode> : deck)
}

describe('grouped scenes persist', () => {
  const grouped = [
    step('a', [{ id: 'x', x: 10 }]),
    step('b', [{ id: 'x', x: 200, w: 90, label: 'moved', emphasis: true }, { id: 'y', x: 300 }]),
  ]

  it('keeps one scene instance and the same entity node while the payload changes', () => {
    mountDeck(grouped)
    const node = entity('x')!
    const baseline = counts.mounts
    next()
    expect(currentIndex()).toBe(1)
    expect(counts.mounts).toBe(baseline)
    expect(entity('x')).toBe(node)
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
    // payload reached the existing entity: position, size, label and emphasis changed in place
    expect(node.style.left).toBe('200px')
    expect(node.style.width).toBe('90px')
    expect(node.textContent).toBe('moved')
    expect(node.getAttribute('data-presentation-emphasis')).toBe('true')
  })

  it('does not remount after StrictMode baseline replay', () => {
    mountDeck(grouped, true)
    const baseline = counts.mounts
    expect(baseline).toBe(2) // StrictMode double-invokes the mount effect
    const node = entity('x')!
    next()
    expect(counts.mounts).toBe(baseline)
    expect(entity('x')).toBe(node)
  })

  it.each([
    ['a different groupKey', { groupKey: 'other' }],
    ['a different Scene component', { Scene: OtherScene }],
    ['no grouping', { groupKey: undefined }],
  ])('does not reuse the instance for %s', (_name, change) => {
    mountDeck([grouped[0], { ...grouped[1], ...change }])
    const node = entity('x')!
    const baseline = counts.mounts
    next()
    expect(counts.mounts).toBe(baseline + 1)
    const all = Array.from(document.querySelectorAll('[data-presentation-entity="x"]'))
    expect(all).toHaveLength(2) // outgoing node still exiting, plus a fresh one
    expect(all).toContain(node)
  })
})

describe('ungrouped steps cross-fade with shared layout identity', () => {
  const ungrouped = [
    step('a', [{ id: 'x', x: 10 }, { id: 'gone', x: 100 }], { groupKey: undefined }),
    step('b', [{ id: 'x', x: 300 }, { id: 'fresh', x: 400 }], { groupKey: undefined }),
  ]

  it('overlaps outgoing and incoming scenes under one stage (no wait mode)', async () => {
    mountDeck(ungrouped)
    next()
    // both scenes exist at once, each holding the shared entity id
    const scenes = document.querySelectorAll('[data-presentation-scene]')
    expect(scenes).toHaveLength(2)
    expect(document.querySelectorAll('[data-presentation-entity="x"]')).toHaveLength(2)
    expect(document.querySelectorAll('[data-presentation-stage]')).toHaveLength(1)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1), { timeout: 3000 })
  })

  it('does not fade a continuing id in but fades a new id in', () => {
    mountDeck(ungrouped)
    next()
    const incoming = document.querySelector('[data-presentation-scene="b"]')!
    const continuing = incoming.querySelector<HTMLElement>('[data-presentation-entity="x"]')!
    const fresh = incoming.querySelector<HTMLElement>('[data-presentation-entity="fresh"]')!
    expect(continuing.style.opacity).not.toBe('0')
    expect(fresh.style.opacity).toBe('0')
  })
})

describe('entrance sequencing', () => {
  it('delays newcomers until after the layout transition of persisting entities', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const entering = buildEntrance(false, true)
    expect(entering.initial).toEqual({ opacity: 0 })
    expect(entering.animate.transition.delay).toBe(ENTER_DELAY)
    expect(entering.animate.transition.duration).toBe(ENTER_T)
    expect(entering.exit.opacity).toBe(0)
  })

  it('gives continuing ids no entrance and the first step no delay', () => {
    const continuing = buildEntrance(true, true)
    expect(continuing.initial).toBe(false)
    expect(continuing.animate.transition.delay).toBe(0)
    expect(buildEntrance(false, false).animate.transition.delay).toBe(0)
  })

  const withRegistry = (registry: EntityRegistry) => ({ children }: { children: ReactNode }) => (
    <EntityRegistryContext.Provider value={registry}>{children}</EntityRegistryContext.Provider>
  )

  it('decides once per mount from what is already on stage, never replaying on updates', () => {
    const registry = new EntityRegistry()
    registry.add('x')
    const { result, rerender } = renderHook(({ id }) => useEntrance(id), {
      initialProps: { id: 'x' },
      wrapper: withRegistry(registry),
    })
    expect(result.current.initial).toBe(false)
    const first = result.current
    rerender({ id: 'x' })
    expect(result.current).toBe(first)

    const fresh = renderHook(() => useEntrance('new'), { wrapper: withRegistry(registry) })
    expect(fresh.result.current.initial).toEqual({ opacity: 0 })
    expect(fresh.result.current.animate.transition.delay).toBe(ENTER_DELAY)
  })

  it('tracks mounted ids symmetrically through unmount', () => {
    const registry = new EntityRegistry()
    const { unmount } = renderHook(() => useEntrance('a'), { wrapper: withRegistry(registry) })
    expect(registry.has('a')).toBe(true)
    unmount()
    expect(registry.has('a')).toBe(false)
  })

  it('a newcomer in a grouped scene starts hidden; continuing nodes are never hidden by updates', () => {
    mountDeck([
      step('a', [{ id: 'x', x: 10 }]),
      step('b', [{ id: 'x', x: 20 }, { id: 'new', x: 90 }]),
    ])
    const node = entity('x')!
    const opacities: string[] = []
    const observer = new MutationObserver(() => opacities.push(node.style.opacity))
    observer.observe(node, { attributes: true, attributeFilter: ['style'] })
    next()
    expect(entity('new')!.style.opacity).toBe('0')
    expect(opacities).not.toContain('0')
    observer.disconnect()
  })

  it('Appear wraps arbitrary children with the same newcomer rules', () => {
    const registry = new EntityRegistry()
    const { container } = render(
      <EntityRegistryContext.Provider value={registry}>
        <Appear id="q">hello</Appear>
      </EntityRegistryContext.Provider>,
    )
    const el = container.querySelector<HTMLElement>('[data-presentation-appear="q"]')!
    expect(el.textContent).toBe('hello')
    expect(el.style.opacity).toBe('0')
  })
})

describe('departing entities', () => {
  const scenes = [
    step('a', [{ id: 'x', x: 10 }, { id: 'leaving', x: 100 }]),
    step('b', [{ id: 'x', x: 10 }]),
  ]

  it('keeps a removed entity while it exits, then removes it (grouped)', async () => {
    mountDeck(scenes)
    next()
    expect(entity('leaving')).not.toBeNull() // exit in progress
    await waitFor(() => expect(entity('leaving')).toBeNull(), { timeout: 3000 })
    expect(entity('x')).not.toBeNull()
  })

  it('removes the outgoing scene after its exit when steps are ungrouped', async () => {
    mountDeck([{ ...scenes[0], groupKey: undefined }, { ...scenes[1], groupKey: undefined }])
    next()
    expect(entity('leaving')).not.toBeNull()
    await waitFor(() => expect(entity('leaving')).toBeNull(), { timeout: 3000 })
  })
})

describe('intentional composition', () => {
  it('keeps overlapping layers absolutely positioned with unchanged neighbour geometry', () => {
    const overlapping = (x: number): Payload['boxes'] => [
      { id: 'under', x: 40 }, { id: 'over', x },
    ]
    mountDeck([step('a', overlapping(60)), step('b', overlapping(60))])
    const under = entity('under')!
    const over = entity('over')!
    expect(under.style.position).toBe('absolute')
    expect(over.style.position).toBe('absolute')
    expect(over.style.left).toBe('60px')
    expect(under.style.left).toBe('40px')
    expect(over.compareDocumentPosition(under) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy() // stack order kept
    next()
    expect([under.style.left, over.style.left]).toEqual(['40px', '60px'])
    expect(entity('under')).toBe(under)
  })

  it('SceneLayers are absolute layers so one never reflows another', () => {
    const { container } = render(
      <>
        <SceneLayer data-testid="l1" />
        <SceneLayer data-testid="l2" />
      </>,
    )
    for (const layer of container.querySelectorAll<HTMLElement>('[data-presentation-scene-layer]')) {
      expect(layer.style.position).toBe('absolute')
    }
  })
})
