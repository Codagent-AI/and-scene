import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockMatchMedia } from '../../vitest.setup.ts'
import { ATTRIBUTION_HREF } from './constants.ts'
import { Presentation } from './Presentation.tsx'
import type { AnyStep, SceneProps } from './types.ts'

function Scene({ index }: SceneProps<undefined>) {
  return <div data-testid="scene">scene {index}</div>
}

const mk = (id: string, era: string): AnyStep => ({
  id,
  era,
  title: `Title ${id}`,
  caption: `Caption ${id}`,
  Scene,
  payload: undefined,
})
const STEPS = [mk('a', 'one'), mk('b', 'one'), mk('c', 'two'), mk('d', 'two')]

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const index = () => Number(root().getAttribute('data-step-index'))
const press = (key: string, target: Element | Window = window) => fireEvent.keyDown(target, { key })

describe('Presentation chrome', () => {
  it('exposes step count and index hooks and starts in present mode', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    expect(root().getAttribute('data-step-count')).toBe('4')
    expect(index()).toBe(0)
    expect(root().getAttribute('data-mode')).toBe('present')
  })

  it('honors initialMode', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    expect(root().getAttribute('data-mode')).toBe('browse')
  })

  it('present mode shows marker and one-line title only', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('1 / 4')
    expect(screen.getByText('Title a')).toBeTruthy()
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) {
      expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    }
    expect(screen.queryByText('Caption a')).toBeNull()
  })

  it('browse mode shows title, caption, ToC, prev/next, and progress indicators', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    expect(screen.getByText('Title a')).toBeTruthy()
    expect(screen.getByText('Caption a')).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-dot]')).toHaveLength(4)
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('Deck')
  })

  it('hides the ToC on narrow viewports', () => {
    mockMatchMedia(false)
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).not.toBeNull()
  })

  it('P toggles the mode and keeps the current step', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(root().getAttribute('data-mode')).toBe('present')
    expect(index()).toBe(2)
    press('P')
    expect(root().getAttribute('data-mode')).toBe('browse')
    expect(index()).toBe(2)
  })
})

describe('Presentation navigation', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%j advances one step', (key) => {
    render(<Presentation steps={STEPS} title="Deck" />)
    press(key)
    expect(index()).toBe(1)
  })

  it.each([['ArrowLeft'], ['PageUp']])('%s goes back one step', (key) => {
    render(<Presentation steps={STEPS} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    press(key)
    expect(index()).toBe(1)
  })

  it('clamps at the first and last step', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    press('ArrowLeft')
    expect(index()).toBe(0)
    for (let i = 0; i < 10; i++) press('ArrowRight')
    expect(index()).toBe(3)
  })

  it('swipe left advances and swipe right goes back', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    const swipe = (from: number, to: number) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: from, clientY: 100 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: to, clientY: 104 }] })
    }
    swipe(300, 100)
    expect(index()).toBe(1)
    swipe(100, 300)
    expect(index()).toBe(0)
  })

  it('prev/next buttons move and disable at the ends', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    const prev = screen.getByLabelText('Previous step') as HTMLButtonElement
    const next = screen.getByLabelText('Next step') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    expect(index()).toBe(1)
    fireEvent.click(prev)
    expect(index()).toBe(0)
    for (let i = 0; i < 3; i++) fireEvent.click(next)
    expect(index()).toBe(3)
    expect(next.disabled).toBe(true)
  })

  it('a progress indicator jumps to its step', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    fireEvent.click(screen.getByLabelText('Step 3: Title c'))
    expect(index()).toBe(2)
  })

  it('a ToC entry jumps to the first step of its era', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(index()).toBe(3)
    fireEvent.click(within(document.querySelector('[data-presentation-toc]') as HTMLElement).getByText('one'))
    expect(index()).toBe(0)
    fireEvent.click(within(document.querySelector('[data-presentation-toc]') as HTMLElement).getByText('two'))
    expect(index()).toBe(2)
  })

  it('marks the active indicator and ToC entry with aria-current and a stable hook', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    const dots = [...document.querySelectorAll('[data-presentation-progress-dot]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.getAttribute('data-active'))).toEqual([null, null, 'true', null])
    const toc = [...document.querySelectorAll('[data-presentation-toc-entry]')]
    expect(toc.map((e) => e.getAttribute('aria-current'))).toEqual([null, 'step'])
    expect(toc.map((e) => e.getAttribute('data-active'))).toEqual([null, 'true'])
  })

  it('focused controls keep their keys instead of also advancing the deck', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    const dot = screen.getByLabelText('Step 1: Title a') as HTMLElement
    dot.focus()
    press(' ', dot)
    press('ArrowRight', dot)
    press('PageDown', dot)
    expect(index()).toBe(0)
    dot.blur()
    press('ArrowRight', document.body)
    expect(index()).toBe(1)
  })

  it('pointer clicks release focus so deck keys keep working', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    const next = screen.getByLabelText('Next step') as HTMLElement
    next.focus()
    fireEvent.click(next, { detail: 1 })
    expect(document.activeElement).not.toBe(next)
    press('ArrowRight', document.body)
    expect(index()).toBe(2)
  })

  it('ignores keys with modifiers', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: true })
    expect(index()).toBe(0)
  })
})

describe('Presentation branding and attribution', () => {
  it('shows the default bottom-right attribution with a stable hook', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    const link = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_HREF)
    expect(ATTRIBUTION_HREF).toMatch(/^https:\/\/github\.com\/.+\/and-scene$/)
  })

  it('has no default top-left brand link', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    expect(document.querySelector('[data-presentation-header] a')).toBeNull()
  })

  it('renders a host-provided brand in the header slot', () => {
    render(<Presentation steps={STEPS} title="Deck" brand={<span>Acme</span>} />)
    expect(document.querySelector('[data-presentation-header] [data-presentation-brand]')?.textContent).toBe('Acme')
  })

  it('can omit the attribution', () => {
    render(<Presentation steps={STEPS} title="Deck" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('Presentation canvas', () => {
  it('renders the active scene on the 880 x 380 canvas by default', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    expect(screen.getByTestId('scene').textContent).toBe('scene 0')
  })

  it('applies one uniform scale transform', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.transform).toMatch(/scale\([\d.]+\)$/)
    act(() => press('ArrowRight'))
    expect(canvas.style.transform).toMatch(/scale\([\d.]+\)$/)
  })

  it('honors a custom canvas size', () => {
    render(<Presentation steps={STEPS} title="Deck" canvas={{ width: 400, height: 200 }} />)
    expect((document.querySelector('[data-presentation-canvas]') as HTMLElement).style.width).toBe('400px')
  })
})
