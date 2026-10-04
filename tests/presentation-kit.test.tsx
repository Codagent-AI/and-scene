import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Box } from '../src/presentation-kit/nodes/Box'
import type { SceneProps, Step } from '../src/presentation-kit/types'
import { getFitScale } from '../src/presentation-kit/useFitScale'

interface Payload { count: number; label: string }
let mounts = 0
function Scene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mounts += 1 }, [])
  return <div data-testid="scene"><span>{payload.label}</span><span>{payload.count}</span><Box id="shared">entity</Box></div>
}
const steps: Step<Payload>[] = [
  { id: 'one', section: 'Start', title: 'First', caption: 'First caption', groupKey: 'g', Scene, payload: { count: 1, label: 'one' } },
  { id: 'two', section: 'Middle', title: 'Second', caption: 'Second caption', groupKey: 'g', Scene, payload: { count: 2, label: 'two' } },
]

let host: HTMLDivElement
let root: Root
function render(ui: React.ReactNode) { act(() => root.render(ui)) }
function key(key: string, modifiers: KeyboardEventInit = {}) { act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers }))) }

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host); mounts = 0
})
afterEach(() => { act(() => root.unmount()); host.remove() })

describe('scene kit contract', () => {
  it('preserves strongly typed payloads at the Presentation boundary', () => {
    const typed: Step<Payload>[] = steps
    render(<Presentation<Payload> steps={typed} title="Typed" />)
    expect(host.textContent).toContain('one')
  })

  it('keeps kit primitives style neutral while exposing styling hooks', () => {
    render(<Box id="sample" className="local-style" style={{ left: 12 }}>unstyled</Box>)
    const node = host.querySelector('[data-presentation-box]')
    expect(node?.getAttribute('class')).toContain('local-style')
    expect(node?.getAttribute('data-presentation-entity')).toBe('sample')
    expect(node?.getAttribute('style')).toContain('left: 12px')
    expect(node?.getAttribute('style')).not.toMatch(/color|background|border|shadow|font/i)
  })

  it('renders default attribution without default brand and exposes active navigation semantics', () => {
    render(<Presentation steps={steps} title="Sample" />)
    expect(host.querySelector('[data-presentation-attribution]')?.textContent).toBe('made by and-scene')
    expect(host.querySelector('[data-presentation-attribution]')?.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(host.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    expect(host.querySelector('[data-presentation-progress-item][aria-current="step"]')).not.toBeNull()
    expect(host.querySelector('[data-presentation-toc-item][aria-current="location"]')).not.toBeNull()
  })

  it('clamps navigation, supports direct jumps and modes, and preserves grouped scenes', () => {
    render(<Presentation steps={steps} title="Sample" />)
    expect(host.querySelector('[data-step-count]')?.getAttribute('data-step-count')).toBe('2')
    key('ArrowLeft')
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    act(() => (host.querySelectorAll('[data-presentation-progress-item]')[1] as HTMLButtonElement).click())
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(host.textContent).toContain('two')
    expect(mounts).toBe(1)
    key('p')
    expect(host.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(host.querySelector('[data-presentation-caption]')).toBeNull()
    key('p')
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    key('ArrowRight')
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  })

  it('preserves browser shortcuts with modifier keys and clamps if the step list shrinks', () => {
    render(<Presentation steps={steps} title="Sample" />)
    key('ArrowRight', { altKey: true })
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    act(() => (host.querySelectorAll('[data-presentation-progress-item]')[1] as HTMLButtonElement).click())
    render(<Presentation steps={steps.slice(0, 1)} title="Sample" />)
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('does not let focused controls also trigger deck navigation', () => {
    render(<Presentation steps={steps} title="Sample" />)
    const button = host.querySelector('[data-presentation-next]') as HTMLButtonElement
    act(() => { button.focus(); button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })) })
    expect(host.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('fits the fixed canvas uniformly and defaults to 880 by 380', () => {
    expect(getFitScale(1000, 700, 'browse')).toBe(1)
    expect(getFitScale(500, 400, 'browse')).toBeCloseTo(Math.min((500 - 96) / 880, (400 - 264) / 380))
  })
})
