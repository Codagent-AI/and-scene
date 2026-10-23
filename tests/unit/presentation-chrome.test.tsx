import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { FOUR, makeSteps, setViewport } from '../helpers/fixtures'

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const hook = (name: string) => document.querySelector(`[data-presentation-${name}]`)

beforeEach(() => setViewport(1440))

describe('step numbering (order-derived)', () => {
  it('shows a marker and progress labels that follow position', () => {
    const { rerender } = render(<Presentation steps={FOUR} title="t" />)
    expect(hook('marker')?.textContent).toBe('01')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(hook('marker')?.textContent).toBe('02')
    expect(screen.getByLabelText('Step 3: Title c')).toBeTruthy()

    // insert at the front: same ids, no manual renumbering
    const inserted = [...makeSteps([{ id: 'z', era: 'one' }]), ...FOUR]
    rerender(<Presentation steps={inserted} title="t" />)
    expect(screen.getByLabelText('Step 3: Title b')).toBeTruthy()
    expect(screen.getByLabelText('Step 1: Title z')).toBeTruthy()

    // remove
    rerender(<Presentation steps={FOUR.filter((s) => s.id !== 'a')} title="t" />)
    expect(screen.getByLabelText('Step 1: Title b')).toBeTruthy()
    expect(screen.queryByLabelText('Step 1: Title a')).toBeNull()

    // reorder
    rerender(<Presentation steps={[FOUR[3], FOUR[2], FOUR[1]]} title="t" />)
    expect(screen.getByLabelText('Step 1: Title d')).toBeTruthy()
    expect(screen.getByLabelText('Step 3: Title b')).toBeTruthy()
  })
})

describe('present mode', () => {
  it('shows marker and one-line title only, at wide and narrow widths', () => {
    for (const width of [1440, 390]) {
      setViewport(width)
      const { unmount } = render(<Presentation steps={FOUR} title="t" initialMode="present" />)
      expect(hook('marker')?.textContent).toBe('01')
      expect(hook('title')?.textContent).toBe('Title a')
      for (const absent of ['caption', 'toc', 'prev', 'next', 'progress', 'progress-item']) {
        expect(hook(absent)).toBeNull()
      }
      unmount()
    }
  })
})

describe('browse mode', () => {
  it('shows title, caption, prev/next and progress; ToC only on wide viewports', () => {
    render(<Presentation steps={FOUR} title="t" initialMode="browse" />)
    expect(hook('title')?.textContent).toBe('Title a')
    expect(hook('caption')?.tagName).toBe('P')
    expect(hook('caption')?.textContent).toBe('Caption a')
    expect(hook('prev')).not.toBeNull()
    expect(hook('next')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
    expect(hook('toc')).not.toBeNull()

    act(() => setViewport(600))
    expect(hook('toc')).toBeNull()
    expect(hook('caption')).not.toBeNull()
    act(() => setViewport(1440))
    expect(hook('toc')).not.toBeNull()
  })

  it('defaults to browse when initialMode is omitted', () => {
    render(<Presentation steps={FOUR} title="t" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  })
})

describe('mode toggle', () => {
  it('toggles with P and with the control, preserving the step and the scene', () => {
    const grouped = FOUR.map((s) => ({ ...s, groupKey: 'g' }))
    render(<Presentation steps={grouped} title="t" initialMode="present" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    const sceneNode = screen.getByTestId('scene-text')
    expect(root().getAttribute('data-step-index')).toBe('2')

    fireEvent.keyDown(window, { key: 'p' })
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(hook('caption')?.textContent).toBe('Caption c')

    fireEvent.click(document.querySelector('[data-presentation-mode-toggle]')!)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('2')
    expect(hook('caption')).toBeNull()
    expect(screen.getByTestId('scene-text')).toBe(sceneNode)
  })
})

describe('step hooks', () => {
  it('exposes equal prefixed and unprefixed count/index hooks that track navigation', () => {
    render(<Presentation steps={FOUR} title="t" />)
    const check = (index: number) => {
      expect(root().getAttribute('data-step-count')).toBe('4')
      expect(root().getAttribute('data-presentation-step-count')).toBe('4')
      expect(root().getAttribute('data-step-index')).toBe(String(index))
      expect(root().getAttribute('data-presentation-step-index')).toBe(String(index))
    }
    check(0)
    fireEvent.click(document.querySelector('[data-presentation-next]')!)
    check(1)
    fireEvent.click(document.querySelector('[data-presentation-prev]')!)
    check(0)
    fireEvent.click(screen.getByLabelText('Step 4: Title d'))
    check(3)
    fireEvent.keyDown(window, { key: 'p' })
    check(3)
  })

  it('follows step-array length changes', () => {
    const { rerender } = render(<Presentation steps={FOUR} title="t" />)
    fireEvent.click(screen.getByLabelText('Step 4: Title d'))
    rerender(<Presentation steps={FOUR.slice(0, 2)} title="t" />)
    expect(root().getAttribute('data-step-count')).toBe('2')
    expect(root().getAttribute('data-step-index')).toBe('1')
  })
})

describe('direct jumps and active state', () => {
  it('jumps via every progress item and every ToC entry (first step of the era)', () => {
    const steps = makeSteps([
      { id: 'a', era: 'one' }, { id: 'b', era: 'one' }, { id: 'c', era: 'two' },
      { id: 'd', era: 'two' }, { id: 'e', era: 'three' },
    ])
    render(<Presentation steps={steps} title="t" />)
    steps.forEach((s, i) => {
      fireEvent.click(screen.getByLabelText(`Step ${i + 1}: ${s.title}`))
      expect(root().getAttribute('data-step-index')).toBe(String(i))
    })
    const entries = [...document.querySelectorAll('[data-presentation-toc-entry]')]
    expect(entries.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    for (const [i, expected] of [[0, 0], [1, 2], [2, 4]] as const) {
      fireEvent.click(entries[i])
      expect(root().getAttribute('data-step-index')).toBe(String(expected))
    }
  })

  it('marks exactly the current dot and era with aria-current and the active hook', () => {
    render(<Presentation steps={FOUR} title="t" />)
    const active = (sel: string) => [...document.querySelectorAll(sel)].map((e) => e.getAttribute('data-presentation-active') === 'true' && e.getAttribute('aria-current') === 'step')
    const inert = (sel: string) => [...document.querySelectorAll(sel)].map((e) => e.getAttribute('aria-current') === null && e.getAttribute('data-presentation-active') === null)

    expect(active('[data-presentation-progress-item]')).toEqual([true, false, false, false])
    expect(active('[data-presentation-toc-entry]')).toEqual([true, false, false])
    fireEvent.keyDown(window, { key: 'ArrowRight' }) // within era
    expect(active('[data-presentation-progress-item]')).toEqual([false, true, false, false])
    expect(active('[data-presentation-toc-entry]')).toEqual([true, false, false])
    fireEvent.keyDown(window, { key: 'ArrowRight' }) // across eras
    expect(active('[data-presentation-toc-entry]')).toEqual([false, true, false])
    expect(inert('[data-presentation-progress-item]')).toEqual([true, true, false, true])
    expect(inert('[data-presentation-toc-entry]')).toEqual([true, false, true])
  })
})

describe('on-screen controls clamp', () => {
  it('disables prev at the start and next at the end, and stays put', () => {
    render(<Presentation steps={FOUR} title="t" />)
    const prev = document.querySelector('[data-presentation-prev]') as HTMLButtonElement
    const next = document.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByLabelText('Step 4: Title d'))
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(root().getAttribute('data-step-index')).toBe('3')
  })

  it('handles a single-step deck', () => {
    render(<Presentation steps={FOUR.slice(0, 1)} title="t" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it.each(['browse', 'present'] as const)('shows the default attribution link in %s mode', (mode) => {
    render(<Presentation steps={FOUR} title="t" initialMode={mode} />)
    const link = hook('attribution') as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    const slot = link.parentElement!
    expect(slot.hasAttribute('data-presentation-attribution-slot')).toBe(true)
    expect(slot.style.position).toBe('absolute')
    expect(slot.style.right).toBe('0px')
    expect(slot.style.bottom).toBe('0px')
  })

  it('can be overridden or hidden', () => {
    const { rerender } = render(<Presentation steps={FOUR} title="t" attribution={{ label: 'other', href: 'https://example.com/' }} />)
    expect(hook('attribution')?.textContent).toBe('other')
    rerender(<Presentation steps={FOUR} title="t" attribution={false} />)
    expect(hook('attribution')).toBeNull()
  })

  it.each(['browse', 'present'] as const)('has no default top-left brand in %s mode, and renders host branding', (mode) => {
    const { rerender } = render(<Presentation steps={FOUR} title="t" initialMode={mode} />)
    const slot = hook('brand-slot') as HTMLElement
    expect(slot.children).toHaveLength(0)
    expect(slot.textContent).toBe('')
    expect(within(hook('header') as HTMLElement).queryAllByRole('link')).toHaveLength(0)
    rerender(<Presentation steps={FOUR} title="t" initialMode={mode} brand={<a href="/">Acme</a>} />)
    expect(within(hook('brand-slot') as HTMLElement).getByRole('link').textContent).toBe('Acme')
  })
})

describe('step validation at the host', () => {
  it('throws for duplicate ids', () => {
    const dup = [FOUR[0], { ...FOUR[1], id: 'a' }]
    expect(() => render(<StrictMode><Presentation steps={dup} title="t" /></StrictMode>)).toThrow(/duplicate step id "a"/)
  })
})
