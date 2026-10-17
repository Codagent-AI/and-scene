import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_ATTRIBUTION, TOC_BREAKPOINT } from '../constants'
import { Presentation, type PresentationProps } from '../Presentation'
import { CountingScene, makeSteps, mounts } from './helpers'

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const index = () => Number(root().getAttribute('data-step-index'))
const press = (key: string, target: Element | Window = window) => fireEvent.keyDown(target, { key })

function setWidth(width: number) {
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    window.dispatchEvent(new Event('resize'))
  })
}

function show(props: Partial<PresentationProps> = {}) {
  return render(<Presentation title="Deck" steps={makeSteps(6)} {...props} />)
}

beforeEach(() => {
  mounts.count = 0
  setWidth(1280)
})
afterEach(cleanup)

describe('chrome by mode', () => {
  it('present mode shows marker and title, hiding caption, ToC and prev/next', () => {
    show({ initialMode: 'present' })
    expect(root().dataset.presentationMode).toBe('present')
    expect(document.querySelector('[data-presentation-step-number]')?.textContent).toBe('1 / 6')
    expect(document.querySelector('[data-presentation-era]')?.textContent).toBe('era 1')
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('Title 1')
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress', 'progress-item']) {
      expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    }
  })

  it('browse mode shows title, caption, ToC, progress and prev/next', () => {
    show({ initialMode: 'browse' })
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('Title 1')
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 1')
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
  })

  it('defaults to present mode when no initial mode is declared', () => {
    show()
    expect(root().dataset.presentationMode).toBe('present')
  })

  it('renders the ToC only at or above the breakpoint', () => {
    show({ initialMode: 'browse' })
    setWidth(TOC_BREAKPOINT - 1)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-caption]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
    setWidth(TOC_BREAKPOINT)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    setWidth(TOC_BREAKPOINT + 400)
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('toggles with P in both directions and keeps the current step', () => {
    show({ initialMode: 'browse' })
    press('ArrowRight')
    press('ArrowRight')
    expect(index()).toBe(2)
    press('p')
    expect(root().dataset.presentationMode).toBe('present')
    expect(root().dataset.stepId).toBe('s3')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    press('P')
    expect(root().dataset.presentationMode).toBe('browse')
    expect(index()).toBe(2)
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 3')
  })
})

describe('hooks', () => {
  it('exposes step count and index on the root in both modes, following navigation', () => {
    show({ initialMode: 'browse' })
    for (let i = 0; i < 6; i++) {
      expect(root().getAttribute('data-step-count')).toBe('6')
      expect(index()).toBe(i)
      press('ArrowRight')
    }
    press('p')
    expect(root().getAttribute('data-step-count')).toBe('6')
  })

  it('follows step insertion and removal', () => {
    const steps = makeSteps(5)
    const view = render(<Presentation title="Deck" steps={steps} initialMode="browse" />)
    expect(root().getAttribute('data-step-count')).toBe('5')
    view.rerender(<Presentation title="Deck" steps={steps.slice(0, 3)} initialMode="browse" />)
    expect(root().getAttribute('data-step-count')).toBe('3')
    view.rerender(<Presentation title="Deck" steps={[...steps, ...makeSteps(2)]} initialMode="browse" />)
    expect(root().getAttribute('data-step-count')).toBe('7')
  })

  it('derives step numbers from position when steps are inserted, removed or reordered', () => {
    const steps = makeSteps(4)
    const marker = () => document.querySelector('[data-presentation-step-number]')?.textContent
    const view = render(<Presentation title="Deck" steps={steps} initialMode="browse" />)
    press('ArrowRight')
    expect(marker()).toBe('2 / 4')
    expect(root().dataset.stepId).toBe('s2')
    // move s2 to the front: same step, new position
    view.rerender(<Presentation title="Deck" steps={[steps[1], steps[0], steps[2], steps[3]]} initialMode="browse" />)
    expect(marker()).toBe('2 / 4')
    press('ArrowLeft')
    expect(root().dataset.stepId).toBe('s2')
    expect(marker()).toBe('1 / 4')
    // remove the first step: ids stay, numbers and totals shift
    view.rerender(<Presentation title="Deck" steps={steps.slice(1)} initialMode="browse" />)
    expect(marker()).toBe('1 / 3')
    expect(root().dataset.stepId).toBe('s2')
    view.rerender(<Presentation title="Deck" steps={[makeSteps(1)[0], ...steps.slice(1)]} initialMode="browse" />)
    expect(marker()).toBe('1 / 4')
  })

  it('passes className, style and data attributes through the primitives of the chrome root', () => {
    show({ className: 'mine', style: { color: 'red' } })
    expect(root().classList.contains('mine')).toBe(true)
    expect(root().style.color).toBe('red')
    for (const hook of ['header', 'marker', 'body', 'stage', 'canvas', 'step-host', 'footer', 'title', 'attribution']) {
      expect(document.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })
})

describe('navigation', () => {
  it.each([
    ['ArrowRight', 1],
    [' ', 1],
    ['PageDown', 1],
  ])('%j advances exactly one step', (key, delta) => {
    show({ initialMode: 'browse' })
    press(key)
    expect(index()).toBe(delta)
    press(key)
    expect(index()).toBe(2 * delta)
  })

  it.each(['ArrowLeft', 'PageUp'])('%s goes back exactly one step', (key) => {
    show({ initialMode: 'browse' })
    press('ArrowRight')
    press('ArrowRight')
    press(key)
    expect(index()).toBe(1)
  })

  it('prevents default for handled keys only', () => {
    show()
    expect(fireEvent.keyDown(window, { key: ' ' })).toBe(false)
    expect(fireEvent.keyDown(window, { key: 'a' })).toBe(true)
  })

  it('clamps at both ends by keyboard, buttons and swipes', () => {
    show({ initialMode: 'browse' })
    press('ArrowLeft')
    press('PageUp')
    expect(index()).toBe(0)
    expect((document.querySelector('[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 10; i++) press('ArrowRight')
    expect(index()).toBe(5)
    press(' ')
    swipe(-100, 0)
    expect(index()).toBe(5)
    const next = document.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(index()).toBe(5)
  })

  it('works through prev/next buttons', () => {
    show({ initialMode: 'browse' })
    fireEvent.click(document.querySelector('[data-presentation-next]')!)
    fireEvent.click(document.querySelector('[data-presentation-next]')!)
    expect(index()).toBe(2)
    fireEvent.click(document.querySelector('[data-presentation-prev]')!)
    expect(index()).toBe(1)
  })

  it('shows the caption of every step going forward and back', () => {
    show({ initialMode: 'browse' })
    for (let i = 1; i <= 6; i++) {
      expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(`Caption ${i}`)
      press('ArrowRight')
    }
    for (let i = 6; i >= 1; i--) {
      expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(`Caption ${i}`)
      press('ArrowLeft')
    }
  })

  it('one-step presentations never move', () => {
    render(<Presentation title="One" steps={makeSteps(1)} initialMode="browse" />)
    press('ArrowRight')
    press('ArrowLeft')
    swipe(-100, 0)
    expect(index()).toBe(0)
  })

  it('does not hijack keys from focused controls, including P', () => {
    show({ initialMode: 'browse' })
    const next = document.querySelector('[data-presentation-next]') as HTMLElement
    for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) press(key, next)
    expect(index()).toBe(0)
    expect(root().dataset.presentationMode).toBe('browse')
    press('ArrowRight', document.body)
    expect(index()).toBe(1)
  })

  function swipe(dx: number, dy: number) {
    fireEvent.touchStart(window, { touches: [{ clientX: 300, clientY: 200 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 300 + dx, clientY: 200 + dy }] })
  }

  it('swipes left to advance and right to go back, once per gesture', () => {
    show({ initialMode: 'browse' })
    swipe(-100, 10)
    expect(index()).toBe(1)
    swipe(-100, 10)
    expect(index()).toBe(2)
    swipe(100, 0)
    expect(index()).toBe(1)
  })

  it('ignores taps, short swipes and vertical swipes', () => {
    show({ initialMode: 'browse' })
    swipe(0, 0)
    swipe(-39, 0)
    swipe(-10, 200)
    swipe(-80, 90)
    expect(index()).toBe(0)
    swipe(-40, 0)
    expect(index()).toBe(1)
    swipe(41, 0)
    expect(index()).toBe(0)
  })

  it('jumps from progress indicators and ToC entries', () => {
    const era = (i: number) => ['a', 'a', 'b', 'b', 'a', 'a'][i]
    render(<Presentation title="Deck" steps={makeSteps(6, { era })} initialMode="browse" />)
    const dots = [...document.querySelectorAll('[data-presentation-progress-item]')]
    fireEvent.click(dots[4])
    expect(index()).toBe(4)
    const entries = [...document.querySelectorAll('[data-presentation-toc-entry]')]
    expect(entries.map((e) => e.textContent)).toEqual(['a', 'b', 'a'])
    fireEvent.click(entries[1])
    expect(index()).toBe(2)
    fireEvent.click(entries[2])
    expect(index()).toBe(4)
    fireEvent.click(entries[0])
    expect(index()).toBe(0)
  })

  it('marks exactly the active progress item and ToC entry as current', () => {
    const era = (i: number) => ['a', 'a', 'b', 'b', 'c', 'c'][i]
    render(<Presentation title="Deck" steps={makeSteps(6, { era })} initialMode="browse" />)
    const check = (active: number, section: number) => {
      const dots = [...document.querySelectorAll('[data-presentation-progress-item]')]
      dots.forEach((dot, i) => {
        expect(dot.getAttribute('aria-current')).toBe(i === active ? 'step' : null)
        expect(dot.getAttribute('data-presentation-active')).toBe(i === active ? 'true' : null)
      })
      const entries = [...document.querySelectorAll('[data-presentation-toc-entry]')]
      entries.forEach((entry, i) => {
        expect(entry.getAttribute('aria-current')).toBe(i === section ? 'true' : null)
        expect(entry.getAttribute('data-presentation-active')).toBe(i === section ? 'true' : null)
      })
    }
    check(0, 0)
    press('ArrowRight')
    press('ArrowRight')
    check(2, 1)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-item]')[5])
    check(5, 2)
  })
})

describe('attribution and branding', () => {
  it('shows the default attribution link with a styling hook', () => {
    show()
    const link = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
    expect(DEFAULT_ATTRIBUTION.label).toBe(link.textContent)
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
  })

  it('supports overriding or omitting the attribution', () => {
    const view = show({ attribution: { label: 'mine', href: 'https://example.com' } })
    expect(document.querySelector('[data-presentation-attribution]')?.textContent).toBe('mine')
    view.rerender(<Presentation title="Deck" steps={makeSteps(2)} attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand, and renders host branding when supplied', () => {
    const view = show({ initialMode: 'browse' })
    const header = document.querySelector('[data-presentation-header]') as HTMLElement
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    expect(within(header).queryAllByRole('link')).toHaveLength(0)
    expect(header.textContent).not.toMatch(/and-scene/i)
    view.rerender(
      <Presentation title="Deck" steps={makeSteps(2)} brand={<a href="/">Host</a>} initialMode="browse" />,
    )
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('Host')
    expect(document.querySelectorAll('[data-presentation-header] a')).toHaveLength(1)
  })
})

describe('scene hosting', () => {
  it('keeps one scene instance across grouped steps, updating the payload in place', () => {
    render(<Presentation title="Deck" steps={makeSteps(4, { groupKey: 'g' })} initialMode="browse" />)
    const scene = () => screen.getByTestId('scene')
    expect(scene().textContent).toBe('payload 1')
    const instance = scene().dataset.instance
    press('ArrowRight')
    press('ArrowRight')
    expect(scene().textContent).toBe('payload 3')
    expect(scene().dataset.instance).toBe(instance)
    press('ArrowLeft')
    expect(scene().textContent).toBe('payload 2')
    expect(mounts.count).toBe(1)
  })

  it('mounts a fresh instance for ungrouped steps and when the group changes', async () => {
    const grouped = makeSteps(2, { groupKey: 'g' })
    const other = makeSteps(2, { groupKey: 'h' })
    render(<Presentation title="Deck" steps={[...grouped, ...other]} initialMode="browse" />)
    press('ArrowRight')
    expect(mounts.count).toBe(1)
    press('ArrowRight')
    expect(mounts.count).toBe(2)
    press('ArrowRight')
    expect(mounts.count).toBe(2)
    cleanup()
    mounts.count = 0
    render(<Presentation title="Deck" steps={makeSteps(3)} initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    expect(mounts.count).toBe(3)
  })

  it('treats a different Scene component in the same group as a new instance', () => {
    function OtherScene() {
      return <div data-testid="other" />
    }
    const [a] = makeSteps(1, { groupKey: 'g' })
    const b = { ...a, id: 'other', sceneId: a.sceneId + 100, render: () => <OtherScene /> }
    render(<Presentation title="Deck" steps={[a, b]} initialMode="browse" />)
    expect(mounts.count).toBe(1)
    press('ArrowRight')
    expect(screen.getByTestId('other')).toBeTruthy()
    void CountingScene
  })

  it('retains scene state within a group when switching modes, without remounting', () => {
    render(<Presentation title="Deck" steps={makeSteps(3, { groupKey: 'g' })} initialMode="browse" />)
    press('ArrowRight')
    press('p')
    press('p')
    expect(mounts.count).toBe(1)
    expect(screen.getByTestId('scene').textContent).toBe('payload 2')
  })

  it('stays correct under StrictMode: one keypress moves one step and listeners are cleaned up', () => {
    const view = render(
      <StrictMode>
        <Presentation title="Deck" steps={makeSteps(6)} initialMode="browse" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(index()).toBe(1)
    fireEvent.touchStart(window, { touches: [{ clientX: 300, clientY: 0 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 200, clientY: 0 }] })
    expect(index()).toBe(2)
    view.unmount()
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-root]')).toBeNull()
    render(
      <StrictMode>
        <Presentation title="Deck" steps={makeSteps(6)} initialMode="browse" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(index()).toBe(1)
  })
})
