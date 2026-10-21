import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ATTRIBUTION_URL } from './chrome/Attribution'
import { DEFAULT_CANVAS, STAGE_LAYOUT, TOC_WIDTH, WIDE_BREAKPOINT } from './constants'
import { Presentation } from './Presentation'
import type { PresentationProps, SceneProps, Step } from './types'

interface P {
  text: string
}
function TextScene({ payload }: SceneProps<P>) {
  return <p data-testid="scene">{payload.text}</p>
}

const ERAS = ['one', 'one', 'two', 'two', 'three', 'three']
function makeSteps(ids = ['a', 'b', 'c', 'd', 'e', 'f']): Step<P>[] {
  return ids.map((id, i) => ({
    id,
    era: ERAS[i] ?? 'x',
    title: `Title ${id}`,
    caption: `Caption for ${id}\nspanning several lines`,
    groupKey: 'g',
    Scene: TextScene,
    payload: { text: `scene ${id}` },
  }))
}

function setViewport(width: number, height = 900) {
  act(() => {
    Object.assign(window, { innerWidth: width, innerHeight: height })
    window.dispatchEvent(new Event('resize'))
  })
}

function show(props: Partial<PresentationProps> = {}) {
  return render(<Presentation steps={makeSteps()} title="Demo" {...props} />)
}

const root = () => document.querySelector('[data-presentation-root]')!
const q = (selector: string) => document.querySelector(selector)
const qa = (selector: string) => [...document.querySelectorAll(selector)]
const press = (key: string) => act(() => void fireEvent.keyDown(document.body, { key }))

beforeEach(() => setViewport(1400))
afterEach(() => setViewport(1024, 768))

describe('step model and numbering', () => {
  it('shows the active step title, caption, era and diagram state together', () => {
    show()
    press('ArrowRight')
    press('ArrowRight')
    expect(q('[data-presentation-title]')!.textContent).toBe('Title c')
    expect(q('[data-presentation-caption]')!.textContent).toContain('Caption for c')
    expect(q('[data-presentation-era]')!.textContent).toBe('two')
    expect(screen.getByTestId('scene').textContent).toBe('scene c')
  })

  it('derives displayed numbers from position when steps are inserted, removed or reordered', () => {
    const { rerender } = show({ initialIndex: 1 })
    const numbers = () => ({
      marker: q('[data-presentation-step-number]')!.textContent,
      progress: qa('[data-presentation-progress-item]').map((b) => b.textContent),
      active: q('[data-presentation-progress-item][data-presentation-active]')!.textContent,
    })
    expect(numbers()).toEqual({ marker: '2', progress: ['1', '2', '3', '4', '5', '6'], active: '2' })

    // Insert a step before "b": it keeps its id but its number moves from 2 to 3.
    const inserted = makeSteps(['a', 'new', 'b', 'c', 'd', 'e', 'f'])
    rerender(<Presentation steps={inserted} title="Demo" />)
    expect(numbers().progress).toHaveLength(7)
    expect(q('[data-presentation-title]')!.textContent).toBe('Title new')
    expect(numbers().marker).toBe('2')
    act(() => void fireEvent.click(qa('[data-presentation-progress-item]')[2]))
    expect(q('[data-presentation-title]')!.textContent).toBe('Title b')
    expect(numbers().marker).toBe('3')

    // Remove steps and reorder the rest.
    rerender(<Presentation steps={makeSteps(['c', 'b'])} title="Demo" />)
    expect(numbers()).toEqual({ marker: '2', progress: ['1', '2'], active: '2' })
    expect(q('[data-presentation-title]')!.textContent).toBe('Title b')
  })
})

describe('chrome hooks', () => {
  it('exposes the zero-based index and count in both modes and after every kind of move', () => {
    show()
    const state = () => [root().getAttribute('data-step-count'), root().getAttribute('data-step-index'), root().getAttribute('data-presentation-mode')]
    expect(state()).toEqual(['6', '0', 'browse'])
    press('ArrowRight')
    expect(state()).toEqual(['6', '1', 'browse'])
    press('p')
    expect(state()).toEqual(['6', '1', 'present'])
    press('ArrowRight')
    press('ArrowLeft')
    press('ArrowLeft')
    expect(state()).toEqual(['6', '0', 'present'])
    press('p')
    act(() => void fireEvent.click(qa('[data-presentation-progress-item]')[4]))
    expect(state()).toEqual(['6', '4', 'browse'])
  })

  it('follows a changed step array', () => {
    const { rerender } = show()
    rerender(<Presentation steps={makeSteps(['a', 'b'])} title="Demo" />)
    expect(root().getAttribute('data-step-count')).toBe('2')
  })
})

describe('present mode', () => {
  it('shows only the marker and a one-line title', () => {
    show({ initialMode: 'present' })
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(q('[data-presentation-step-number]')!.textContent).toBe('4')
    const title = q('[data-presentation-title]') as HTMLElement
    expect(title.textContent).toBe('Title d')
    expect(title.style.whiteSpace).toBe('nowrap')
    expect(title.style.overflow).toBe('hidden')
    for (const hook of ['caption', 'toc', 'progress', 'prev', 'next', 'controls']) {
      expect(q(`[data-presentation-${hook}]`)).toBeNull()
    }
  })
})

describe('browse mode', () => {
  it('shows title, caption, ToC, progress and prev/next on a wide viewport', () => {
    show()
    expect(q('[data-presentation-title]')).not.toBeNull()
    expect(q('[data-presentation-caption]')!.textContent).toContain('\n')
    expect(q('[data-presentation-toc]')).not.toBeNull()
    expect(qa('[data-presentation-progress-item]')).toHaveLength(6)
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
  })

  it('drops the ToC below the wide breakpoint and restores it on resize', () => {
    show()
    setViewport(WIDE_BREAKPOINT - 1)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-caption]')).not.toBeNull()
    setViewport(WIDE_BREAKPOINT)
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('shows every step caption and title while navigating with the on-screen controls', () => {
    show()
    const titles: string[] = []
    for (let i = 0; i < 6; i++) {
      titles.push(q('[data-presentation-title]')!.textContent!)
      expect(q('[data-presentation-caption]')!.textContent).toContain(`Caption for ${'abcdef'[i]}`)
      if (i < 5) act(() => void fireEvent.click(q('[data-presentation-next]')!))
    }
    expect(titles).toEqual(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => `Title ${id}`))
    act(() => void fireEvent.click(q('[data-presentation-prev]')!))
    expect(q('[data-presentation-title]')!.textContent).toBe('Title e')
  })

  it('disables previous at the start and next at the end', () => {
    show()
    expect((q('[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
    act(() => void fireEvent.click(qa('[data-presentation-progress-item]')[5]))
    expect((q('[data-presentation-next]') as HTMLButtonElement).disabled).toBe(true)
    act(() => void fireEvent.click(q('[data-presentation-next]')!))
    expect(root().getAttribute('data-step-index')).toBe('5')
  })
})

describe('mode toggle', () => {
  it.each(['browse', 'present'] as const)('toggles away from %s and back, staying on the fourth step', (initialMode) => {
    show({ initialMode })
    for (let i = 0; i < 3; i++) press('ArrowRight')
    press('p')
    expect(root().getAttribute('data-presentation-mode')).not.toBe(initialMode)
    expect(root().getAttribute('data-step-index')).toBe('3')
    expect(screen.getByTestId('scene').textContent).toBe('scene d')
    press('p')
    expect(root().getAttribute('data-presentation-mode')).toBe(initialMode)
    expect(root().getAttribute('data-step-index')).toBe('3')
  })
})

describe('direct jumps and active state', () => {
  it('jumps to nonadjacent steps from progress controls, forward and backward', () => {
    show()
    act(() => void fireEvent.click(qa('[data-presentation-progress-item]')[4]))
    expect(q('[data-presentation-title]')!.textContent).toBe('Title e')
    act(() => void fireEvent.click(qa('[data-presentation-progress-item]')[1]))
    expect(q('[data-presentation-title]')!.textContent).toBe('Title b')
  })

  it('groups the ToC by era and jumps to the first step of each era', () => {
    show()
    const entries = qa('[data-presentation-toc-entry]')
    expect(entries.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    act(() => void fireEvent.click(entries[2]))
    expect(root().getAttribute('data-step-index')).toBe('4')
    expect(screen.getByTestId('scene').textContent).toBe('scene e')
    act(() => void fireEvent.click(qa('[data-presentation-toc-entry]')[1]))
    expect(root().getAttribute('data-step-index')).toBe('2')
    act(() => void fireEvent.click(qa('[data-presentation-toc-entry]')[0]))
    expect(root().getAttribute('data-step-index')).toBe('0')
  })

  it('marks only the active progress item and ToC entry with aria-current and the active hook', () => {
    show()
    const check = (progressIndex: number, tocIndex: number) => {
      qa('[data-presentation-progress-item]').forEach((el, i) => {
        const active = i === progressIndex
        expect(el.hasAttribute('data-presentation-active')).toBe(active)
        expect(el.getAttribute('aria-current')).toBe(active ? 'step' : null)
      })
      qa('[data-presentation-toc-entry]').forEach((el, i) => {
        const active = i === tocIndex
        expect(el.hasAttribute('data-presentation-active')).toBe(active)
        expect(el.getAttribute('aria-current')).toBe(active ? 'true' : null)
      })
    }
    check(0, 0)
    press('ArrowRight') // within-era move
    check(1, 0)
    act(() => void fireEvent.click(qa('[data-presentation-progress-item]')[4])) // era-changing jump
    check(4, 2)
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right "made by and-scene" link with a styling hook', () => {
    show()
    const link = q('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(ATTRIBUTION_URL).toBe(link.getAttribute('href'))
    const slot = link.closest('[data-presentation-attribution-slot]') as HTMLElement
    expect(slot.style.position).toBe('absolute')
    expect(slot.style.right).toBe('0px')
    expect(slot.style.bottom).toBe('0px')
    expect(slot.style.top).toBe('')
    expect(slot.style.left).toBe('')
    expect(slot.parentElement).toBe(root())
  })

  it('replaces the attribution when given content and removes it when disabled', () => {
    const { unmount } = show({ attribution: { content: <a href="/custom">custom credit</a> } })
    expect(screen.getByText('custom credit')).not.toBeNull()
    expect(screen.queryByText('made by and-scene')).toBeNull()
    unmount()
    show({ attribution: false })
    expect(q('[data-presentation-attribution]')).toBeNull()
    expect(q('[data-presentation-attribution-slot]')).toBeNull()
    expect(screen.queryByText('made by and-scene')).toBeNull()
  })

  it('has an empty top-left slot by default and renders host branding on request', () => {
    const { unmount } = show()
    const slot = q('[data-presentation-brand-slot]')!
    expect(slot.textContent).toBe('')
    expect(slot.querySelector('a')).toBeNull()
    expect(q('[data-presentation-header]')!.textContent).not.toContain('and-scene')
    unmount()
    show({ brand: <a href="/home">Acme Talks</a> })
    const brand = within(q('[data-presentation-brand-slot]') as HTMLElement).getByText('Acme Talks')
    expect(brand.getAttribute('href')).toBe('/home')
  })
})

describe('fixed canvas', () => {
  const canvas = () => q('[data-presentation-canvas]') as HTMLElement

  it('uses the 880 x 380 default and one uniform scale transform', () => {
    show()
    expect(canvas().style.width).toBe('880px')
    expect(canvas().style.height).toBe('380px')
    const scale = Number(canvas().getAttribute('data-presentation-scale'))
    expect(canvas().style.transform).toContain(`scale(${scale})`)
    expect(canvas().style.transform).not.toMatch(/scale\([^)]*,/)
    const insets = STAGE_LAYOUT.browse
    const expected = Math.min((1400 - insets.left - insets.right - TOC_WIDTH) / 880, (900 - insets.top - insets.bottom) / 380)
    expect(scale).toBeCloseTo(expected)
  })

  it('keeps the scale constant across steps and rescales on resize and mode change', () => {
    show()
    const read = () => canvas().getAttribute('data-presentation-scale')
    const first = read()
    press('ArrowRight')
    press('ArrowRight')
    expect(read()).toBe(first)
    expect(canvas().style.width).toBe('880px')
    setViewport(1200, 800)
    expect(read()).not.toBe(first)
    const browse = read()
    const layer = q('[data-presentation-layer]')
    press('p')
    expect(read()).not.toBe(browse)
    expect(q('[data-presentation-layer]')).toBe(layer) // a re-render, not a remounted scene
  })

  it('replaces the design canvas when one is supplied', () => {
    const { unmount } = show({ initialMode: 'present' })
    const defaultScale = Number(canvas().getAttribute('data-presentation-scale'))
    unmount()
    show({ initialMode: 'present', canvas: { width: 1760, height: 760 } })
    expect(canvas().style.width).toBe('1760px')
    expect(canvas().style.height).toBe('760px')
    expect(Number(canvas().getAttribute('data-presentation-scale'))).toBeCloseTo(defaultScale / 2)
    expect(DEFAULT_CANVAS).toEqual({ width: 880, height: 380 })
  })
})

describe('StrictMode', () => {
  it('advances once per key press and unmounts cleanly', () => {
    const { unmount } = render(
      <StrictMode>
        <Presentation steps={makeSteps()} title="Demo" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('1')
    unmount()
    expect(() => press('ArrowRight')).not.toThrow()
  })
})
