import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

type Payload = { label: string }

const Scene = ({ payload }: SceneProps<Payload>) => <div data-testid="scene">{payload.label}</div>

// Two eras, three steps: Intro (0, 1) and Core (2).
const steps: Step<Payload>[] = [
  { id: 'a', era: 'Intro', title: 'Start here', caption: 'First caption paragraph.', Scene, payload: { label: 'p-a' } },
  { id: 'b', era: 'Intro', title: 'Second title', caption: 'Second caption paragraph.', Scene, payload: { label: 'p-b' } },
  { id: 'c', era: 'Core', title: 'Core title', caption: 'Third caption paragraph.', Scene, payload: { label: 'p-c' } },
]

let listeners: Array<() => void> = []

/** Controllable viewport: updates innerWidth and notifies matchMedia change listeners. */
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  act(() => {
    listeners.forEach((cb) => cb())
  })
}

beforeEach(() => {
  listeners = []
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1280 })
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
    return {
      media: query,
      onchange: null,
      get matches() {
        return window.innerWidth >= min
      },
      addEventListener: (_type: string, cb: () => void) => {
        listeners.push(cb)
      },
      removeEventListener: (_type: string, cb: () => void) => {
        listeners = listeners.filter((l) => l !== cb)
      },
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }
  }) as unknown as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  delete (window as { matchMedia?: unknown }).matchMedia
})

const q = (sel: string) => document.querySelector(sel)

describe('L-15 header brand is opt-in', () => {
  it('renders no link in the top-left brand slot by default', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const brand = q('[data-presentation-brand]') as HTMLElement
    expect(brand).not.toBeNull()
    expect(brand.querySelector('a')).toBeNull()
    expect(brand.textContent).toBe('')
    expect(q('[data-presentation-header]')!.querySelectorAll('a')).toHaveLength(0)
  })

  it('renders a host-provided brand node in the top-left brand slot', () => {
    render(
      <Presentation
        steps={steps}
        title="Deck"
        brand={<a href="https://example.com/host" data-testid="host-brand">Host Co</a>}
      />,
    )
    const brand = q('[data-presentation-brand]') as HTMLElement
    const link = brand.querySelector('a') as HTMLAnchorElement
    expect(link.textContent).toBe('Host Co')
    expect(link.getAttribute('href')).toBe('https://example.com/host')
    // The footer attribution is not a header link: it is outside the header.
    expect(q('[data-presentation-header]')!.querySelectorAll('a')).toHaveLength(1)
  })
})

describe('L-16 present mode is title-focused', () => {
  it.each([1280, 500])('shows only marker and one-line title at viewport %ipx', (width) => {
    setViewport(width)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)

    const marker = q('[data-presentation-marker]')!
    expect(marker.textContent).toBe('1 / 3')
    const title = q('[data-presentation-footer] [data-presentation-title]')!
    expect(title.tagName).toBe('H2')
    expect(title.textContent).toBe('Start here')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-progress]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
    expect(q('[data-presentation-deck-title]')).toBeNull()
  })

  it('keeps marker and title in sync after navigation in present mode', () => {
    setViewport(1280)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(q('[data-presentation-marker]')!.textContent).toBe('3 / 3')
    expect(q('[data-presentation-footer] [data-presentation-title]')!.textContent).toBe('Core title')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
  })
})

describe('L-17 browse mode is reading-focused; ToC only on wide viewports', () => {
  it('shows title, multi-line caption paragraph, progress, and prev/next at wide width', () => {
    setViewport(1280)
    render(<Presentation steps={steps} title="Deck" />)

    expect(q('[data-presentation-footer] [data-presentation-title]')!.textContent).toBe('Start here')
    const caption = q('[data-presentation-caption]') as HTMLElement
    expect(caption.tagName).toBe('P')
    expect(caption.textContent).toBe('First caption paragraph.')
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(3)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(q('[data-presentation-toc]')).not.toBeNull()

    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(q('[data-presentation-caption]')!.textContent).toBe('Third caption paragraph.')
  })

  it('toggles the ToC on the mounted component across the 1024px boundary', () => {
    setViewport(1024)
    render(<Presentation steps={steps} title="Deck" />)
    expect(q('[data-presentation-toc]')).not.toBeNull()

    setViewport(1023)
    expect(q('[data-presentation-toc]')).toBeNull()
    // Progress, caption, and controls remain in browse mode at narrow widths.
    expect(q('[data-presentation-caption]')!.textContent).toBe('First caption paragraph.')
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(3)
    expect(q('[data-presentation-prev]')).not.toBeNull()

    setViewport(1500)
    const toc = q('[data-presentation-toc]') as HTMLElement
    expect(toc).not.toBeNull()
    expect(
      Array.from(toc.querySelectorAll('[data-presentation-toc-item]')).map((b) => b.textContent),
    ).toEqual(['Intro', 'Core'])
  })

  it('does not render a ToC when the viewport starts narrow and stays narrow', () => {
    setViewport(800)
    render(<Presentation steps={steps} title="Deck" />)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-caption]')!.textContent).toBe('First caption paragraph.')
  })
})
