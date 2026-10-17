import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import type { AnyStep, SceneProps, Step } from './types.ts'

const mounts: Record<string, number> = {}

function CounterScene({ payload }: SceneProps<{ label: string }>) {
  useEffect(() => {
    mounts.counter = (mounts.counter ?? 0) + 1
  }, [])
  return <div data-testid="scene">{payload.label}</div>
}

function OtherScene({ payload }: SceneProps<number>) {
  useEffect(() => {
    mounts.other = (mounts.other ?? 0) + 1
  }, [])
  return <div data-testid="scene">other {payload}</div>
}

const counter = (id: string, era: string, groupKey?: string): Step<{ label: string }> => ({
  id, era, title: `Title ${id}`, caption: `Caption ${id}`, Scene: CounterScene, payload: { label: id }, groupKey,
})

// Mixed payload types must be accepted at the host boundary without casts.
const other: Step<number> = { id: 'z', era: 'three', title: 'Title z', caption: 'Caption z', Scene: OtherScene, payload: 7 }
const STEPS: AnyStep[] = [counter('a', 'one', 'g'), counter('b', 'one', 'g'), counter('c', 'two', 'g'), other]
const typed: Step<{ label: string }>[] = [counter('a', 'one')]

const index = () => Number(document.querySelector('[data-step-count]')!.getAttribute('data-step-index'))
const press = (key: string, target: Element | Window = window) => fireEvent.keyDown(target, { key })

function setViewport(width: number, height = 800) {
  Object.assign(window, { innerWidth: width, innerHeight: height })
}

beforeEach(() => {
  for (const k of Object.keys(mounts)) delete mounts[k]
  setViewport(1280)
})
afterEach(cleanup)

describe('step model', () => {
  it('accepts a typed step array at the Presentation boundary', () => {
    render(<Presentation steps={typed} title="Deck" />)
    expect(screen.getByTestId('scene').textContent).toBe('a')
  })

  it('numbers steps by position and updates when steps are reordered', () => {
    const view = render(<Presentation steps={STEPS} title="Deck" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toContain('01 / 04')
    view.unmount()
    render(<Presentation steps={[STEPS[1], STEPS[0], STEPS[2]]} title="Deck" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toContain('01 / 03')
    expect(document.querySelector('[data-presentation-step-title]')!.textContent).toBe('Title b')
  })
})

describe('chrome hooks and modes', () => {
  it('exposes step hooks in both modes', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="present" />)
    const root = document.querySelector('[data-presentation-root]')!
    for (const mode of ['present', 'browse']) {
      expect(root.getAttribute('data-presentation-mode')).toBe(mode)
      expect(root.getAttribute('data-step-count')).toBe('4')
      expect(root.getAttribute('data-presentation-step-count')).toBe('4')
      expect(root.getAttribute('data-step-index')).toBe(root.getAttribute('data-presentation-step-index'))
      press('p')
    }
  })

  it('present mode shows marker and title only, with no caption, ToC or prev/next in the DOM', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(screen.getByText('Title a')).not.toBeNull()
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
    expect(document.querySelector('[data-presentation-attribution]')).not.toBeNull()
  })

  it('browse mode shows title, caption, ToC on wide viewports, controls and progress', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    expect(screen.getByText('Caption a')).not.toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
    expect(document.querySelector('[data-presentation-deck-title]')!.textContent).toBe('Deck')
  })

  it('omits the table of contents below the wide breakpoint', () => {
    setViewport(390, 844)
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(screen.getByText('Caption a')).not.toBeNull()
  })

  it('toggling mode keeps the current step', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(document.querySelector('[data-presentation-mode]')!.getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe(2)
    press('P')
    expect(index()).toBe(2)
  })

  it('has no default brand and renders a host brand when supplied', () => {
    const view = render(<Presentation steps={STEPS} title="Deck" />)
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.unmount()
    render(<Presentation steps={STEPS} title="Deck" brand={<span>Acme</span>} />)
    expect(document.querySelector('[data-presentation-brand]')!.textContent).toBe('Acme')
  })

  it('shows the default attribution link and honours overrides', () => {
    const view = render(<Presentation steps={STEPS} title="Deck" />)
    const link = document.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link.textContent).toBe('made by and-scene')
    expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
    view.unmount()
    render(<Presentation steps={STEPS} title="Deck" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('applies the presentation class to the root and sizes the canvas to the default design size', () => {
    render(<Presentation steps={STEPS} title="Deck" className="mine" />)
    expect(document.querySelector('[data-presentation-root]')!.className).toBe('mine')
    const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect([canvas.style.width, canvas.style.height]).toEqual([`${DESIGN_W}px`, `${DESIGN_H}px`])
  })
})

describe('navigation', () => {
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

  it('clamps at both ends', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    press('ArrowLeft')
    expect(index()).toBe(0)
    for (let i = 0; i < 8; i++) press('ArrowRight')
    expect(index()).toBe(3)
  })

  it('handles horizontal swipes', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    const swipe = (dx: number, dy = 0) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: 200, clientY: 100 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200 + dx, clientY: 100 + dy }] })
    }
    swipe(-90)
    expect(index()).toBe(1)
    swipe(90)
    expect(index()).toBe(0)
    swipe(-90, 200)
    expect(index()).toBe(0)
  })

  it('jumps via progress indicators and to the first step of a ToC era', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-item]')[1])
    expect(index()).toBe(1)
    fireEvent.click(within(document.querySelector<HTMLElement>('[data-presentation-toc]')!).getByText('two'))
    expect(index()).toBe(2)
    fireEvent.click(screen.getByLabelText('Previous step'))
    expect(index()).toBe(1)
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(index()).toBe(2)
  })

  it('marks the active progress item and ToC era with current state and an active hook', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    const dots = [...document.querySelectorAll('[data-presentation-progress-item]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, 'step', null, null])
    expect(dots.map((d) => d.getAttribute('data-presentation-active'))).toEqual([null, 'true', null, null])
    const eras = [...document.querySelectorAll('[data-presentation-toc-item]')]
    expect(eras.map((e) => e.getAttribute('aria-current'))).toEqual(['true', null, null])
    expect(eras.map((e) => e.getAttribute('data-presentation-active'))).toEqual(['true', null, null])
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-toc-item][aria-current]')!.textContent).toBe('two')
  })

  it('leaves keys to focused controls', () => {
    render(<Presentation steps={STEPS} title="Deck" initialMode="browse" />)
    const dot = document.querySelectorAll('[data-presentation-progress-item]')[2]
    press('ArrowRight', dot)
    press(' ', dot)
    press('p', dot)
    expect(index()).toBe(0)
    expect(document.querySelector('[data-presentation-mode]')!.getAttribute('data-presentation-mode')).toBe('browse')
  })

  it('advances exactly once per key under StrictMode', () => {
    render(
      <StrictMode>
        <Presentation steps={STEPS} title="Deck" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(index()).toBe(1)
  })
})

describe('grouped scenes', () => {
  it('keeps one scene instance across steps that share a group and Scene', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    expect(mounts.counter).toBe(1)
    expect(screen.getByTestId('scene').textContent).toBe('c')
  })

  it('swaps scenes when the Scene changes within a group', () => {
    render(<Presentation steps={STEPS} title="Deck" />)
    act(() => {
      for (let i = 0; i < 3; i++) press('ArrowRight')
    })
    expect(mounts.other).toBe(1)
  })

  it('remounts when the group changes', () => {
    const steps = [counter('a', 'one', 'g1'), counter('b', 'one', 'g2')]
    render(<Presentation steps={steps} title="Deck" />)
    press('ArrowRight')
    expect(mounts.counter).toBe(2)
  })
})
