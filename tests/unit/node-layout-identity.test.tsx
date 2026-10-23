import { createElement, forwardRef } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Replace motion elements with plain ones that expose the layout props they received.
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const motion = new Proxy({}, {
    get: (_target, tag: string) =>
      forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
        const { layoutId, layout, ...rest } = props
        for (const key of ['initial', 'animate', 'exit', 'transition']) delete rest[key]
        return createElement(tag, { ...rest, ref, 'data-layout-id': layoutId as string | undefined, 'data-layout': layout ? 'true' : undefined })
      }),
  })
  return { ...actual, motion }
})

const { Arrow, Box, Emphasis, Frame, Label, SymbolChip } = await import('../../src/presentation-kit/index.ts')

describe('identity-bearing nodes forward their id as layoutId', () => {
  it.each([
    ['Box', (id: string) => <Box id={id} />],
    ['Label', (id: string) => <Label id={id} />],
    ['Frame', (id: string) => <Frame id={id} />],
    ['Emphasis', (id: string) => <Emphasis id={id} />],
    ['SymbolChip', (id: string) => <SymbolChip id={id} />],
    ['Arrow', (id: string) => <Arrow id={id} from={[0, 0]} to={[5, 5]} />],
  ])('%s', (_name, make) => {
    const { container } = render(make('shared-id'))
    expect((container.firstElementChild as HTMLElement).getAttribute('data-layout-id')).toBe('shared-id')
  })
})
