import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation, tocEntries, type Step } from '../../src/presentation-kit'
import { ListScene, OtherScene, makeSteps, setViewport, type Payload } from '../support/fixtures'

const root = (c: HTMLElement) => c.querySelector('[data-presentation-root]') as HTMLElement
const q = <T extends Element>(c: ParentNode, sel: string) => c.querySelector(sel) as T
const qa = (c: ParentNode, sel: string) => [...c.querySelectorAll(sel)]
const ERAS = ['one', 'one', 'two', 'three', 'three', 'three']

beforeEach(() => setViewport(1440, 900))

describe('step model', () => {
  it('shows the active step identity, era, title, caption, and scene state together', () => {
    const steps = makeSteps(3, ['alpha', 'beta', 'beta'])
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const check = (n: number) => {
      const r = root(container)
      expect(r.dataset.presentationStepId).toBe(`s${n}`)
      expect(r.dataset.presentationStepEra).toBe(steps[n - 1].era)
      expect(q(container, '[data-presentation-step-title]').textContent).toBe(`Title ${n}`)
      expect(q(container, '[data-presentation-step-caption]').textContent).toContain(`Caption ${n}`)
      expect(qa(container, '[data-testid="list-scene"] li')).toHaveLength(n)
    }
    check(1)
    fireEvent.click(q(container, '[data-presentation-next]'))
    check(2)
    fireEvent.click(q(container, '[data-presentation-next]'))
    check(3)
  })

  it('derives displayed numbers from position when steps are inserted, removed, or reordered', () => {
    const original = makeSteps(3)
    const markers = (c: HTMLElement) => qa(c, '[data-presentation-progress-dot]').map((d) => d.getAttribute('aria-label'))
    const { container, rerender } = render(<Presentation steps={original} title="Deck" />)
    expect(markers(container)).toEqual(['Step 1: Title 1', 'Step 2: Title 2', 'Step 3: Title 3'])
    const inserted = [original[0], { ...original[1], id: 'new', title: 'New' }, original[1], original[2]]
    rerender(<Presentation steps={inserted} title="Deck" />)
    expect(markers(container)).toEqual(['Step 1: Title 1', 'Step 2: New', 'Step 3: Title 2', 'Step 4: Title 3'])
    expect(q(container, '[data-presentation-marker]').textContent).toBe('1 / 4')
    rerender(<Presentation steps={[original[2], original[0]]} title="Deck" />)
    expect(markers(container)).toEqual(['Step 1: Title 3', 'Step 2: Title 1'])
    expect(qa(container, '[data-presentation-progress-dot]')).toHaveLength(2)
  })

  it('keeps stable ids across reordering', () => {
    const [a, b] = makeSteps(2)
    const { container, rerender } = render(<Presentation steps={[a, b]} title="Deck" />)
    expect(root(container).dataset.presentationStepId).toBe('s1')
    rerender(<Presentation steps={[b, a]} title="Deck" />)
    expect(root(container).dataset.presentationStepId).toBe('s2')
  })
})

describe('chrome hooks', () => {
  it('exposes accurate data-step-count and data-step-index through every navigation path', () => {
    const { container } = render(<Presentation steps={makeSteps(6, ERAS)} title="Deck" />)
    const r = root(container)
    const state = () => [r.dataset.stepCount, r.dataset.stepIndex, q(container, '[data-presentation-step-title]').textContent]
    expect(state()).toEqual(['6', '0', 'Title 1'])
    fireEvent.click(q(container, '[data-presentation-next]'))
    expect(state()).toEqual(['6', '1', 'Title 2'])
    fireEvent.click(qa(container, '[data-presentation-progress-dot]')[5])
    expect(state()).toEqual(['6', '5', 'Title 6'])
    fireEvent.click(q(container, '[data-presentation-prev]'))
    expect(state()).toEqual(['6', '4', 'Title 5'])
    fireEvent.click(q(container, '[data-presentation-mode-toggle]'))
    expect(state()).toEqual(['6', '4', 'Title 5'])
  })
})

describe('present mode', () => {
  it('shows marker and one-line title only, with caption, toc, and prev/next absent', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="Deck" initialMode="present" />)
    expect(root(container).dataset.presentationMode).toBe('present')
    expect(q(container, '[data-presentation-marker]').textContent).toBe('1 / 3')
    expect(q(container, '[data-presentation-step-title]').textContent).toBe('Title 1')
    for (const hidden of ['step-caption', 'toc', 'prev', 'next', 'progress-dot', 'title']) {
      expect(container.querySelector(`[data-presentation-${hidden}]`)).toBeNull()
    }
    expect(container.textContent).not.toContain('Caption 1')
    expect(screen.queryByRole('button', { name: /next|previous/i })).toBeNull()
  })
})

describe('browse mode', () => {
  it('shows title, multi-line caption, toc, prev/next, and progress at wide width', () => {
    const { container } = render(<Presentation steps={makeSteps(4, ['a', 'a', 'b', 'b'])} title="Deck title" initialMode="browse" />)
    expect(q(container, '[data-presentation-title]').textContent).toBe('Deck title')
    expect(q(container, '[data-presentation-step-caption]').textContent).toBe('Caption 1 first line. Second line of the caption.')
    expect(q(container, '[data-presentation-toc]')).not.toBeNull()
    expect(q(container, '[data-presentation-prev]')).not.toBeNull()
    expect(q(container, '[data-presentation-next]')).not.toBeNull()
    expect(qa(container, '[data-presentation-progress-dot]')).toHaveLength(4)
  })

  it('hides the table of contents at narrow widths but keeps caption and navigation', () => {
    setViewport(600, 800)
    const { container } = render(<Presentation steps={makeSteps(3)} title="Deck" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(q(container, '[data-presentation-step-caption]')).not.toBeNull()
    expect(q(container, '[data-presentation-next]')).not.toBeNull()
    expect(qa(container, '[data-presentation-progress-dot]')).toHaveLength(3)
  })

  it('shows each step caption in turn and navigates both ways with disabled end controls', () => {
    const { container } = render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const prev = q<HTMLButtonElement>(container, '[data-presentation-prev]')
    const next = q<HTMLButtonElement>(container, '[data-presentation-next]')
    expect(prev.disabled).toBe(true)
    for (const n of [2, 3]) {
      fireEvent.click(next)
      expect(q(container, '[data-presentation-step-caption]').textContent).toContain(`Caption ${n}`)
    }
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(root(container).dataset.stepIndex).toBe('2')
    fireEvent.click(prev)
    expect(q(container, '[data-presentation-step-caption]').textContent).toContain('Caption 2')
  })
})

describe('mode switching', () => {
  it.each(['browse', 'present'] as const)('honors initialMode=%s and toggles by button and P without moving', (initial) => {
    const { container } = render(<Presentation steps={makeSteps(5)} title="Deck" initialMode={initial} />)
    const r = root(container)
    expect(r.dataset.presentationMode).toBe(initial)
    const other = initial === 'browse' ? 'present' : 'browse'
    if (initial === 'browse') fireEvent.click(q(container, '[data-presentation-next]'))
    else fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(r.dataset.stepIndex).toBe('2')
    fireEvent.click(q(container, '[data-presentation-mode-toggle]'))
    expect(r.dataset.presentationMode).toBe(other)
    expect(r.dataset.stepIndex).toBe('2')
    expect(qa(container, '[data-testid="list-scene"] li')).toHaveLength(3)
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(r.dataset.presentationMode).toBe(initial)
    expect(r.dataset.stepIndex).toBe('2')
  })
})

describe('direct jumps and active state', () => {
  const steps = makeSteps(6, ERAS)

  it('progress dots jump to their exact step and toc entries to the first step of their era', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const r = root(container)
    qa(container, '[data-presentation-progress-dot]').forEach((dot, i) => {
      fireEvent.click(dot)
      expect(r.dataset.stepIndex).toBe(String(i))
    })
    const entries = qa(container, '[data-presentation-toc-entry]')
    expect(entries.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(entries[2])
    expect(r.dataset.stepIndex).toBe('3')
    fireEvent.click(entries[1])
    expect(r.dataset.stepIndex).toBe('2')
    fireEvent.click(entries[0])
    expect(r.dataset.stepIndex).toBe('0')
    expect(tocEntries(steps)).toEqual([
      { era: 'one', first: 0 },
      { era: 'two', first: 2 },
      { era: 'three', first: 3 },
    ])
  })

  it('exactly the active progress step and active era claim current state, across navigation and mode changes', () => {
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    const check = (index: number) => {
      const dots = qa(container, '[data-presentation-progress-dot]')
      dots.forEach((d, i) => {
        expect(d.getAttribute('aria-current')).toBe(i === index ? 'step' : null)
        expect(d.getAttribute('data-presentation-active')).toBe(i === index ? 'true' : null)
      })
      const era = steps[index].era
      for (const e of qa(container, '[data-presentation-toc-entry]')) {
        const active = e.textContent === era
        expect(e.getAttribute('aria-current')).toBe(active ? 'true' : null)
        expect(e.getAttribute('data-presentation-active')).toBe(active ? 'true' : null)
      }
    }
    check(0)
    fireEvent.click(q(container, '[data-presentation-next]'))
    check(1)
    fireEvent.click(qa(container, '[data-presentation-progress-dot]')[4])
    check(4)
    fireEvent.click(q(container, '[data-presentation-prev]'))
    check(3)
    fireEvent.click(q(container, '[data-presentation-mode-toggle]'))
    fireEvent.click(q(container, '[data-presentation-mode-toggle]'))
    check(3)
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right link in both modes with no style defaults', () => {
    for (const mode of ['browse', 'present'] as const) {
      const { container, unmount } = render(<Presentation steps={makeSteps(2)} title="Deck" initialMode={mode} />)
      const a = q<HTMLAnchorElement>(container, '[data-presentation-attribution]')
      expect(a.textContent).toBe('made by and-scene')
      expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(a.style.position).toBe('fixed')
      expect(a.style.right).toBe('0px')
      expect(a.style.bottom).toBe('0px')
      expect(a.style.color).toBe('')
      expect(a.style.fontSize).toBe('')
      unmount()
    }
  })

  it('can override or omit attribution', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" attribution={{ label: 'custom', href: 'https://example.test/' }} />)
    expect(q<HTMLAnchorElement>(container, '[data-presentation-attribution]').textContent).toBe('custom')
    rerender(<Presentation steps={makeSteps(2)} title="Deck" attribution={false} />)
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand but renders host-provided branding', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    const slot = q(container, '[data-presentation-brand-slot]')
    expect(slot.textContent).toBe('')
    expect(slot.querySelector('a')).toBeNull()
    expect(within(q(container, '[data-presentation-header]')).queryByRole('link')).toBeNull()
    expect(container.querySelector('[data-presentation-attribution]')).not.toBeNull()
    rerender(<Presentation steps={makeSteps(2)} title="Deck" brand={<a href="https://host.test/">Host</a>} />)
    expect(within(q(container, '[data-presentation-brand-slot]')).getByRole('link', { name: 'Host' })).not.toBeNull()
  })
})

describe('hook and style passthrough on chrome', () => {
  it('chrome pieces carry stable data-presentation hooks', () => {
    const { container } = render(<Presentation steps={makeSteps(3, ['a', 'a', 'b'])} title="Deck" className="mine" />)
    expect(root(container).classList.contains('mine')).toBe(true)
    for (const hook of ['header', 'footer', 'toc', 'stage', 'canvas', 'scene', 'marker', 'mode-toggle', 'prev', 'next', 'progress', 'toc-entry', 'progress-dot', 'attribution']) {
      expect(container.querySelector(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })
})

describe('typed payloads', () => {
  it('accepts a typed Step<Payload> array and supports changing Scene components', () => {
    const steps: Step<Payload>[] = [
      { id: 'a', era: 'e', title: 't', caption: 'c', Scene: ListScene, groupKey: 'g', payload: { items: ['x'] } },
      { id: 'b', era: 'e', title: 't2', caption: 'c2', Scene: OtherScene, payload: { items: ['y', 'z'] } },
    ]
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(container.querySelector('[data-testid="list-scene"]')).not.toBeNull()
    fireEvent.click(q(container, '[data-presentation-next]'))
    expect(container.querySelector('[data-testid="other-scene"]')?.textContent).toBe('y,z')
  })
})
