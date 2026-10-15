import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Box, Frame, Label, SymbolChip } from '../presentation-kit'

afterEach(cleanup)

describe('node identity', () => {
  it.each([
    ['box', <Box id="a" {...({ 'data-presentation-id': 'x' } as object)} />],
    ['label', <Label id="a" {...({ 'data-presentation-id': 'x' } as object)} />],
    ['frame', <Frame id="a" {...({ 'data-presentation-id': 'x' } as object)} />],
    ['symbol-chip', <SymbolChip id="a" symbol="s" {...({ 'data-presentation-id': 'x' } as object)} />],
  ])('%s keeps its data-presentation-id when callers pass an override', (node, element) => {
    const { container } = render(element)
    const el = container.querySelector(`[data-presentation-node="${node}"]`)
    expect(el?.getAttribute('data-presentation-id')).toBe('a')
  })
})
