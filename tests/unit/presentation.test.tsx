import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit/index.ts'
import { ATTRIBUTION_HREF } from '../../src/presentation-kit/index.ts'
import { counters, key, makeSteps, mode, resetCounters, root, setViewport, stepIndex, swipe } from './helpers.tsx'

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
const qa = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)]

const mountPresentation = (props: Partial<Parameters<typeof Presentation>[0]> = {}, n = 6, eras?: (i: number) => string) =>
  render(<Presentation steps={makeSteps(n, { eras })} title="Fixture" {...(props as object)} />)

beforeEach(() => {
  resetCounters()
  setViewport(1400, 900)
})

describe('modes and chrome', () => {
  it('opens in the declared initial mode and defaults to browse', () => {
    mountPresentation({ initialMode: 'present' })
    expect(mode()).toBe('present')
    cleanupAndRemount()
    expect(mode()).toBe('browse')
  })

  function cleanupAndRemount() {
    document.body.innerHTML = ''
    mountPresentation()
  }

  it('present mode shows marker and one-line title and hides caption, ToC, and prev/next', () => {
    for (const width of [1400, 500]) {
      setViewport(width)
      const { unmount } = mountPresentation({ initialMode: 'present' })
      expect(q('[data-presentation-marker]')?.textContent).toBe('1 / 6')
      const titles = qa('[data-presentation-title]')
      expect(titles).toHaveLength(1)
      expect(titles[0].textContent).toBe('Title 0')
      expect(titles[0].style.whiteSpace).toBe('nowrap')
      for (const hidden of ['caption', 'toc', 'prev', 'next', 'progress']) {
        expect(q(`[data-presentation-${hidden}]`), hidden).toBeNull()
      }
      key('ArrowRight')
      expect(q('[data-presentation-title]')?.textContent).toBe('Title 1')
      expect(q('[data-presentation-marker]')?.textContent).toBe('2 / 6')
      unmount()
    }
  })

  it('browse mode shows title, caption, progress, prev/next, and the ToC only on wide viewports', () => {
    mountPresentation()
    expect(q('[data-presentation-header] [data-presentation-title]')?.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 0')
    expect(qa('[data-presentation-progress-item]')).toHaveLength(6)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(q('[data-presentation-toc]')).not.toBeNull()
    setViewport(1023)
    expect(q('[data-presentation-toc]')).toBeNull()
    setViewport(1024)
    expect(q('[data-presentation-toc]')).not.toBeNull()
    setViewport(320)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 0')
  })

  it('lets the caption wrap: no truncation styles on the caption', () => {
    mountPresentation()
    const caption = q('[data-presentation-caption]')!
    expect(caption.style.whiteSpace).toBe('')
    expect(caption.style.textOverflow).toBe('')
    expect(caption.style.overflow).toBe('')
  })

  it('toggles mode with P and with the mode control while keeping the step', () => {
    mountPresentation({ initialMode: 'browse' })
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(mode()).toBe('present')
    expect(stepIndex()).toBe(2)
    expect(q('[data-testid="scene"]')?.textContent).toBe('payload 2')
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(mode()).toBe('browse')
    expect(stepIndex()).toBe(2)
    key('P')
    expect(mode()).toBe('present')
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    expect(mode()).toBe('browse')
    expect(stepIndex()).toBe(2)
  })

  it('exposes step count and index hooks, in both modes, updated on navigation', () => {
    mountPresentation()
    expect(root().getAttribute('data-step-count')).toBe('6')
    key('ArrowRight')
    expect(stepIndex()).toBe(1)
    key('p')
    expect(root().getAttribute('data-step-count')).toBe('6')
    expect(stepIndex()).toBe(1)
    fireEvent.click(q('[data-presentation-mode-toggle]')!)
    fireEvent.click(q('[data-presentation-next]')!)
    expect(stepIndex()).toBe(2)
  })

  it('renders nothing for an empty step list', () => {
    render(<Presentation steps={[]} title="Empty" />)
    expect(root()).toBeNull()
  })
})

describe('branding and attribution', () => {
  it('shows the default bottom-right attribution in both modes', () => {
    for (const initialMode of ['browse', 'present'] as const) {
      const { unmount } = mountPresentation({ initialMode })
      const links = qa('[data-presentation-attribution]')
      expect(links).toHaveLength(1)
      expect(links[0].tagName).toBe('A')
      expect(links[0].textContent).toBe('made by and-scene')
      expect(links[0].getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(ATTRIBUTION_HREF).toBe('https://github.com/Codagent-AI/and-scene')
      expect(links[0].style.position).toBe('fixed')
      expect(links[0].style.right).toBe('0px')
      expect(links[0].style.bottom).toBe('0px')
      expect(links[0].style.left).toBe('')
      expect(links[0].style.top).toBe('')
      unmount()
    }
  })

  it('has no default top-left brand, and renders a host brand in that slot', () => {
    const { unmount } = mountPresentation()
    const slot = q('[data-presentation-brand-slot]')!
    expect(slot.querySelector('a')).toBeNull()
    expect(slot.textContent).toBe('')
    expect(q('[data-presentation-header]')?.textContent).not.toContain('and-scene')
    unmount()
    mountPresentation({ brand: <a href="/home">My Brand</a> })
    expect(within(q('[data-presentation-brand-slot]')!).getByText('My Brand')).toBeTruthy()
    expect(q('[data-presentation-header] [data-presentation-attribution]')).toBeNull()
  })

  it('lets the host replace or remove the attribution', () => {
    const { unmount } = mountPresentation({ attribution: null })
    expect(q('[data-presentation-attribution]')).toBeNull()
    unmount()
    mountPresentation({ attribution: <span data-presentation-attribution="">custom</span> })
    expect(q('[data-presentation-attribution]')?.textContent).toBe('custom')
  })
})

describe('keyboard, touch, controls, and boundaries', () => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%j advances exactly one step in both modes', (k) => {
    mountPresentation({ initialMode: 'browse' }, 6)
    key('ArrowRight')
    key(k)
    expect(stepIndex()).toBe(2)
    key('p')
    key(k)
    expect(stepIndex()).toBe(3)
  })

  it.each([['ArrowLeft'], ['PageUp']])('%s goes back exactly one step', (k) => {
    mountPresentation()
    key('ArrowRight')
    key('ArrowRight')
    key(k)
    expect(stepIndex()).toBe(1)
  })

  it('handles swipes: left advances, right goes back, short and vertical gestures do nothing', () => {
    mountPresentation()
    swipe(-120)
    expect(stepIndex()).toBe(1)
    swipe(120)
    expect(stepIndex()).toBe(0)
    swipe(-30)
    swipe(-100, 140)
    expect(stepIndex()).toBe(0)
  })

  it('clamps at both ends with every input, without wrapping', () => {
    mountPresentation({}, 3)
    key('ArrowLeft')
    key('PageUp')
    swipe(120)
    fireEvent.click(q('[data-presentation-prev]')!)
    expect(stepIndex()).toBe(0)
    for (const k of ['ArrowRight', ' ', 'PageDown']) key(k)
    expect(stepIndex()).toBe(2)
    swipe(-120)
    fireEvent.click(q('[data-presentation-next]')!)
    expect(stepIndex()).toBe(2)
    expect(q('[data-testid="scene"]')?.textContent).toBe('payload 2')
  })

  it('clamps a one-step presentation both ways', () => {
    mountPresentation({}, 1)
    key('ArrowRight')
    key('ArrowLeft')
    fireEvent.click(q('[data-presentation-next]')!)
    expect(stepIndex()).toBe(0)
  })

  it('moves with the prev/next controls', () => {
    mountPresentation()
    fireEvent.click(q('[data-presentation-next]')!)
    fireEvent.click(q('[data-presentation-next]')!)
    expect(stepIndex()).toBe(2)
    fireEvent.click(q('[data-presentation-prev]')!)
    expect(stepIndex()).toBe(1)
  })

  it('does not move the deck for navigation keys on focused controls', () => {
    mountPresentation({
      brand: (
        <div>
          <button id="b">b<span id="child">c</span></button>
          <a id="l" href="/x">l</a>
          <input id="i" />
          <textarea id="t" />
          <select id="s"><option>o</option></select>
          <div id="ce" contentEditable="true" />
          <div id="pt" contentEditable="plaintext-only" />
        </div>
      ),
    })
    for (const id of ['b', 'child', 'l', 'i', 't', 's', 'ce', 'pt']) {
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
        const target = document.getElementById(id)!
        const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
        act(() => {
          target.dispatchEvent(event)
        })
        expect(event.defaultPrevented, `${id} ${k}`).toBe(false)
      }
      expect(stepIndex(), id).toBe(0)
      expect(mode(), id).toBe('browse')
    }
    const body = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    act(() => {
      document.body.dispatchEvent(body)
    })
    expect(stepIndex()).toBe(1)
    expect(body.defaultPrevented).toBe(true)
  })

  it('ignores navigation keys combined with modifier keys', () => {
    mountPresentation()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }))
    })
    expect(stepIndex()).toBe(0)
  })

  it('removes its listeners on unmount', () => {
    const { unmount } = mountPresentation()
    unmount()
    key('ArrowRight')
    expect(root()).toBeNull()
  })

  it('moves exactly one step per event under StrictMode and cleans up its effects', () => {
    const { unmount } = render(
      <StrictMode>
        <Presentation steps={makeSteps(5)} title="S" />
      </StrictMode>,
    )
    key('ArrowRight')
    expect(stepIndex()).toBe(1)
    swipe(-100)
    expect(stepIndex()).toBe(2)
    key('p')
    expect(mode()).toBe('present')
    unmount()
    expect(counters.mounts).toBe(counters.unmounts)
  })
})

describe('order-derived numbering (rendered)', () => {
  const view = (ids: string[]) => (
    <Presentation
      steps={ids.map((id) => ({ ...makeSteps(1)[0], id, title: `T-${id}`, caption: `C-${id}` }))}
      title="N"
    />
  )
  const marker = () => q('[data-presentation-marker]')?.textContent
  const dotLabels = () => qa('[data-presentation-progress-item]').map((d) => d.getAttribute('aria-label'))

  it('renumbers the marker and progress labels after insertion, removal, and reordering, with unrelated ids', () => {
    const { rerender } = render(view(['zeta', 'alpha', 'mid']))
    key('ArrowRight')
    expect(marker()).toBe('2 / 3')
    expect(dotLabels()).toEqual(['Step 1: T-zeta', 'Step 2: T-alpha', 'Step 3: T-mid'])
    rerender(view(['zeta', 'new', 'alpha', 'mid']))
    expect(marker()).toBe('2 / 4')
    expect(dotLabels()).toEqual(['Step 1: T-zeta', 'Step 2: T-new', 'Step 3: T-alpha', 'Step 4: T-mid'])
    rerender(view(['mid', 'zeta', 'alpha']))
    expect(marker()).toBe('2 / 3')
    expect(dotLabels()).toEqual(['Step 1: T-mid', 'Step 2: T-zeta', 'Step 3: T-alpha'])
    rerender(view(['alpha']))
    expect(marker()).toBe('1 / 1')
    expect(dotLabels()).toEqual(['Step 1: T-alpha'])
    expect(qa('[data-presentation-progress-item]')).toHaveLength(1)
  })
})

describe('direct jumps and active state', () => {
  const eras = (i: number) => ['one', 'one', 'two', 'two', 'two', 'three'][i]

  it('jumps via progress items to any step, backwards included', () => {
    mountPresentation({}, 6, eras)
    const dots = () => qa('[data-presentation-progress-item]')
    fireEvent.click(dots()[4])
    expect(stepIndex()).toBe(4)
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 4')
    fireEvent.click(dots()[1])
    expect(stepIndex()).toBe(1)
    fireEvent.click(dots()[5])
    expect(stepIndex()).toBe(5)
  })

  it('jumps via every ToC entry to the first step of that era', () => {
    mountPresentation({}, 6, eras)
    const entries = () => qa('[data-presentation-toc-item]')
    expect(entries().map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(entries()[1])
    expect(stepIndex()).toBe(2)
    fireEvent.click(entries()[2])
    expect(stepIndex()).toBe(5)
    fireEvent.click(entries()[0])
    expect(stepIndex()).toBe(0)
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    fireEvent.click(entries()[1])
    expect(stepIndex()).toBe(2)
  })

  it('marks exactly one progress item and one ToC entry current, and only those', () => {
    mountPresentation({}, 6, eras)
    const check = (step: number, era: number) => {
      const dots = qa('[data-presentation-progress-item]')
      const current = dots.filter((d) => d.getAttribute('aria-current') === 'step')
      expect(current).toHaveLength(1)
      expect(dots.indexOf(current[0])).toBe(step)
      expect(dots.filter((d) => d.hasAttribute('data-presentation-active'))).toEqual(current)
      expect(current[0].getAttribute('data-presentation-active')).toBe('true')
      const toc = qa('[data-presentation-toc-item]')
      const active = toc.filter((d) => d.getAttribute('aria-current') === 'step')
      expect(active).toHaveLength(1)
      expect(toc.indexOf(active[0])).toBe(era)
      expect(toc.filter((d) => d.hasAttribute('data-presentation-active'))).toEqual(active)
    }
    check(0, 0)
    key('ArrowRight')
    check(1, 0)
    key('ArrowRight')
    check(2, 1)
    key('ArrowLeft')
    check(1, 0)
    fireEvent.click(qa('[data-presentation-progress-item]')[5])
    check(5, 2)
    fireEvent.click(qa('[data-presentation-toc-item]')[1])
    check(2, 1)
  })

  it('numbers progress items accessibly by position', () => {
    mountPresentation({}, 3)
    expect(qa('[data-presentation-progress-item]').map((d) => d.getAttribute('aria-label'))).toEqual([
      'Step 1: Title 0', 'Step 2: Title 1', 'Step 3: Title 2',
    ])
    expect(screen.getByRole('region', { name: 'Fixture' })).toBe(root())
  })
})
