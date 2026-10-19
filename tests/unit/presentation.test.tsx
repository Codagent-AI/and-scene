// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, fireEvent, render, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ATTRIBUTION_HREF, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../../src/presentation-kit/constants.ts'
import { Presentation } from '../../src/presentation-kit/index.ts'
import { FIVE, makeSteps } from '../helpers/fixtures.tsx'
import { setViewport } from '../helpers/viewport.ts'

vi.mock('motion/react', async () => await import('../helpers/motionMock.tsx'))

const root = (c: HTMLElement) => c.querySelector('[data-presentation-root]') as HTMLElement
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))
const canvas = (c: HTMLElement) => c.querySelector('[data-presentation-canvas]') as HTMLElement

beforeEach(() => setViewport(1440, 900))

describe('step model and numbering', () => {
  it('shows the selected narration and diagram state', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title a')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption a')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toMatch(/1 \/ 5\s+one/)
    expect(container.querySelectorAll('[data-presentation-entity]')).toHaveLength(1)
    key('ArrowRight')
    expect(container.querySelectorAll('[data-presentation-entity]')).toHaveLength(2)
  })

  it('derives numbers from position after insert, remove and reorder, without touching ids', () => {
    const marker = (steps: ReturnType<typeof makeSteps>, goto: number) => {
      const { container, unmount } = render(<Presentation steps={steps} title="T" />)
      for (let i = 0; i < goto; i++) key('ArrowRight')
      const text = container.querySelector('[data-presentation-marker]')?.textContent?.replace(/\s+/g, ' ').trim()
      unmount()
      return text
    }
    const [a, b, c] = FIVE
    expect(marker([a, b, c], 2)).toBe('3 / 3 two')
    expect(marker([c, a, b], 2)).toBe('3 / 3 one')
    expect(marker([a, c], 1)).toBe('2 / 2 two')
    const inserted = makeSteps([{ id: 'new', era: 'zero' }])[0]
    expect(marker([inserted, a, b, c], 0)).toBe('1 / 4 zero')
    expect(marker([inserted, a, b, c], 2)).toBe('3 / 4 one')
    expect(c.id).toBe('c')
  })
})

describe('modes', () => {
  it('present mode shows marker and one-line title only', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="present" />)
    expect(container.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-title]')).toHaveLength(1)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title a')
    for (const sel of ['caption', 'toc', 'progress', 'progress-item', 'prev', 'next']) {
      expect(container.querySelector(`[data-presentation-${sel}]`)).toBeNull()
    }
    expect(container.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('present')
  })

  it('browse mode shows title, caption, toc on wide viewports, prev/next and progress', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title a')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption a')
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(5)
  })

  it('hides the table of contents below the wide breakpoint', () => {
    setViewport(900, 800)
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-progress]')).not.toBeNull()
    setViewport(1024, 800)
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('opens in the declared mode and defaults to present', () => {
    expect(root(render(<Presentation steps={FIVE} title="T" initialMode="browse" />).container).getAttribute('data-presentation-mode')).toBe('browse')
    const d = render(<Presentation steps={FIVE} title="T" />)
    expect(root(d.container).getAttribute('data-presentation-mode')).toBe('present')
  })

  it('toggles with P and the control, keeping step, scene and nav state', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    key('ArrowRight')
    key('ArrowRight')
    const before = () => [root(container).getAttribute('data-step-index'), container.querySelectorAll('[data-presentation-entity]').length]
    const snap = before()
    key('p')
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(before()).toEqual(snap)
    fireEvent.click(container.querySelector('[data-presentation-mode-toggle]')!)
    expect(root(container).getAttribute('data-presentation-mode')).toBe('browse')
    expect(before()).toEqual(snap)
    expect(container.querySelector('[data-presentation-progress-item][aria-current="step"]')?.getAttribute('aria-label')).toMatch(/^Step 3/)
  })
})

describe('navigation chrome', () => {
  it('exposes accurate step count and index hooks across navigation, jumps and mode changes', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    const read = () => [root(container).getAttribute('data-step-count'), root(container).getAttribute('data-step-index')]
    expect(read()).toEqual(['5', '0'])
    key('ArrowRight')
    expect(read()).toEqual(['5', '1'])
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[4])
    expect(read()).toEqual(['5', '4'])
    key('p')
    expect(read()).toEqual(['5', '4'])
    key('ArrowLeft')
    expect(read()).toEqual(['5', '3'])
  })

  it('prev/next controls move one step and clamp', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    const next = container.querySelector('[data-presentation-next]')!
    const prev = container.querySelector('[data-presentation-prev]')!
    fireEvent.click(prev)
    expect(root(container).getAttribute('data-step-index')).toBe('0')
    for (let i = 0; i < 7; i++) fireEvent.click(next)
    expect(root(container).getAttribute('data-step-index')).toBe('4')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption e')
    fireEvent.click(prev)
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption d')
  })

  it('jumps via nonadjacent progress indicators and era toc entries (first step of the era)', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[3])
    expect(root(container).getAttribute('data-step-index')).toBe('3')
    const toc = [...container.querySelectorAll('[data-presentation-toc-entry]')]
    expect(toc.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(toc[1])
    expect(root(container).getAttribute('data-step-index')).toBe('2')
    fireEvent.click(toc[0])
    expect(root(container).getAttribute('data-step-index')).toBe('0')
  })

  it('exposes aria-current and the active hook only on current entries, updating on every change', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    const active = (sel: string) => [...container.querySelectorAll(sel)].map((e) => [e.getAttribute('aria-current'), e.getAttribute('data-presentation-active')])
    const check = (progress: number, tocIdx: number) => {
      const p = active('[data-presentation-progress-item]')
      p.forEach((v, i) => expect(v).toEqual(i === progress ? ['step', 'true'] : [null, null]))
      const t = active('[data-presentation-toc-entry]')
      t.forEach((v, i) => expect(v).toEqual(i === tocIdx ? ['step', 'true'] : [null, null]))
    }
    check(0, 0)
    key('ArrowRight'); check(1, 0)
    key('ArrowRight'); check(2, 1)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[4]); check(4, 2)
    key('ArrowLeft'); check(3, 1)
    key('p'); key('p'); check(3, 1)
  })

  it('keeps focused-control keys from also advancing the deck', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="browse" />)
    const next = container.querySelector('[data-presentation-next]') as HTMLElement
    next.focus()
    act(() => void fireEvent.keyDown(next, { key: 'ArrowRight' }))
    expect(root(container).getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows a bottom-right "made by and-scene" link to the repository with a styling hook', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" />)
    const a = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.getAttribute('href')).toBe(ATTRIBUTION_HREF)
    expect(ATTRIBUTION_HREF).toBe('https://github.com/Codagent-AI/and-scene')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    expect([a.style.position, a.style.right, a.style.bottom]).toEqual(['fixed', '0px', '0px'])
  })

  it('supports overriding or omitting the attribution', () => {
    const o = render(<Presentation steps={FIVE} title="T" attribution={{ href: 'https://example.com', label: 'mine' }} />)
    expect(o.container.querySelector('[data-presentation-attribution]')?.textContent).toBe('mine')
    expect(o.container.querySelector('[data-presentation-attribution]')?.getAttribute('href')).toBe('https://example.com')
    o.unmount()
    const none = render(<Presentation steps={FIVE} title="T" attribution={null} />)
    expect(none.container.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand; a host brand renders in the slot beside the default attribution', () => {
    const d = render(<Presentation steps={FIVE} title="T" />)
    const slot = d.container.querySelector('[data-presentation-header-start]')!
    expect(slot.children).toHaveLength(0)
    expect(slot.textContent).toBe('')
    expect(within(d.container.querySelector('[data-presentation-header]') as HTMLElement).queryByRole('link')).toBeNull()
    d.unmount()
    const h = render(<Presentation steps={FIVE} title="T" brand={<a href="/">host</a>} />)
    expect(h.container.querySelector('[data-presentation-header-start] a')?.textContent).toBe('host')
    expect(h.container.querySelector('[data-presentation-attribution]')).not.toBeNull()
  })
})

describe('fixed canvas', () => {
  it('defaults to 880 x 380 and honours an override, keeping internal coordinates', () => {
    const d = render(<Presentation steps={FIVE} title="T" />)
    expect([canvas(d.container).style.width, canvas(d.container).style.height]).toEqual([`${DESIGN_W}px`, `${DESIGN_H}px`])
    d.unmount()
    const c = render(<Presentation steps={FIVE} title="T" canvas={{ width: 400, height: 300 }} />)
    expect([canvas(c.container).style.width, canvas(c.container).style.height]).toEqual(['400px', '300px'])
    expect((c.container.querySelector('[data-presentation-entity]') as HTMLElement).style.left).toBe('0px')
  })

  it('scales uniformly once, equal across steps, and recomputes on resize', () => {
    setViewport(1440, 900)
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="present" />)
    const scale = () => Number(canvas(container).getAttribute('data-presentation-scale'))
    const g = STAGE_LAYOUT.present
    const expected = Math.min((1440 - 2 * g.side) / DESIGN_W, (900 - g.top - g.bottom) / DESIGN_H)
    expect(scale()).toBeCloseTo(expected, 10)
    expect(canvas(container).style.transform).toMatch(/^scale\([\d.]+\)$/)
    const seen = new Set<number>()
    for (let i = 0; i < 5; i++) {
      seen.add(scale())
      key('ArrowRight')
    }
    expect(seen.size).toBe(1)
    setViewport(700, 500)
    const after = Math.min((700 - 2 * g.side) / DESIGN_W, (500 - g.top - g.bottom) / DESIGN_H)
    expect(scale()).toBeCloseTo(after, 10)
    expect(canvas(container).style.width).toBe(`${DESIGN_W}px`)
  })

  it('re-renders (not morphs) at the other geometry on a mode switch', () => {
    const { container } = render(<Presentation steps={FIVE} title="T" initialMode="present" />)
    const present = canvas(container).getAttribute('data-presentation-scale')
    key('p')
    expect(canvas(container).getAttribute('data-presentation-scale')).not.toBe(present)
  })
})

describe('StrictMode', () => {
  it('subscribes once per event type net of replay, reacts once, and removes every listener on unmount', () => {
    const adds: string[] = []
    const removes: string[] = []
    const origAdd = window.addEventListener.bind(window)
    const origRemove = window.removeEventListener.bind(window)
    const add = vi.spyOn(window, 'addEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      if (['keydown', 'resize', 'touchstart', 'touchend'].includes(type)) adds.push(type)
      return origAdd(type, ...(rest as [EventListener]))
    }) as typeof window.addEventListener)
    const remove = vi.spyOn(window, 'removeEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      if (['keydown', 'resize', 'touchstart', 'touchend'].includes(type)) removes.push(type)
      return origRemove(type, ...(rest as [EventListener]))
    }) as typeof window.removeEventListener)
    const { container, unmount } = render(<StrictMode><Presentation steps={FIVE} title="T" initialMode="present" /></StrictMode>)
    key('ArrowRight')
    expect(root(container).getAttribute('data-step-index')).toBe('1')
    const before = canvas(container).getAttribute('data-presentation-scale')
    setViewport(700, 500)
    expect(canvas(container).getAttribute('data-presentation-scale')).not.toBe(before)
    unmount()
    const count = (list: string[], t: string) => list.filter((x) => x === t).length
    for (const t of ['keydown', 'resize', 'touchstart', 'touchend']) {
      expect(count(adds, t), t).toBeGreaterThan(0)
      expect(count(removes, t), `${t} balanced`).toBe(count(adds, t))
    }
    add.mockRestore()
    remove.mockRestore()
  })
})
