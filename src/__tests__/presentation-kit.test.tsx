import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'
import type { TouchEvent } from 'react'
import { usePresentationNav } from '../presentation-kit/usePresentationNav'
import { Presentation } from '../presentation-kit/Presentation'
import { DESIGN_H, DESIGN_W } from '../presentation-kit/constants'
import { calculateFitScale } from '../presentation-kit/useFitScale'
import { resolvePresentation, presentations } from '../presentations'
import type { Scene, Step } from '../presentation-kit/types'

type Payload = { value: number }
function ExampleScene({ payload }: { payload: Payload }) { return <div data-value={payload.value} /> }
const typedScene: Scene<Payload> = ExampleScene
const typedSteps: Step<Payload>[] = [
  { id: 'one', era: 'opening', title: 'One', caption: 'First', diagram: { scene: typedScene, groupKey: 'shared', payload: { value: 1 } } },
  { id: 'two', era: 'opening', title: 'Two', caption: 'Second', diagram: { scene: typedScene, groupKey: 'shared', payload: { value: 2 } } },
]

describe('presentation kit contracts', () => {
  it('supports a strongly typed grouped payload at the Presentation boundary', () => {
    render(<Presentation steps={typedSteps} title="Typed" />)
    expect(screen.getByText('One')).toBeInTheDocument()
  })

  it('keeps a grouped scene instance mounted while its payload changes', async () => {
    let mounts = 0
    function MountScene({ payload }: { payload: Payload }) { useEffect(() => { mounts += 1 }, []); return <output>{payload.value}</output> }
    const steps: Step<Payload>[] = typedSteps.map((step) => ({ ...step, diagram: { ...step.diagram, scene: MountScene } }))
    const { container } = render(<Presentation steps={steps} title="Grouped" />)
    fireEvent.click(within(container).getByRole('button', { name: 'Go to step 2' }))
    await waitFor(() => expect(within(container).getByText('2', { selector: 'output' })).toBeInTheDocument())
    expect(mounts).toBe(1)
  })

  it('navigates by supported keys, clamps, preserves index on mode toggle, and guards controls', () => {
    const { result } = renderHook(() => usePresentationNav(2))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(result.current.index).toBe(0)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'PageDown' })
    expect(result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'p' })
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowLeft' })
    expect(result.current.index).toBe(1)
    input.remove()
    fireEvent.keyDown(window, { key: 'PageUp' })
    expect(result.current.index).toBe(0)
    fireEvent.keyDown(window, { key: ' ' })
    expect(result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'p' })
    expect(result.current.mode).toBe('browse')
  })

  it('uses horizontal touch swipes and clamps direct jumps', () => {
    const { result } = renderHook(() => usePresentationNav(2))
    const handlers = result.current.touchHandlers
    act(() => {
      handlers.onTouchStart({ touches: [{ clientX: 160 } as Touch] } as unknown as TouchEvent)
      handlers.onTouchEnd({ changedTouches: [{ clientX: 90 } as Touch] } as unknown as TouchEvent)
    })
    expect(result.current.index).toBe(1)
    act(() => {
      handlers.onTouchStart({ touches: [{ clientX: 90 } as Touch] } as unknown as TouchEvent)
      handlers.onTouchEnd({ changedTouches: [{ clientX: 160 } as Touch] } as unknown as TouchEvent)
    })
    expect(result.current.index).toBe(0)
    act(() => result.current.jumpTo(9))
    expect(result.current.index).toBe(1)
  })

  it('uses explicit registry lookup and supports empty landing state', () => {
    expect(presentations).toEqual([])
    expect(resolvePresentation('missing')).toBeUndefined()
  })

  it('fits the fixed design canvas uniformly', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(calculateFitScale(440, 380)).toBe(0.5)
  })

  it('exposes default attribution and does not add a default brand link', () => {
    render(<Presentation steps={typedSteps} title="Attribution" />)
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(attribution).toHaveAttribute('data-presentation-attribution')
    expect(screen.queryByRole('link', { name: 'and-scene' })).not.toBeInTheDocument()
  })
})
