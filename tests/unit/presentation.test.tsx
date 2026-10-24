// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation, DEFAULT_ATTRIBUTION, STAGE_LAYOUT, WIDE_VIEWPORT_MIN, DESIGN_H, DESIGN_W, getEras } from '../../src/presentation-kit'
import { makeSteps, setViewport } from './helpers'

const q = (selector: string) => document.querySelector<HTMLElement>(selector)
const root = () => q('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))

beforeEach(() => setViewport(1280, 800))

describe('step model and numbering', () => {
  it('renders the active step narration and diagram payload', () => {
    render(<Presentation steps={makeSteps(['a', 'a', 'b'])} title="Deck" initialMode="browse" initialIndex={1} />)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 1')
    expect(q('[data-presentation-caption]')!.textContent).toContain('Caption 1')
    expect(screen.getByTestId('scene').textContent).toBe('payload 1')
  })

  it('derives displayed numbers and index hooks from position after insert, remove and reorder', () => {
    const steps = makeSteps(['a', 'b', 'c', 'd'])
    const check = (list: typeof steps, expectedIds: string[]) => {
      const view = render(<Presentation steps={list} title="Deck" initialMode="browse" />)
      for (let i = 0; i < list.length; i++) {
        expect(q('[data-presentation-marker-number]')!.textContent).toBe(String(i + 1))
        expect(index()).toBe(i)
        expect(q('[data-presentation-title]')!.textContent).toBe(list.find((s) => s.id === expectedIds[i])!.title)
        fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      }
      view.unmount()
    }
    check(steps, ['s0', 's1', 's2', 's3'])
    check([steps[2], steps[0], steps[1], steps[3]], ['s2', 's0', 's1', 's3'])
    check(steps.filter((s) => s.id !== 's1'), ['s0', 's2', 's3'])
    check([steps[0], { ...steps[1], id: 'new' }, ...steps.slice(1)], ['s0', 'new', 's1', 's2', 's3'])
  })
})

describe('present mode', () => {
  it('shows marker and one-line title only; hides caption, ToC, progress and prev/next', () => {
    render(<Presentation steps={makeSteps(['the ask', 'the ask', 'the build'])} title="Deck" initialMode="present" initialIndex={1} />)
    expect(q('[data-presentation-marker-number]')!.textContent).toBe('2')
    expect(q('[data-presentation-marker-era]')!.textContent).toBe('the ask')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 1')
    for (const hidden of ['caption', 'toc', 'progress', 'prev', 'next']) {
      expect(q(`[data-presentation-${hidden}]`)).toBeNull()
    }
    expect(q('[data-presentation-attribution]')).not.toBeNull()
  })
})

describe('browse mode', () => {
  it('shows title, caption, progress, prev/next and the ToC at wide widths', () => {
    render(<Presentation steps={makeSteps(['a', 'a', 'b'])} title="Deck" initialMode="browse" />)
    expect(q('[data-presentation-title]')).not.toBeNull()
    expect(q('[data-presentation-caption]')!.textContent!.length).toBeGreaterThan(40)
    expect(q('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-dot]')).toHaveLength(3)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
  })

  it.each([
    [WIDE_VIEWPORT_MIN - 1, false],
    [WIDE_VIEWPORT_MIN, true],
    [390, false],
    [1280, true],
  ])('ToC visibility at %ipx wide is %s, including after resize', (width, expected) => {
    setViewport(1280)
    render(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" initialMode="browse" />)
    setViewport(width)
    expect(q('[data-presentation-toc]') !== null).toBe(expected)
  })

  it('next/prev controls update index, title and caption, and are disabled at the ends', () => {
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="browse" />)
    expect(q('[data-presentation-prev]')).toBeDisabled()
    fireEvent.click(q('[data-presentation-next]')!)
    expect(index()).toBe(1)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 1')
    expect(q('[data-presentation-caption]')!.textContent).toContain('Caption 1')
    fireEvent.click(q('[data-presentation-next]')!)
    expect(q('[data-presentation-next]')).toBeDisabled()
    fireEvent.click(q('[data-presentation-next]')!)
    expect(index()).toBe(2)
    fireEvent.click(q('[data-presentation-prev]')!)
    expect(index()).toBe(1)
  })
})

describe('modes', () => {
  it('toggles with P, swapping chrome while staying on the same step', () => {
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="browse" initialIndex={1} />)
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe(1)
    expect(q('[data-presentation-caption]')).toBeNull()
    fireEvent.keyDown(document.body, { key: 'P' })
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe(1)
    expect(q('[data-presentation-caption]')).not.toBeNull()
  })

  it('exposes step count and index hooks and aliases in both modes and after navigation', () => {
    render(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="Deck" initialMode="present" />)
    for (const mode of ['present', 'browse']) {
      expect(root().getAttribute('data-step-count')).toBe('3')
      expect(root().getAttribute('data-presentation-step-count')).toBe('3')
      expect(root().getAttribute('data-step-index')).toBe(root().getAttribute('data-presentation-step-index'))
      expect(root().getAttribute('data-presentation-mode')).toBe(mode)
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      fireEvent.keyDown(document.body, { key: 'p' })
    }
    expect(index()).toBe(2)
  })

  it('sets the document title from the presentation title', () => {
    render(<Presentation steps={makeSteps(['a'])} title="My Deck" />)
    expect(document.title).toBe('My Deck')
  })
})

describe('direct jumps and active state', () => {
  const eras = ['one', 'one', 'two', 'two', 'two', 'three']

  it('a progress dot jumps to its own step; a ToC entry jumps to the first step of its era', () => {
    render(<Presentation steps={makeSteps(eras)} title="Deck" initialMode="browse" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-dot]')[4])
    expect(index()).toBe(4)
    fireEvent.click(q('[data-presentation-toc-entry="three"]')!)
    expect(index()).toBe(5)
    fireEvent.click(q('[data-presentation-toc-entry="two"]')!)
    expect(index()).toBe(2)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 2')
    expect(getEras(makeSteps(eras))).toEqual([
      { label: 'one', firstIndex: 0 },
      { label: 'two', firstIndex: 2 },
      { label: 'three', firstIndex: 5 },
    ])
  })

  it('only the active dot and the active era carry aria-current and the active hook', () => {
    render(<Presentation steps={makeSteps(eras)} title="Deck" initialMode="browse" />)
    const assertActive = (activeStep: number, activeEra: string) => {
      const dots = [...document.querySelectorAll('[data-presentation-dot]')]
      dots.forEach((dot, i) => {
        expect(dot.getAttribute('aria-current')).toBe(i === activeStep ? 'step' : null)
        expect(dot.getAttribute('data-presentation-active')).toBe(i === activeStep ? 'true' : null)
      })
      document.querySelectorAll('[data-presentation-toc-entry]').forEach((entry) => {
        const active = entry.getAttribute('data-presentation-toc-entry') === activeEra
        expect(entry.getAttribute('aria-current')).toBe(active ? 'step' : null)
        expect(entry.getAttribute('data-presentation-active')).toBe(active ? 'true' : null)
      })
      expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(2)
    }
    assertActive(0, 'one')
    fireEvent.click(document.querySelectorAll('[data-presentation-dot]')[3])
    assertActive(3, 'two')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    assertActive(4, 'two')
    fireEvent.click(q('[data-presentation-toc-entry="three"]')!)
    assertActive(5, 'three')
  })

  it('first and last dots and boundary controls keep the index inside the deck', () => {
    render(<Presentation steps={makeSteps(eras)} title="Deck" initialMode="browse" />)
    const dots = document.querySelectorAll('[data-presentation-dot]')
    fireEvent.click(dots[dots.length - 1])
    expect(index()).toBe(eras.length - 1)
    fireEvent.click(dots[0])
    expect(index()).toBe(0)
  })
})

describe('attribution', () => {
  it('shows the default link bottom-right in both modes with a styling hook', () => {
    render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode="browse" />)
    for (let pass = 0; pass < 2; pass++) {
      const link = q('[data-presentation-attribution]') as HTMLAnchorElement
      expect(link.textContent).toBe('made by and-scene')
      expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(link.style.right).toBe('0px')
      expect(link.style.bottom).toBe('0px')
      fireEvent.keyDown(document.body, { key: 'p' })
    }
    expect(DEFAULT_ATTRIBUTION.label).toBe('made by and-scene')
  })

  it('supports a custom label and href, and hiding, without affecting a fresh default render', () => {
    const { unmount } = render(<Presentation steps={makeSteps(['a'])} title="Deck" attribution={{ label: 'by me', href: 'https://example.com/me' }} />)
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect([link.textContent, link.getAttribute('href')]).toEqual(['by me', 'https://example.com/me'])
    unmount()
    render(<Presentation steps={makeSteps(['a'])} title="Deck" attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
    document.body.innerHTML = ''
    render(<Presentation steps={makeSteps(['a'])} title="Deck" />)
    expect(q('[data-presentation-attribution]')!.textContent).toBe('made by and-scene')
  })

  it.each([
    ['label only', { label: 'by me' }, 'by me', 'https://github.com/Codagent-AI/and-scene'],
    ['href only', { href: 'https://example.com/x' }, 'made by and-scene', 'https://example.com/x'],
  ])('keeps the default for whatever a partial override (%s) leaves out, in both modes', (_name, option, label, href) => {
    render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode="browse" attribution={option} />)
    for (let pass = 0; pass < 2; pass++) {
      const link = q('[data-presentation-attribution]') as HTMLAnchorElement
      expect([link.textContent, link.getAttribute('href')]).toEqual([label, href])
      fireEvent.keyDown(document.body, { key: 'p' })
    }
  })

  it('applies a full override and hiding in browse mode as well as present mode', () => {
    for (const initialMode of ['browse', 'present'] as const) {
      const full = render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode={initialMode} attribution={{ label: 'x', href: 'https://example.com/y' }} />)
      expect(q('[data-presentation-attribution]')!.textContent).toBe('x')
      full.unmount()
      const hidden = render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode={initialMode} attribution={false} />)
      expect(q('[data-presentation-attribution]')).toBeNull()
      fireEvent.keyDown(document.body, { key: 'p' })
      expect(q('[data-presentation-attribution]')).toBeNull()
      hidden.unmount()
    }
  })

  it('has no default top-left brand link; an explicit host brand renders in that slot', () => {
    const { unmount } = render(<Presentation steps={makeSteps(['a'])} title="Deck" />)
    const slot = q('[data-presentation-brand]')!
    expect(slot.querySelector('a')).toBeNull()
    expect(slot.textContent).toBe('')
    unmount()
    render(<Presentation steps={makeSteps(['a'])} title="Deck" brand={<a href="/">host</a>} />)
    expect(within(q('[data-presentation-brand]')!).getByText('host')).toBeInTheDocument()
    expect(q('[data-presentation-header]')!.firstElementChild).toBe(q('[data-presentation-brand]'))
  })
})

describe('canvas', () => {
  it('uses 880 x 380 by default and honours a canvas override', () => {
    const { unmount } = render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode="present" />)
    const canvas = () => q('[data-presentation-canvas]')!
    expect([canvas().style.width, canvas().style.height]).toEqual([`${DESIGN_W}px`, `${DESIGN_H}px`])
    const defaultScale = Number(canvas().getAttribute('data-presentation-scale'))
    unmount()
    render(<Presentation steps={makeSteps(['a'])} title="Deck" initialMode="present" canvas={{ width: 440, height: 190 }} />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['440px', '190px'])
    expect(Number(canvas().getAttribute('data-presentation-scale'))).toBeCloseTo(defaultScale * 2)
  })

  it('keeps one scale across steps within a mode and recomputes on resize and mode change', () => {
    render(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" initialMode="browse" />)
    const scale = () => q('[data-presentation-canvas]')!.getAttribute('data-presentation-scale')
    const first = scale()
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(scale()).toBe(first)
    setViewport(640, 800)
    expect(scale()).not.toBe(first)
    setViewport(1280, 800)
    expect(scale()).toBe(first)
    fireEvent.keyDown(document.body, { key: 'p' })
    expect(scale()).not.toBe(first)
    const stage = q('[data-presentation-stage]')!
    expect(stage.style.top).toBe(`${STAGE_LAYOUT.present.insetTop}px`)
    expect(q('[data-presentation-canvas]')!.style.transform).toMatch(/^scale\(/)
  })
})
