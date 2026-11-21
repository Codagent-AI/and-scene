// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect } from 'react'
import { useIsPresent } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Box, Presentation, SceneLayer } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { clampStep, isInteractive, keyAction, swipeDelta } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'

const mount = vi.fn()
const observe = vi.fn()
const disconnect = vi.fn()

let resize: (width: number, height: number) => void

class TestObserver {
  constructor(callback: ResizeObserverCallback) {
    resize = (width, height) => {
      const entry = new ResizeObserverEntry()
      Object.defineProperty(entry, 'contentRect', { value: { width, height } })
      callback([entry], this as unknown as ResizeObserver)
    }
  }
  observe() {
    observe()
    resize(660, 240)
  }
  disconnect() { disconnect() }
}

function SceneStatus() {
  return <span data-scene-present={useIsPresent()} />
}

function Diagram({ payload }: SceneProps<string>) {
  useEffect(() => { mount() }, [])
  return <>
    <SceneStatus />
    <SceneLayer>
      <Box id="anchor" className="part" style={{ position: 'absolute', left: 50, top: 40 }}>{payload}</Box>
      <Box id="overlay" style={{ position: 'absolute', left: 50, top: 40, zIndex: 2 }}>Overlay</Box>
    </SceneLayer>
  </>
}

function OtherDiagram({ payload }: SceneProps<string>) {
  return <Diagram payload={payload} />
}

const steps: readonly Step<string>[] = [
  { id: 'first', era: 'intro', title: 'First', caption: 'Caption one', Scene: Diagram, groupKey: 'exchange', payload: 'A' },
  { id: 'second', era: 'intro', title: 'Second', caption: 'Caption two', Scene: Diagram, groupKey: 'exchange', payload: 'B' },
  { id: 'third', era: 'build', title: 'Third', caption: 'Caption three', Scene: OtherDiagram, groupKey: 'exchange', payload: 'C' },
  { id: 'fourth', era: 'build', title: 'Last', caption: 'Caption four', Scene: OtherDiagram, groupKey: 'final', payload: 'D' },
]

const key = (value: string, target: Window | HTMLElement = window) => fireEvent.keyDown(target, { key: value })

function start() {
  const app = render(<Presentation steps={steps} title="Test presentation" />)
  const root = screen.getByRole('main', { name: 'Test presentation' })
  return { app, root, active: () => root.getAttribute('data-step-index') }
}

beforeEach(() => {
  mount.mockClear()
  observe.mockClear()
  disconnect.mockClear()
  vi.stubGlobal('ResizeObserver', TestObserver)
  vi.stubGlobal('ResizeObserverEntry', class {})
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('presentation chrome and scene host', () => {
  it('uses ordered metadata and derives numbering after insertion, removal, and reordering', () => {
    const { app, root } = start()
    expect(screen.getByText('A').getAttribute('data-presentation-entity')).toBe('anchor')
    expect(screen.getByText('intro', { selector: '[data-presentation-era]' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'First' })).toBeTruthy()
    expect(screen.getByText('Caption one')).toBeTruthy()
    expect(root.querySelector('[data-presentation-number]')?.textContent).toBe('1 / 4')

    const inserted = { ...steps[1], id: 'inserted', title: 'Inserted' }
    app.rerender(<Presentation steps={[steps[3], inserted, steps[0]]} title="Test presentation" />)
    for (const [index, title, caption] of [
      [1, 'Last', 'Caption four'],
      [2, 'Inserted', 'Caption two'],
      [3, 'First', 'Caption one'],
    ] as const) {
      const control = screen.getByRole('button', { name: `Step ${index}: ${title}` })
      fireEvent.click(control)
      expect(control.getAttribute('aria-current')).toBe('step')
      expect(root.querySelector('[data-presentation-number]')?.textContent).toBe(`${index} / 3`)
      expect(screen.getByRole('heading', { name: title })).toBeTruthy()
      expect(screen.getByText(caption)).toBeTruthy()
    }
  })

  it('keeps a grouped scene mounted, including the original entity and stacking geometry', () => {
    const { root } = start()
    const anchor = screen.getByText('A')
    key('ArrowRight')
    expect(screen.getByText('B')).toBe(anchor)
    expect(screen.getByText('Overlay').style.zIndex).toBe('2')
    expect(screen.getByText('Overlay').style.left).toBe(anchor.style.left)
    expect(anchor.style.top).toBe('40px')
    expect(anchor.closest('[data-presentation-appear]')).toBeNull()
    expect(mount).toHaveBeenCalledTimes(1)

    const scene = '[data-presentation-scene]'
    expect(root.querySelectorAll(scene)).toHaveLength(1)
    const presence = (element: Element) => element.querySelector('[data-scene-present]')?.getAttribute('data-scene-present')
    expect(presence(anchor.closest(scene)!)).toBe('true')

    let outgoing = anchor
    for (const [title, mountCount] of [['C', 2], ['D', 3]] as const) {
      const oldScene = outgoing.closest(scene)!
      key('ArrowRight')
      const incoming = screen.getByText(title)
      const newScene = incoming.closest(scene)!
      expect(mount).toHaveBeenCalledTimes(mountCount)
      expect(root.contains(oldScene)).toBe(true)
      expect(newScene).not.toBe(oldScene)
      expect(presence(oldScene)).toBe('false')
      expect(presence(newScene)).toBe('true')
      expect(root.querySelectorAll('[data-scene-present="true"]')).toHaveLength(1)
      outgoing = incoming
    }
  })

  it('exposes unstyled hooks, class and style pass-through, attribution, and optional branding', () => {
    const { app } = start()
    const entity = screen.getByText('A')
    expect(entity.matches('.part[data-presentation-box]')).toBe(true)
    expect(entity.style.left).toBe('50px')
    expect(entity.style.backgroundColor).toBe('')
    const attribution = screen.getByRole('link', { name: 'made by and-scene' })
    expect(attribution.matches('[data-presentation-attribution]')).toBe(true)
    expect(attribution.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(screen.getByRole('banner').querySelector('a')).toBeNull()
    app.rerender(<Presentation steps={steps} title="Test presentation" brand={<a href="/">Host</a>} />)
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Host' })).toBeTruthy()
  })

  it('renders browse chrome and preserves the step when toggling present mode and back', () => {
    const { root, active } = start()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(active()).toBe('1')
    expect(screen.getByText('Caption two')).toBeTruthy()
    expect(root.querySelector('[data-presentation-toc]')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Step navigation' })).toBeTruthy()

    key('P')
    expect(root.dataset.presentationMode).toBe('present')
    expect(active()).toBe('1')
    expect(screen.getByRole('heading', { name: 'Second' }).style.whiteSpace).toBe('nowrap')
    expect(root.querySelector('[data-presentation-marker]')).toBeTruthy()
    expect(screen.queryByText('Caption two')).toBeNull()
    expect(root.querySelector('[data-presentation-toc]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()

    key('p')
    expect(root.dataset.presentationMode).toBe('browse')
    expect(active()).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Caption one')).toBeTruthy()
  })

  it('honors a declared initial mode', () => {
    render(<Presentation steps={steps} title="Test presentation" initialMode="present" />)
    expect(screen.getByRole('main').dataset.presentationMode).toBe('present')
    expect(screen.queryByText('Caption one')).toBeNull()
  })

  it('jumps to a progress step or the first step of an era and exposes current state', () => {
    const { root, active } = start()
    const toc = root.querySelector('[data-presentation-toc]') as HTMLElement
    const progress = screen.getByRole('button', { name: 'Step 4: Last' })
    const intro = within(toc).getByText('intro')
    const build = within(toc).getByText('build')
    expect(intro.getAttribute('aria-current')).toBe('step')
    expect(build.dataset.presentationActive).toBe('false')
    expect(progress.hasAttribute('aria-current')).toBe(false)
    fireEvent.click(progress)
    expect(active()).toBe('3')
    expect(progress.getAttribute('aria-current')).toBe('step')
    expect(progress.dataset.presentationActive).toBe('true')
    expect(build.getAttribute('aria-current')).toBe('step')
    expect(intro.hasAttribute('aria-current')).toBe(false)
    fireEvent.click(build)
    expect(active()).toBe('2')
    expect(progress.hasAttribute('aria-current')).toBe(false)
    fireEvent.click(intro)
    expect(active()).toBe('0')
  })

  it('lets focused controls use navigation keys without advancing the deck', () => {
    const { active } = start()
    const control = document.createElement('input')
    let handled = false
    document.body.append(control)
    control.addEventListener('keydown', () => { handled = true })
    control.focus()
    expect(isInteractive(control)).toBe(true)
    expect(isInteractive(document.body)).toBe(false)
    key('ArrowRight', control)
    expect(handled).toBe(true)
    expect(active()).toBe('0')
    control.remove()
    key('ArrowRight')
    expect(active()).toBe('1')
  })

  it('maps all navigation keys, clamps both ends, and handles horizontal swipes and touch cancellation', () => {
    const { root, active } = start()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Previous' }).disabled).toBe(true)
    key('PageUp')
    expect(active()).toBe('0')
    for (const [index, input] of ['ArrowRight', ' ', 'PageDown'].entries()) {
      expect(keyAction(input)).toBe('next')
      key(input)
      expect(active()).toBe(String(index + 1))
    }
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next' }).disabled).toBe(true)
    key('ArrowRight')
    expect(active()).toBe('3')
    for (const [index, input] of ['ArrowLeft', 'PageUp'].entries()) {
      expect(keyAction(input)).toBe('previous')
      key(input)
      expect(active()).toBe(String(2 - index))
    }
    function swipe(x: number, y: number, cancel = false) {
      fireEvent.touchStart(root, { touches: [{ identifier: 1, clientX: 100, clientY: 100 }] })
      if (cancel) fireEvent.touchCancel(root)
      fireEvent.touchEnd(root, { changedTouches: [{ identifier: 1, clientX: x, clientY: y }] })
    }
    expect(swipeDelta(0, 100)).toBe(0)
    swipe(20, 100, true)
    swipe(30, 210)
    expect(active()).toBe('1')
    swipe(20, 100)
    expect(active()).toBe('2')
    for (let index = 0; index < 3; index++) swipe(180, 100)
    expect(active()).toBe('0')
    expect(clampStep(-3, steps.length)).toBe(0)
    expect(clampStep(99, steps.length)).toBe(3)
  })

  it('fits the fixed canvas uniformly without step reflow and disconnects resize observation on unmount', () => {
    const { root, app } = start()
    const canvas = root.querySelector<HTMLElement>('[data-presentation-canvas]')!
    const scale = 240 / 380
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    const caption = root.querySelector('[data-presentation-caption]')!
    const reserves = [...caption.querySelectorAll('[data-presentation-reserve]')]
    expect(reserves.map(item => item.getAttribute('data-presentation-reserve'))).toEqual(steps.map(step => step.caption))
    expect(reserves.every(item => item.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(caption.textContent).toBe('Caption one')
    const initialTransform = canvas.style.transform
    expect(initialTransform).toMatch(/^scale\(/)
    expect(parseFloat(initialTransform.slice(6))).toBeCloseTo(scale)
    key('ArrowRight')
    expect(canvas.style.transform).toBe(initialTransform)
    expect(caption.textContent).toBe('Caption two')
    expect([...caption.querySelectorAll('[data-presentation-reserve]')]).toEqual(reserves)
    act(() => resize(440, 240))
    expect(canvas.style.transform).toBe('scale(0.5)')
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    act(() => resize(660, 240))
    expect(fitScale(440, 900, 880, 380)).toBe(0.5)
    expect(fitScale(220, 700, 880, 380)).toBe(0.25)
    expect(fitScale(0, 0, 880, 380)).toBe(0)
    const stage = root.querySelector<HTMLElement>('[data-presentation-stage]')!
    expect(stage.style.paddingInline).toBe('16px')
    key('p')
    expect(stage.style.paddingInline).toBe('24px')
    app.rerender(<Presentation steps={steps} title="Test presentation" canvas={{ width: 400, height: 200 }} />)
    expect(canvas.style.transform).toBe('scale(1.2)')
    expect(canvas.style.width).toBe('400px')
    app.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})
