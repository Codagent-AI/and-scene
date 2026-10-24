// Records the motion props each primitive actually receives, which jsdom cannot observe from the DOM.
import { createElement, forwardRef, Fragment, type ReactNode } from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: { layoutId?: string; initial?: unknown; animate?: unknown; parent: Element | null; node: Element }[] = []

vi.mock('motion/react', () => {
  const types: Record<string, ReturnType<typeof make>> = {}
  const make = (tag: string) =>
    forwardRef<Element, Record<string, unknown>>(({ layoutId, initial, animate, children, ...rest }, ref) => {
      const dom = Object.fromEntries(Object.entries(rest).filter(([k]) => !['layout', 'exit', 'transition'].includes(k)))
      return createElement(tag, {
        ...dom,
        ref: (el: Element | null) => {
          if (typeof ref === 'function') ref(el)
          if (el && layoutId) calls.push({ layoutId: layoutId as string, initial, animate, parent: el.parentElement, node: el })
        },
      }, children as ReactNode)
    })
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => (types[tag] ??= make(tag)) }),
    AnimatePresence: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
    LayoutGroup: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
  }
})

const { SampleScene } = await import('../../src/presentations/how-to-make-a-presentation/Scene')
const { STEPS } = await import('../../src/presentations/how-to-make-a-presentation/steps')
const { idsAt } = await import('../../src/presentations/how-to-make-a-presentation/entities')

const props = (beat: number) => ({ payload: { beat }, step: STEPS[beat - 1], index: beat - 1 })
const latest = (id: string) => calls.filter((c) => c.layoutId === id).at(-1)!
beforeEach(() => {
  calls.length = 0
})

describe('continuing entities across grouped steps (recorded motion props)', () => {
  it('keeps the same layoutId, adds no enter behavior, and adds no wrapper when the group advances', () => {
    const { container, rerender } = render(<SampleScene {...props(3)} />)
    const first = latest('card-1')
    expect(first.initial).toEqual({ opacity: 0 })
    const node = first.node
    const parent = first.parent
    calls.length = 0
    rerender(<SampleScene {...props(4)} />)
    const again = calls.filter((c) => c.layoutId === 'card-1')
    expect(again.every((c) => c.layoutId === 'card-1' && c.initial === undefined && c.animate === undefined)).toBe(true)
    expect(container.querySelector('[data-presentation-entity="card-1"]')).toBe(node)
    expect(node.parentElement).toBe(parent)
    expect(parent).toBe(container.querySelector('[data-presentation-layer]'))
  })

  it('gives the beat\'s newcomers enter motion and only them', () => {
    const { rerender } = render(<SampleScene {...props(3)} />)
    calls.length = 0
    rerender(<SampleScene {...props(4)} />)
    for (const id of ['card-2', 'card-3', 'link-2-3']) expect(latest(id).initial, id).toEqual({ opacity: 0 })
    for (const id of ['you', 'tray', 'card-1']) expect(calls.filter((c) => c.layoutId === id).every((c) => c.initial === undefined), id).toBe(true)
  })

  it('treats every entity skipped by a direct jump as a newcomer, and nothing already shown', () => {
    const { rerender } = render(<SampleScene {...props(1)} />)
    calls.length = 0
    rerender(<SampleScene {...props(9)} />)
    const shown = idsAt(1)
    const skipped = idsAt(9).filter((id) => !shown.includes(id))
    expect(skipped.length).toBeGreaterThan(10)
    for (const id of skipped) expect(latest(id).initial, `${id} should enter`).toEqual({ opacity: 0 })
    for (const id of shown) expect(calls.filter((c) => c.layoutId === id).every((c) => c.initial === undefined), id).toBe(true)
  })

  it('keeps every entity mounted when the same beat re-renders', () => {
    const { container, rerender } = render(<SampleScene {...props(2)} />)
    const before = [...container.querySelectorAll('[data-presentation-entity]')]
    rerender(<SampleScene {...props(2)} />)
    const after = [...container.querySelectorAll('[data-presentation-entity]')]
    expect(after).toHaveLength(before.length)
    after.forEach((el, i) => expect(el).toBe(before[i]))
  })

  it('treats nothing as new when navigating backward', () => {
    const { rerender } = render(<SampleScene {...props(9)} />)
    calls.length = 0
    rerender(<SampleScene {...props(4)} />)
    expect(calls.every((c) => c.initial === undefined)).toBe(true)
  })
})
