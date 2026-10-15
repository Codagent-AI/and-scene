import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { Box, Frame, Label, Presentation, SymbolChip, type Step } from '../presentation-kit'
import { ExitScene } from './fixtures'

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

describe('departing entities', () => {
  const steps = [
    { id: 'in', era: 'E', title: 'In', caption: 'c', Scene: ExitScene, payload: { show: true }, groupKey: 'g' },
    { id: 'out', era: 'E', title: 'Out', caption: 'c', Scene: ExitScene, payload: { show: false }, groupKey: 'g' },
  ] satisfies Step<{ show: boolean }>[]

  it('animates a removed entity out instead of unmounting it immediately', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 1400, configurable: true })
    const { container } = render(<Presentation steps={steps} title="T" />)
    const node = () => container.querySelector('[data-presentation-id="exit-node"]')
    expect(node()).not.toBeNull()
    act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    expect(node(), 'entity is removed with no exit animation').not.toBeNull()
    await waitFor(() => expect(node()).toBeNull(), { timeout: 3000 })
  })
})
