import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation.tsx'
import { key, makeSteps, setViewport } from './testing.tsx'

const steps = makeSteps(['one', 'one', 'two', 'three'])
const q = (selector: string) => document.querySelector<HTMLElement>(selector)
const root = () => q('[data-presentation-root]')!

describe('step model', () => {
  it('derives displayed numbers from position, not ids', () => {
    const view = render(<Presentation steps={steps} initialMode="browse" />)
    key('ArrowRight')
    expect(q('[data-presentation-number]')!.textContent).toBe('02')
    // Insert a step at the front: the same step id is now third.
    const inserted = [{ ...steps[0], id: 'new', title: 'New' }, ...steps]
    view.rerender(<Presentation steps={inserted} initialMode="browse" />)
    expect(q('[data-presentation-number]')!.textContent).toBe('02')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 0')
    // Reorder and remove: numbers follow positions.
    view.rerender(<Presentation steps={[steps[3], steps[2]]} initialMode="browse" />)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 2')
    expect(q('[data-presentation-number]')!.textContent).toBe('02')
    expect(root().getAttribute('data-step-count')).toBe('2')
  })

  it('hands the active step to its Scene', () => {
    render(<Presentation steps={steps} />)
    expect(screen.getByTestId('scene').textContent).toBe('s0')
  })
})

describe('present mode', () => {
  it('shows marker and title and hides caption, ToC, progress and prev/next', () => {
    setViewport(1440, 900)
    render(<Presentation steps={steps} initialMode="present" />)
    expect(q('[data-presentation-number]')!.textContent).toBe('01')
    expect(q('[data-presentation-era]')!.textContent).toBe('one')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 0')
    for (const hidden of ['caption', 'toc', 'progress', 'prev', 'next']) {
      expect(q(`[data-presentation-${hidden}]`)).toBeNull()
    }
  })
})

describe('browse mode', () => {
  it('shows title, caption, progress and prev/next, and the ToC from 1024px', () => {
    setViewport(1023, 800)
    render(<Presentation steps={steps} initialMode="browse" />)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 0')
    expect(q('[data-presentation-progress]')).not.toBeNull()
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    setViewport(1024, 800)
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('shows every caption in turn with working next/previous controls', () => {
    render(<Presentation steps={steps} initialMode="browse" />)
    const next = q('[data-presentation-next]') as HTMLButtonElement
    const prev = q('[data-presentation-prev]') as HTMLButtonElement
    for (let i = 0; i < steps.length; i++) {
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${i}`)
      expect(root().getAttribute('data-step-index')).toBe(String(i))
      if (i < steps.length - 1) act(() => next.click())
    }
    expect(next.disabled).toBe(true)
    for (let i = steps.length - 1; i >= 0; i--) {
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${i}`)
      if (i > 0) act(() => prev.click())
    }
    expect(prev.disabled).toBe(true)
  })
})

describe('direct jumps and active state', () => {
  it('jumps from progress indicators and from ToC entries to the first step of an era', () => {
    setViewport(1440, 900)
    render(<Presentation steps={steps} initialMode="browse" />)
    act(() => within(q('[data-presentation-progress]')!).getAllByRole('button')[3].click())
    expect(root().getAttribute('data-step-index')).toBe('3')
    act(() => within(q('[data-presentation-toc]')!).getByRole('button', { name: 'one' }).click())
    expect(root().getAttribute('data-step-index')).toBe('0')
    key('ArrowRight')
    // Active step is the second of era "one"; its ToC entry still jumps to the first.
    act(() => within(q('[data-presentation-toc]')!).getByRole('button', { name: 'one' }).click())
    expect(root().getAttribute('data-step-index')).toBe('0')
  })

  it('marks exactly the active progress dot and ToC entry, clearing stale state', () => {
    setViewport(1440, 900)
    render(<Presentation steps={steps} initialMode="browse" />)
    const active = () => [...document.querySelectorAll('[data-presentation-active="true"]')]
    const current = () => [...document.querySelectorAll('[aria-current="step"]')]
    expect(active()).toHaveLength(2)
    expect(current()).toHaveLength(2)
    key('ArrowRight')
    key('ArrowRight')
    const dots = [...document.querySelectorAll('[data-presentation-progress-dot]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.getAttribute('data-presentation-active'))).toEqual([null, null, 'true', null])
    const toc = [...document.querySelectorAll('[data-presentation-toc-entry]')]
    expect(toc.map((e) => e.getAttribute('aria-current'))).toEqual([null, 'step', null])
    expect(toc.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
  })
})

describe('hooks and branding', () => {
  it('exposes step-count and step-index hooks that follow navigation in both modes', () => {
    render(<Presentation steps={steps} initialMode="present" />)
    expect(root().getAttribute('data-step-count')).toBe('4')
    expect(root().getAttribute('data-step-index')).toBe('0')
    key('ArrowRight')
    key('p')
    expect(root().getAttribute('data-step-index')).toBe('1')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(q('[data-presentation-step]')!.getAttribute('data-presentation-step')).toBeTruthy()
  })

  it('shows the default attribution bottom-right with its hook, in both modes', () => {
    render(<Presentation steps={steps} initialMode="present" />)
    for (let i = 0; i < 2; i++) {
      const link = q('[data-presentation-attribution]') as HTMLAnchorElement
      expect(link.textContent).toBe('made by and-scene')
      expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(link.getAttribute('rel')).toBe('noopener')
      expect(link.getAttribute('target')).toBeNull()
      expect(link.style.right).toBe('0px')
      expect(link.style.bottom).toBe('0px')
      expect(link.style.position).toBe('fixed')
      key('p')
    }
  })

  it('allows the attribution to be overridden or omitted', () => {
    const view = render(<Presentation steps={steps} attribution={{ href: 'https://example.com', label: 'x' }} />)
    expect(q('[data-presentation-attribution]')!.getAttribute('href')).toBe('https://example.com')
    view.rerender(<Presentation steps={steps} attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('leaves the top-left brand slot empty by default and renders a host brand', () => {
    const view = render(<Presentation steps={steps} />)
    expect(q('[data-presentation-brand]')!.innerHTML).toBe('')
    expect(document.querySelector('header a')).toBeNull()
    view.rerender(<Presentation steps={steps} brand={<a href="/">host</a>} />)
    expect(q('[data-presentation-brand] a')!.textContent).toBe('host')
    expect(q('[data-presentation-attribution]')).not.toBeNull()
  })

  it('passes className through to the root', () => {
    render(<Presentation steps={steps} className="mine" />)
    expect(root().classList.contains('mine')).toBe(true)
  })
})
