// @vitest-environment jsdom
import { createElement, useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation, fitScale, usePresentationNav, type SceneProps, type Step } from '../src/presentation-kit'
import { Box, SceneLayer } from '../src/presentation-kit'
import { safeDecodePathSegment } from '../src/routeUtils'
import { safeDecodePathSegment as bootstrapSafeDecodePathSegment } from '../skills/presentation/templates/bootstrap/src/routeUtils'

type Payload = { count: number; labels: string[] }
function TypedScene({ payload }: SceneProps<Payload>) {
  return createElement('div', { 'data-count': payload.count }, payload.labels.join(','))
}
const steps: Step<Payload>[] = [
  { id: 'one', section: 'Start', title: 'First', caption: 'First caption', scene: TypedScene, groupKey: 'shared', payload: { count: 1, labels: ['a'] } },
  { id: 'two', section: 'Build', title: 'Second', caption: 'Second caption', scene: TypedScene, groupKey: 'shared', payload: { count: 2, labels: ['a', 'b'] } },
]

describe('presentation kit contracts', () => {
  it('accepts strongly typed grouped payloads at the Presentation boundary', () => {
    const markup = renderToStaticMarkup(createElement(Presentation<Payload>, { steps, title: 'Typed scene' }))
    expect(markup).toContain('data-count="1"')
    expect(markup).toContain('made by and-scene')
    expect(markup).toContain('href="https://github.com/and-scene/and-scene"')
    expect(markup).not.toContain('data-presentation-brand><a')
  })

  it('falls back safely when a route contains malformed percent encoding', () => {
    expect(safeDecodePathSegment('%E0%A4%A')).toBe('')
    expect(safeDecodePathSegment('%')).toBe('')
    expect(safeDecodePathSegment('how-to')).toBe('how-to')
    expect(bootstrapSafeDecodePathSegment('%E0%A4%A')).toBe('')
    expect(bootstrapSafeDecodePathSegment('how-to')).toBe('how-to')
  })

  it('exposes active state semantics on step progress and section navigation', () => {
    const markup = renderToStaticMarkup(createElement(Presentation<Payload>, { steps, title: 'Typed scene' }))
    expect(markup).toContain('data-step-count="2"')
    expect(markup).toContain('data-step-index="0"')
    expect(markup).toContain('aria-current="step"')
    expect(markup).toContain('aria-current="location"')
    expect(markup).toContain('data-presentation-active="true"')
  })

  it('fits a fixed 880 by 380 canvas uniformly in both modes', () => {
    expect(fitScale(1000, 800, 'browse')).toBe(1)
    expect(fitScale(500, 700, 'present')).toBeCloseTo(452 / 880)
    expect(fitScale(100, 100, 'browse')).toBeGreaterThan(0)
  })

  it('clamps navigation, switches modes without moving, and leaves focused controls alone', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(2))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })))
    expect(result.current.index).toBe(0)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(result.current.index).toBe(1)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(result.current.index).toBe(1)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true })))
    expect(result.current.mode).toBe('present')
    expect(result.current.index).toBe(1)
    const input = document.createElement('input')
    document.body.append(input)
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })))
    expect(result.current.index).toBe(1)
    input.remove()
    const nextButton = document.createElement('button')
    document.body.append(nextButton)
    act(() => nextButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })))
    expect(result.current.index).toBe(0)
    act(() => nextButton.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))
    expect(result.current.index).toBe(0)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true })))
    expect(result.current.mode).toBe('present')
    nextButton.remove()
    unmount()
  })

  it('keeps grouped scenes and continuing entities mounted while groups remount', async () => {
    let mounts = 0
    function StatefulScene({ payload }: SceneProps<Payload>) {
      useEffect(() => { mounts += 1 }, [])
      return <SceneLayer>
        <Box key="kept" id="kept" label="Persistent entity">Persistent {payload.count}</Box>
        {payload.count === 1 ? <Box key="leaving" id="leaving">Leaving</Box> : <Box key="entering" id="entering">Entering</Box>}
      </SceneLayer>
    }
    const grouped: Step<Payload>[] = steps.map((step) => ({ ...step, scene: StatefulScene }))
    const view = render(<Presentation steps={grouped} title="Continuity" />)
    expect(mounts).toBe(1)
    expect(screen.getByText('Persistent 1')).toBeTruthy()
    expect(screen.getByLabelText('Persistent entity')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(await screen.findByText('Persistent 2')).toBeTruthy()
    expect(screen.getByText('Entering')).toBeTruthy()
    expect(mounts).toBe(1)
    await waitFor(() => expect(screen.queryByText('Leaving')).toBeNull(), { timeout: 5000 })
    expect(view.container.querySelectorAll('[data-scene-entity="kept"]')).toHaveLength(1)

    const newGroup = grouped.map((step, index) => index === 1 ? { ...step, groupKey: 'new-group' } : step)
    view.rerender(<Presentation steps={newGroup} title="Continuity" />)
    expect(mounts).toBe(2)
  })

  it('provides structural hooks without requiring kit-owned visual styles', () => {
    const markup = renderToStaticMarkup(createElement(Presentation<Payload>, { steps, title: 'Typed scene', attribution: false }))
    expect(markup).toContain('data-presentation-stage')
    expect(markup).toContain('data-presentation-canvas')
    expect(markup).not.toContain('data-presentation-attribution')
  })
})
