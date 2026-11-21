// @vitest-environment jsdom
import { act, useEffect } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Appear, Arrow, Box, Emphasis, Frame, Label, Presentation, SceneLayer, SymbolChip } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { ATTRIBUTION_URL, TOC_MEDIA } from '../src/presentation-kit/constants'
import { fitScale } from '../src/presentation-kit/useFitScale'

interface Payload {
  label: string
}

function Scene({ payload }: SceneProps<Payload>) {
  return <div data-fixture-scene>{payload.label}</div>
}

const steps: Step<Payload>[] = [
  { id: 'one', era: 'Ask', title: 'First title', caption: 'First caption.', Scene, payload: { label: 'one' }, groupKey: 'fixture' },
  { id: 'two', era: 'Ask', title: 'Second title', caption: 'Second caption.', Scene, payload: { label: 'two' }, groupKey: 'fixture' },
  { id: 'three', era: 'Build', title: 'Third title', caption: 'Third caption.', Scene, payload: { label: 'three' }, groupKey: 'fixture' },
  { id: 'four', era: 'Build', title: 'Fourth title', caption: 'Fourth caption.', Scene, payload: { label: 'four' }, groupKey: 'fixture' },
]

class WideViewport extends EventTarget {
  matches = true

  setWidth(width: number) {
    this.matches = width >= 900
    this.dispatchEvent(new Event('change'))
  }
}

class StageObserver {
  static current: StageObserver
  element: Element | undefined

  constructor(privateCallback: ResizeObserverCallback) {
    this.callback = privateCallback
    StageObserver.current = this
  }

  private readonly callback: ResizeObserverCallback

  observe(element: Element) {
    this.element = element
  }

  disconnect() {
    this.element = undefined
  }

  emit(width: number, height: number) {
    if (!this.element) throw new Error('The stage has no resize observer')
    const contentRect = new DOMRect(0, 0, width, height)
    this.callback([
      {
        target: this.element,
        contentRect,
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      },
    ], this)
  }

  unobserve() {
    this.element = undefined
  }
}

let container: HTMLDivElement
let root: Root
let viewport: WideViewport

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  viewport = new WideViewport()
  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    expect(query).toBe(TOC_MEDIA)
    return viewport
  }))
  vi.stubGlobal('ResizeObserver', StageObserver)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function render(node: ReactNode = <Presentation steps={steps} title="Fixture" />) {
  return act(() => root.render(node))
}

function hook(name: string) {
  const selector = name ? `[data-presentation-${name}]` : '[data-presentation]'
  return container.querySelector<HTMLElement>(selector)
}

function item(name: string, index: number) {
  const selected = container.querySelectorAll<HTMLButtonElement>(`[data-presentation-${name}]`)[index]
  if (!selected) throw new Error(`Missing ${name} item ${index}`)
  return selected
}

function currentStep() {
  return Number(hook('')?.getAttribute('data-step-index'))
}

async function key(keyName: string, target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true })
  await act(() => { target.dispatchEvent(event) })
  return event
}

function click(element: HTMLElement | null) {
  if (!element) throw new Error('Missing click target')
  return act(() => element.click())
}

async function swipe(endX: number, endY: number, cancel = false) {
  const stage = hook('stage')
  if (!stage) throw new Error('Missing swipe target')
  const start = new Event('touchstart', { bubbles: true })
  const end = new Event('touchend', { bubbles: true })
  Object.defineProperty(start, 'touches', { value: [{ identifier: 1, clientX: 100, clientY: 100 }] })
  Object.defineProperty(end, 'changedTouches', { value: [{ identifier: 1, clientX: endX, clientY: endY }] })
  await act(() => {
    stage.dispatchEvent(start)
    if (cancel) stage.dispatchEvent(new Event('touchcancel', { bubbles: true }))
    stage.dispatchEvent(end)
  })
}

describe('presentation kit', () => {
  it('derives step numbers and active content from the authored order', async () => {
    await render()
    expect(hook('marker')?.textContent).toBe('1 / 4')
    expect(hook('step-title')?.textContent).toBe('First title')
    expect(hook('caption')?.textContent).toBe('First caption.')
    expect(hook('')?.getAttribute('data-presentation-era')).toBe('Ask')
    expect(hook('scene')?.textContent).toBe('one')

    const inserted = { ...steps[0], id: 'intro', title: 'Introduced title', payload: { label: 'inserted' } }
    await render(<Presentation steps={[inserted, steps[3], steps[0]]} title="Fixture" />)
    expect(hook('marker')?.textContent).toBe('1 / 3')
    expect(hook('step-title')?.textContent).toBe('Introduced title')
    await click(item('progress-item', 1))
    expect(hook('marker')?.textContent).toBe('2 / 3')
    expect(hook('step-title')?.textContent).toBe('Fourth title')
    expect(hook('caption')?.textContent).toBe('Fourth caption.')
    expect(hook('')?.getAttribute('data-presentation-era')).toBe('Build')
    expect(hook('scene')?.textContent).toBe('four')
  })

  it('updates the same grouped scene and preserves intentional coordinates', async () => {
    const mount = vi.fn()
    const unmount = vi.fn()
    function Grouped({ payload }: SceneProps<Payload>) {
      useEffect(() => {
        mount()
        return unmount
      }, [])
      return (
        <SceneLayer>
          <Box key="persist" layoutId="persists" style={{ position: 'absolute', left: 20, top: 45, zIndex: 2 }}>
            {payload.label}
          </Box>
          <Box key="stack" layoutId="underlay" style={{ position: 'absolute', left: 20, top: 45, zIndex: 1 }}>
            underneath
          </Box>
        </SceneLayer>
      )
    }
    await render(<Presentation steps={steps.map(step => ({ ...step, Scene: Grouped }))} title="Fixture" />)
    const continuing = hook('box')
    await key('ArrowRight')
    expect(mount).toHaveBeenCalledTimes(1)
    expect(unmount).not.toHaveBeenCalled()
    expect(hook('box')).toBe(continuing)
    expect(continuing?.textContent).toBe('two')
    const boxes = [...container.querySelectorAll<HTMLElement>('[data-presentation-box]')]
    expect(boxes.map(box => [box.style.left, box.style.top, box.style.zIndex])).toEqual([
      ['20px', '45px', '2'], ['20px', '45px', '1'],
    ])
    expect(hook('scene-layer')?.style.position).toBe('absolute')
  })

  it('exposes primitive hooks and passes through authored classes and coordinates', async () => {
    await render(
      <SceneLayer className="layer">
        <Box key="box" layoutId="box" className="authored" data-entity="box" style={{ left: 34, top: 20 }}>box</Box>
        <Label key="label">label</Label>
        <Frame key="frame" />
        <Arrow key="arrow" viewBox="0 0 10 10" />
        <Emphasis key="emphasis" />
        <SymbolChip key="chip">chip</SymbolChip>
        <Appear key="appear" />
      </SceneLayer>,
    )
    const box = hook('box')
    expect(hook('scene-layer')?.className).toBe('layer')
    expect(box?.className).toBe('authored')
    expect(box?.getAttribute('data-entity')).toBe('box')
    expect([box?.style.left, box?.style.top]).toEqual(['34px', '20px'])
    expect([box?.style.background, box?.style.fontFamily, box?.style.border, box?.style.boxShadow]).toEqual(['', '', '', ''])
    for (const name of ['label', 'frame', 'arrow', 'emphasis', 'symbol-chip', 'appear']) {
      expect(hook(name), name).not.toBeNull()
    }
  })

  it('shows linked default attribution and only host-provided header branding', async () => {
    await render()
    const attribution = hook('attribution')
    expect(attribution?.tagName).toBe('A')
    expect(attribution?.getAttribute('href')).toBe(ATTRIBUTION_URL)
    expect(attribution?.textContent).toBe('made by and-scene')
    expect(attribution?.parentElement?.style.justifySelf).toBe('end')
    expect(attribution?.parentElement?.style.alignSelf).toBe('end')
    expect(hook('brand')).toBeNull()

    await render(<Presentation steps={steps} title="Fixture" brand={<a href="/">Host brand</a>} />)
    expect(hook('brand')?.querySelector('a')?.textContent).toBe('Host brand')
  })

  it('renders browse and present chrome, honors the initial mode, keeps the step on toggle, and hides narrow TOC', async () => {
    await render(<Presentation steps={steps} title="Fixture" initialMode="present" />)
    expect(hook('')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(hook('marker')).not.toBeNull()
    expect(hook('step-title')?.textContent).toBe('First title')
    expect(hook('step-title')?.style.whiteSpace).toBe('nowrap')
    for (const name of ['caption', 'toc', 'prev', 'next', 'progress']) expect(hook(name)).toBeNull()

    await key('ArrowRight')
    await key('p')
    expect(hook('')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect(currentStep()).toBe(1)
    expect(hook('step-title')?.textContent).toBe('Second title')
    expect(hook('caption')?.textContent).toBe('Second caption.')
    expect(hook('caption')?.style.whiteSpace).toBe('')
    for (const name of ['toc', 'prev', 'next', 'progress']) expect(hook(name)).not.toBeNull()

    await act(() => viewport.setWidth(600))
    expect(hook('toc')).toBeNull()
    expect(hook('caption')).not.toBeNull()
    await click(hook('mode-toggle'))
    expect(hook('')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(currentStep()).toBe(1)
  })

  it('handles navigation keys without intercepting focused controls', async () => {
    await render(<Presentation steps={steps} title="Fixture" brand={<input aria-label="Host input" />} />)
    expect((await key('ArrowRight')).defaultPrevented).toBe(true)
    expect(currentStep()).toBe(1)
    await key(' ')
    expect(currentStep()).toBe(2)
    await key('PageDown')
    expect(currentStep()).toBe(3)
    await key('ArrowLeft')
    expect(currentStep()).toBe(2)
    await key('PageUp')
    expect(currentStep()).toBe(1)

    const input = hook('brand')?.querySelector('input')
    expect(input).toBeDefined()
    input?.focus()
    expect(document.activeElement).toBe(input)
    for (const navigationKey of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp']) {
      expect((await key(navigationKey, input)).defaultPrevented).toBe(false)
      expect(currentStep()).toBe(1)
    }
    const progress = item('progress-item', 1)
    progress.focus()
    expect(document.activeElement).toBe(progress)
    expect((await key(' ', progress)).defaultPrevented).toBe(false)
    expect(currentStep()).toBe(1)
  })

  it('navigates horizontal swipes and ignores vertical or canceled gestures', async () => {
    await render()
    await swipe(20, 106)
    expect(currentStep()).toBe(1)
    await swipe(30, 190)
    expect(currentStep()).toBe(1)
    await swipe(20, 106, true)
    expect(currentStep()).toBe(1)
    await swipe(170, 105)
    expect(currentStep()).toBe(0)
  })

  it('supports direct jumps and marks current progress and era navigation', async () => {
    await render()
    const progress = (index: number) => item('progress-item', index)
    const toc = (index: number) => item('toc-item', index)
    const active = (element: HTMLElement) => [
      element.getAttribute('aria-current'), element.getAttribute('data-presentation-active'),
    ]
    expect(active(progress(0))).toEqual(['step', 'true'])
    expect(active(toc(0))).toEqual(['step', 'true'])
    await click(progress(3))
    expect(currentStep()).toBe(3)
    expect(active(progress(0))).toEqual([null, null])
    expect(active(toc(0))).toEqual([null, null])
    expect(active(progress(3))).toEqual(['step', 'true'])
    expect(active(toc(1))).toEqual(['step', 'true'])
    await click(toc(1))
    expect(currentStep()).toBe(2)
    expect(active(progress(2))).toEqual(['step', 'true'])
    await click(hook('prev'))
    expect(currentStep()).toBe(1)
    await click(hook('next'))
    expect(currentStep()).toBe(2)
    await click(toc(0))
    expect(currentStep()).toBe(0)
  })

  it('clamps previous and next at both endpoints without wrapping', async () => {
    await render()
    expect(hook('prev')?.hasAttribute('disabled')).toBe(true)
    await key('ArrowLeft')
    await swipe(170, 100)
    await click(hook('prev'))
    expect(currentStep()).toBe(0)

    await click(item('progress-item', 3))
    expect(hook('next')?.hasAttribute('disabled')).toBe(true)
    await key('ArrowRight')
    await swipe(20, 100)
    await click(hook('next'))
    expect(currentStep()).toBe(3)
  })

  it('fits the default and custom fixed canvas uniformly in each mode', async () => {
    expect(fitScale(440, 380, 880, 380)).toBe(0.5)
    expect(fitScale(880, 190, 880, 380)).toBe(0.5)
    expect(fitScale(1200, 600, 880, 380)).toBe(1)
    expect(fitScale(880, 0, 880, 380)).toBe(0)

    await render()
    const canvas = hook('canvas')
    expect([canvas?.style.width, canvas?.style.height]).toEqual(['880px', '380px'])
    const layout = hook('')?.style.gridTemplateRows
    await act(() => StageObserver.current.emit(440, 380))
    expect(canvas?.style.transform).toBe('scale(0.5)')
    await key('ArrowRight')
    expect(hook('')?.style.gridTemplateRows).toBe(layout)
    expect(canvas?.style.transform).toBe('scale(0.5)')

    await key('p')
    expect(hook('')?.style.gridTemplateRows).not.toBe(layout)
    await act(() => StageObserver.current.emit(880, 95))
    expect(canvas?.style.transform).toBe('scale(0.25)')
    expect([canvas?.style.width, canvas?.style.height]).toEqual(['880px', '380px'])

    await render(<Presentation steps={steps} title="Fixture" designWidth={500} designHeight={300} />)
    expect([canvas?.style.width, canvas?.style.height]).toEqual(['500px', '300px'])
    await act(() => StageObserver.current.emit(250, 300))
    expect(canvas?.style.transform).toBe('scale(0.5)')
  })
})
