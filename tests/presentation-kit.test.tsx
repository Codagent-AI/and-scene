// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation, fitScale, usePresentationNav, type SceneProps, type Step } from '../src/presentation-kit'

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
    unmount()
  })

  it('provides structural hooks without requiring kit-owned visual styles', () => {
    const markup = renderToStaticMarkup(createElement(Presentation<Payload>, { steps, title: 'Typed scene', attribution: false }))
    expect(markup).toContain('data-presentation-stage')
    expect(markup).toContain('data-presentation-canvas')
    expect(markup).not.toContain('data-presentation-attribution')
  })
})
