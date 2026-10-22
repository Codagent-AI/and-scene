import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation.tsx'
import { ATTRIBUTION_HREF, ATTRIBUTION_LABEL, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../constants.ts'
import { Header } from '../chrome/Header.tsx'
import { key, makeSteps, setViewport, swipe } from './helpers.ts'
import type { TestPayload } from './testTypes.ts'

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const q = (selector: string) => document.querySelector(selector)
const qa = (selector: string) => [...document.querySelectorAll(selector)]

beforeEach(() => setViewport(1280, 800))
afterEach(cleanup)

function renderDeck(props: Partial<React.ComponentProps<typeof Presentation<TestPayload>>> = {}) {
  return render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" {...props} />)
}

describe('chrome step hooks', () => {
  it('reports the step count and tracks the active index', () => {
    renderDeck()
    expect(root().dataset.stepCount).toBe('6')
    expect(root().dataset.stepIndex).toBe('0')
    key('ArrowRight')
    expect(root().dataset.stepIndex).toBe('1')
    key('ArrowLeft')
    expect(root().dataset.stepIndex).toBe('0')
    fireEvent.click(qa('[data-presentation-progress-dot]')[4])
    expect(root().dataset.stepIndex).toBe('4')
    key('p')
    expect(root().dataset.stepIndex).toBe('4')
  })
})

describe('order-derived numbering', () => {
  const numbers = () => q('[data-presentation-number]')?.textContent
  const steps = makeSteps(4)

  it('shows the number from the position after insert, remove and reorder', () => {
    const view = renderDeck({ steps })
    key('ArrowRight')
    expect(numbers()).toBe('2')
    expect(screen.getByText('Title 1')).toBeTruthy()

    const inserted = { ...steps[0], id: 'new', title: 'New' }
    view.rerender(<Presentation steps={[inserted, ...steps]} title="Deck" initialMode="browse" />)
    expect(numbers()).toBe('2')
    expect(screen.getByText('Title 0')).toBeTruthy()

    view.rerender(<Presentation steps={[steps[3], steps[2], steps[1], steps[0]]} title="Deck" initialMode="browse" />)
    expect(numbers()).toBe('2')
    expect(screen.getByText('Title 2')).toBeTruthy()

    view.rerender(<Presentation steps={[steps[1]]} title="Deck" initialMode="browse" />)
    expect(numbers()).toBe('1')
    expect(root().dataset.stepCount).toBe('1')
  })
})

describe('present mode', () => {
  it('shows the marker and one-line title and hides the browse chrome', () => {
    renderDeck({ initialMode: 'present' })
    expect(root().dataset.presentationMode).toBe('present')
    expect(q('[data-presentation-number]')?.textContent).toBe('1')
    expect(q('[data-presentation-era]')?.textContent).toBe('alpha')
    const titles = qa('[data-presentation-title]')
    expect(titles).toHaveLength(1)
    expect(titles[0].textContent).toBe('Title 0')
    expect((titles[0] as HTMLElement).style.whiteSpace).toBe('nowrap')
    for (const hidden of ['caption', 'toc', 'progress', 'prev', 'next']) {
      expect(q(`[data-presentation-${hidden}]`)).toBeNull()
    }
  })
})

describe('browse mode', () => {
  it('shows title, caption, progress and prev/next, and the table of contents on wide viewports', () => {
    renderDeck()
    expect(root().dataset.presentationMode).toBe('browse')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 0')
    expect(qa('[data-presentation-progress-dot]')).toHaveLength(6)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('shows the table of contents from 1024px and hides it below, including on resize', () => {
    setViewport(1023, 800)
    renderDeck()
    expect(q('[data-presentation-toc]')).toBeNull()
    setViewport(1024, 800)
    expect(q('[data-presentation-toc]')).not.toBeNull()
    setViewport(500, 800)
    expect(q('[data-presentation-toc]')).toBeNull()
  })

  it('lets the caption wrap and show whole paragraphs', () => {
    renderDeck()
    const caption = q('[data-presentation-caption]') as HTMLElement
    expect(caption.style.whiteSpace).not.toBe('nowrap')
  })
})

describe('mode toggle', () => {
  it('switches modes on P and stays on the current step', () => {
    renderDeck({ initialMode: 'present' })
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(root().dataset.presentationMode).toBe('browse')
    expect(root().dataset.stepIndex).toBe('2')
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 2')
    key('p')
    expect(root().dataset.presentationMode).toBe('present')
    expect(root().dataset.stepIndex).toBe('2')
  })
})

describe('direct jump and active semantics', () => {
  it('jumps to the chosen progress step', () => {
    renderDeck()
    fireEvent.click(qa('[data-presentation-progress-dot]')[4])
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 4')
    fireEvent.click(qa('[data-presentation-progress-dot]')[1])
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption 1')
  })

  it('jumps to the first step of an era from the table of contents', () => {
    renderDeck()
    const entries = qa('[data-presentation-toc-entry]')
    expect(entries.map((e) => e.textContent)).toEqual(['alpha', 'beta', 'gamma'])
    fireEvent.click(entries[1])
    expect(root().dataset.stepIndex).toBe('2')
    fireEvent.click(entries[2])
    expect(root().dataset.stepIndex).toBe('5')
    fireEvent.click(entries[0])
    expect(root().dataset.stepIndex).toBe('0')
  })

  it('exposes current state and the active hook on exactly the active entries', () => {
    renderDeck()
    const check = (step: number, era: number) => {
      const dots = qa('[data-presentation-progress-dot]')
      dots.forEach((dot, i) => {
        expect(dot.getAttribute('aria-current')).toBe(i === step ? 'step' : null)
        expect(dot.getAttribute('data-presentation-active')).toBe(i === step ? 'true' : null)
      })
      qa('[data-presentation-toc-entry]').forEach((entry, i) => {
        expect(entry.getAttribute('aria-current')).toBe(i === era ? 'true' : null)
        expect(entry.getAttribute('data-presentation-active')).toBe(i === era ? 'true' : null)
      })
    }
    check(0, 0)
    key('ArrowRight')
    check(1, 0)
    key('ArrowRight')
    check(2, 1)
    fireEvent.click(qa('[data-presentation-progress-dot]')[5])
    check(5, 2)
  })

  it('releases focus after a pointer click so the arrow keys keep navigating', () => {
    renderDeck()
    const next = q('[data-presentation-next]') as HTMLButtonElement
    next.focus()
    fireEvent.click(next, { detail: 1 })
    expect(document.activeElement).not.toBe(next)
    key('ArrowRight')
    expect(root().dataset.stepIndex).toBe('2')
  })
})

describe('boundaries across inputs', () => {
  it('stays on the first and last step for keys, swipes and on-screen controls', () => {
    renderDeck({ steps: makeSteps(3) })
    key('ArrowLeft')
    swipe(150)
    fireEvent.click(q('[data-presentation-prev]') as HTMLElement)
    expect(root().dataset.stepIndex).toBe('0')
    expect((q('[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(q('[data-presentation-next]') as HTMLElement)
    fireEvent.click(q('[data-presentation-next]') as HTMLElement)
    expect(root().dataset.stepIndex).toBe('2')
    key('ArrowRight')
    swipe(-150)
    fireEvent.click(q('[data-presentation-next]') as HTMLElement)
    expect(root().dataset.stepIndex).toBe('2')
    fireEvent.click(q('[data-presentation-prev]') as HTMLElement)
    expect(root().dataset.stepIndex).toBe('1')
  })

  it('renders nothing for an empty deck', () => {
    renderDeck({ steps: [] })
    expect(root()).toBeNull()
  })
})

describe('captions', () => {
  it('shows each step caption in browse mode', () => {
    renderDeck()
    for (let i = 0; i < 6; i += 1) {
      expect(q('[data-presentation-caption]')?.textContent).toBe(`Caption ${i}`)
      key('ArrowRight')
    }
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution with its hook', () => {
    renderDeck()
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe(ATTRIBUTION_LABEL)
    expect(ATTRIBUTION_LABEL).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_HREF)
    expect(ATTRIBUTION_HREF).toMatch(/^https:\/\/github\.com\/[^/]+\/and-scene$/)
    expect(link.style.position).toBe('fixed')
    expect(link.style.right).not.toBe('')
    expect(link.style.bottom).not.toBe('')
    expect(link.style.left).toBe('')
    expect(link.style.top).toBe('')
    expect(root().contains(link)).toBe(true)
  })

  it('can drop the attribution', () => {
    renderDeck({ attribution: false })
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('renders no and-scene brand link by default', () => {
    renderDeck()
    expect(q('[data-presentation-brand]')).toBeNull()
    const header = q('[data-presentation-header]') as HTMLElement
    expect(within(header).queryByText(/and-scene/i)).toBeNull()
    expect(header.querySelector('a')).toBeNull()
  })

  it('renders a host-provided brand in the header and no second brand', () => {
    renderDeck({ brand: <a href="/home">Acme</a> })
    const brand = q('[data-presentation-brand]') as HTMLElement
    expect(brand.textContent).toBe('Acme')
    expect(qa('[data-presentation-header] a')).toHaveLength(1)
    expect(qa('[data-presentation-attribution]')).toHaveLength(1)
  })

  it('Header with no brand prop has no brand slot', () => {
    render(<Header mode="browse" number={1} era="e" title="t" />)
    expect(q('[data-presentation-brand]')).toBeNull()
  })
})

describe('fixed canvas', () => {
  const canvas = () => q('[data-presentation-canvas]') as HTMLElement
  const scale = () => Number(canvas().dataset.presentationScale)

  it('uses the default 880 x 380 canvas', () => {
    renderDeck()
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    expect(canvas().style.height).toBe(`${DESIGN_H}px`)
  })

  it('recomputes one uniform scale on resize without resizing the canvas', () => {
    renderDeck()
    const before = scale()
    setViewport(700, 800)
    expect(scale()).toBeLessThan(before)
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    expect(canvas().style.height).toBe(`${DESIGN_H}px`)
    expect(canvas().style.transform).toMatch(/scale\(/)
    expect(canvas().style.transform).not.toMatch(/scale\([^)]*,/)
  })

  it('centres the scaled canvas without a percentage translate, which skews layout morphs', () => {
    renderDeck()
    // Motion re-measures a scaled ancestor that carries a percentage translate, so every persisting
    // entity lurched on each step change; the canvas must be centred with margins and only scaled.
    expect(canvas().style.transform).not.toMatch(/translate/)
    expect(canvas().style.transform).not.toContain('%')
    expect(canvas().style.marginLeft).toBe(`${-DESIGN_W / 2}px`)
    expect(canvas().style.marginTop).toBe(`${-DESIGN_H / 2}px`)
  })

  it('keeps one scale across steps with different content, within a mode', () => {
    renderDeck()
    const first = scale()
    key('ArrowRight')
    key('ArrowRight')
    expect(scale()).toBe(first)
  })

  it('selects the active mode geometry and does not change step on a mode switch', () => {
    renderDeck({ initialMode: 'present' })
    const stage = q('[data-presentation-stage]') as HTMLElement
    expect(stage.style.top).toBe(`${STAGE_LAYOUT.present.top}px`)
    key('ArrowRight')
    key('p')
    expect(stage.style.top).toBe(`${STAGE_LAYOUT.browse.top}px`)
    expect(root().dataset.stepIndex).toBe('1')
  })

  it('passes the active step payload and index to the scene', () => {
    renderDeck()
    key('ArrowRight')
    act(() => {})
    const scene = screen.getByTestId('scene')
    expect(scene.textContent).toBe('payload 1')
    expect(scene.getAttribute('data-step-index-seen')).toBe('1')
  })
})
