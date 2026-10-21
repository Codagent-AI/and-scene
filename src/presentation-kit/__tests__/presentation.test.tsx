import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import { ATTRIBUTION_HREF } from '../chrome/Attribution'
import { makeSteps, setViewport } from './fixtures'

const q = (sel: string) => document.querySelector(sel)
const qa = (sel: string) => Array.from(document.querySelectorAll(sel))
const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))

beforeEach(() => setViewport(1440, 900))

describe('step model', () => {
  it('shows each step\'s own metadata and Scene output and keeps its id', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    const walk: Array<[number, string | null]> = [[0, 'ArrowRight'], [1, 'ArrowRight'], [2, 'ArrowRight'], [3, 'ArrowLeft'], [2, 'ArrowLeft'], [1, 'ArrowLeft'], [0, null]]
    for (const [i, nextKey] of walk) {
      expect(q('[data-presentation-root]')!.getAttribute('data-presentation-step-id')).toBe(`step-${i}`)
      expect(q('[data-presentation-header] [data-presentation-title]')!.textContent).toBe(`Title ${i}`)
      expect(q('[data-presentation-caption]')!.textContent).toBe(`Caption ${i}`)
      expect(screen.getByTestId('scene').textContent).toBe(`payload ${i}`)
      if (nextKey) press(nextKey)
    }
  })

  it('derives markers and progress labels from position after insert, remove, and reorder', () => {
    const base = makeSteps(3)
    const marker = () => q('[data-presentation-marker]')!.textContent
    const labels = () => qa('[data-presentation-progress-dot]').map((b) => b.getAttribute('aria-label'))
    const { rerender } = render(<Presentation steps={base} title="Deck" />)
    expect(marker()).toBe('1 / 3')
    const inserted = [base[0], { ...base[1], id: 'new' }, base[1], base[2]]
    rerender(<Presentation steps={inserted} title="Deck" />)
    expect(marker()).toBe('1 / 4')
    expect(labels().map((l) => l!.split(':')[0])).toEqual(['Step 1', 'Step 2', 'Step 3', 'Step 4'])
    rerender(<Presentation steps={[base[2], base[0]]} title="Deck" />)
    expect(labels()).toEqual(['Step 1: Title 2', 'Step 2: Title 0'])
    press('ArrowRight')
    expect(marker()).toBe('2 / 2')
    expect(q('[data-presentation-root]')!.getAttribute('data-presentation-step-id')).toBe('step-0')
  })
})

describe('chrome hooks', () => {
  it('exposes an accurate zero-based index and count', () => {
    render(<Presentation steps={makeSteps(5)} title="Deck" />)
    const root = q('[data-presentation-root]')!
    const read = () => [root.getAttribute('data-step-count'), root.getAttribute('data-step-index')]
    expect(read()).toEqual(['5', '0'])
    press('ArrowRight')
    expect(read()).toEqual(['5', '1'])
    fireEvent.click(qa('[data-presentation-progress-dot]')[4])
    expect(read()).toEqual(['5', '4'])
    press('ArrowRight')
    expect(read()).toEqual(['5', '4'])
    press('p')
    expect(read()).toEqual(['5', '4'])
    expect(root.getAttribute('data-presentation-step-index')).toBe('4')
  })

  it('works for a one-step presentation', () => {
    render(<Presentation steps={makeSteps(1)} title="Deck" />)
    expect(q('[data-presentation-root]')!.getAttribute('data-step-count')).toBe('1')
  })
})

describe('modes', () => {
  it('present mode: marker and one-line title; caption, ToC, prev/next hidden', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" initialMode="present" />)
    expect(q('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('present')
    expect(q('[data-presentation-marker]')!.textContent).toBe('1 / 4')
    const titles = qa('[data-presentation-title]')
    expect(titles).toHaveLength(1)
    expect(titles[0].textContent).toBe('Title 0')
    expect((titles[0] as HTMLElement).style.whiteSpace).toBe('nowrap')
    expect(q('[data-presentation-caption]')).toBeNull()
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-prev]')).toBeNull()
    expect(q('[data-presentation-next]')).toBeNull()
  })

  it('browse mode: title, caption, progress, prev/next, and ToC when wide', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 0')
    expect(qa('[data-presentation-progress-dot]')).toHaveLength(4)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it.each([
    [1440, true],
    [900, true],
    [899, false],
    [390, false],
  ])('ToC visibility at %ipx wide is %s', (width, shown) => {
    setViewport(width)
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    expect(q('[data-presentation-toc]') !== null).toBe(shown)
    expect(q('[data-presentation-caption]')).not.toBeNull()
  })

  it('P toggles the mode and preserves the step in both directions', () => {
    render(<Presentation steps={makeSteps(6)} title="Deck" initialMode="present" />)
    for (let i = 0; i < 3; i++) press('ArrowRight')
    press('p')
    expect(q('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('browse')
    expect(q('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('3')
    expect(q('[data-presentation-caption]')!.textContent).toBe('Caption 3')
    press('p')
    expect(q('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('3')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title 3')
  })
})

describe('navigation controls', () => {
  it('progress dots and ToC entries jump; ToC goes to the first step of an era run', () => {
    const eras = ['A', 'A', 'B', 'A', 'A']
    render(<Presentation steps={makeSteps(5, eras)} title="Deck" />)
    const index = () => q('[data-presentation-root]')!.getAttribute('data-step-index')
    const entries = qa('[data-presentation-toc-entry]')
    expect(entries.map((e) => e.textContent)).toEqual(['A', 'B', 'A'])
    fireEvent.click(entries[2])
    expect(index()).toBe('3')
    fireEvent.click(entries[1])
    expect(index()).toBe('2')
    fireEvent.click(entries[0])
    expect(index()).toBe('0')
    fireEvent.click(qa('[data-presentation-progress-dot]')[4])
    expect(index()).toBe('4')
  })

  it('exposes exactly one current progress dot and ToC entry, with active hooks', () => {
    render(<Presentation steps={makeSteps(5, ['A', 'A', 'B', 'B', 'C'])} title="Deck" />)
    const check = (dot: number, toc: number) => {
      const dots = qa('[data-presentation-progress-dot]')
      const entries = qa('[data-presentation-toc-entry]')
      expect(dots.filter((d) => d.getAttribute('aria-current') === 'step')).toEqual([dots[dot]])
      expect(entries.filter((d) => d.getAttribute('aria-current') === 'location')).toEqual([entries[toc]])
      expect(qa('[data-presentation-active="true"]')).toEqual([entries[toc], dots[dot]])
      for (const el of [...dots, ...entries].filter((e) => e !== dots[dot] && e !== entries[toc])) {
        expect(el.hasAttribute('aria-current')).toBe(false)
        expect(el.getAttribute('data-presentation-active')).toBeNull()
      }
    }
    check(0, 0)
    press('ArrowRight')
    check(1, 0)
    press('ArrowRight')
    check(2, 1)
    fireEvent.click(qa('[data-presentation-progress-dot]')[4])
    check(4, 2)
    press('ArrowLeft')
    check(3, 1)
  })

  it('prev/next buttons navigate and cannot leave the range', () => {
    render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const prev = q('[data-presentation-prev]') as HTMLButtonElement
    const next = q('[data-presentation-next]') as HTMLButtonElement
    const index = () => q('[data-presentation-root]')!.getAttribute('data-step-index')
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    expect(index()).toBe('0')
    fireEvent.click(next)
    fireEvent.click(next)
    expect(index()).toBe('2')
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(index()).toBe('2')
    fireEvent.click(prev)
    expect(index()).toBe('1')
  })

  it('a focused button keeps its keys', () => {
    render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const next = q('[data-presentation-next]') as HTMLButtonElement
    next.focus()
    fireEvent.keyDown(next, { key: ' ', bubbles: true })
    expect(q('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and brand', () => {
  it.each(['browse', 'present'] as const)('shows the default attribution in %s mode', (mode) => {
    render(<Presentation steps={makeSteps(2)} title="Deck" initialMode={mode} />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_HREF)
    expect(ATTRIBUTION_HREF).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.closest('[data-presentation-root]')).not.toBeNull()
    const style = (link as HTMLElement).style
    expect([style.position, style.right, style.bottom]).toEqual(['absolute', '0px', '0px'])
    expect((q('[data-presentation-root]') as HTMLElement).style.position).toBe('relative')
  })

  it('allows overriding or removing the attribution', () => {
    const { rerender } = render(<Presentation steps={makeSteps(2)} title="Deck" attribution={{ label: 'x', href: 'https://example.com' }} />)
    expect(screen.getByRole('link', { name: 'x' }).getAttribute('href')).toBe('https://example.com')
    rerender(<Presentation steps={makeSteps(2)} title="Deck" attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it.each(['browse', 'present'] as const)('has no default top-left brand in %s mode', (mode) => {
    render(<Presentation steps={makeSteps(2)} title="Deck" initialMode={mode} />)
    const header = q('[data-presentation-header]') as HTMLElement
    expect(within(header).queryAllByRole('link')).toHaveLength(0)
    expect(header.textContent).not.toMatch(/and-scene/i)
    expect(q('[data-presentation-brand]')).toBeNull()
  })

  it('renders a host-provided brand in the header', () => {
    render(<Presentation steps={makeSteps(2)} title="Deck" brand={<a href="/">Acme</a>} />)
    expect(within(q('[data-presentation-header]') as HTMLElement).getByRole('link', { name: 'Acme' })).toBeTruthy()
  })
})

describe('StrictMode', () => {
  it('advances one step per key press', () => {
    render(
      <StrictMode>
        <Presentation steps={makeSteps(5)} title="Deck" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(q('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('1')
  })
})
