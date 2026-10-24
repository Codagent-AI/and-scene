import { render } from '@testing-library/react'
import { createElement, forwardRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

// Replace motion elements with plain ones that expose the `layoutId` they were
// given, so we can assert every primitive carries its entity identity.
vi.mock('motion/react', () => {
  const make = (tag: string) =>
    forwardRef<Element, Record<string, unknown>>((props, ref) => {
      const { layoutId, layout, initial, animate, exit, transition, ...rest } = props
      void [layout, initial, animate, exit, transition]
      return createElement(tag, { ...rest, 'data-layout-id': layoutId as string, ref })
    })
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }),
    AnimatePresence: ({ children }: { children: unknown }) => children,
  }
})

const { Arrow } = await import('./Arrow')
const { Box } = await import('./Box')
const { Emphasis } = await import('./Emphasis')
const { Frame } = await import('./Frame')
const { Label } = await import('./Label')
const { SymbolChip } = await import('./SymbolChip')

describe('shared entity identity', () => {
  it('every primitive passes its id to motion as the layoutId', () => {
    const { container } = render(
      <>
        <Box id="box" x={0} y={0} />
        <Label id="label" x={0} y={0} />
        <SymbolChip id="chip" x={0} y={0} />
        <Frame id="frame" x={0} y={0} />
        <Emphasis id="emph" x={0} y={0} />
        <Arrow id="arrow" from={[0, 0]} to={[10, 10]} />
      </>,
    )
    for (const id of ['box', 'label', 'chip', 'frame', 'emph', 'arrow']) {
      expect(container.querySelector(`[data-presentation-id="${id}"]`)?.getAttribute('data-layout-id'), id).toBe(id)
    }
  })
})
