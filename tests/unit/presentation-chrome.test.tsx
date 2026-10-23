// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation, type PresentationProps } from '../../src/presentation-kit'
import { key, makeSteps, setViewport, type P } from './helpers/fixtures'

const $ = (sel: string) => document.querySelector<HTMLElement>(sel)
const $$ = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)]
const root = () => $('[data-presentation-root]')!
const index = () => root().getAttribute('data-step-index')

afterEach(() => setViewport(1024, 800))

const eras = ['one', 'one', 'two', 'two', 'two', 'three']
const show = (props: Partial<PresentationProps<P>> = {}) =>
  render(<Presentation steps={makeSteps(eras)} title="Deck" {...props} />)

describe('modes', () => {
  it('present mode shows marker and title but hides caption, ToC and prev/next', () => {
    setViewport(1440)
    show({ initialMode: 'present' })
    expect($('[data-presentation-marker]')).not.toBeNull()
    expect($('[data-presentation-title]')?.textContent).toBe('Title 0')
    for (const hidden of ['caption', 'toc', 'prev', 'next']) expect($(`[data-presentation-${hidden}]`)).toBeNull()
  })

  it('browse mode shows title, caption, ToC when wide, prev/next and progress', () => {
    setViewport(1440)
    show({ initialMode: 'browse' })
    expect($('[data-presentation-title]')?.textContent).toBe('Title 0')
    expect($('[data-presentation-caption]')?.textContent).toBe('Caption 0')
    expect($('[data-presentation-toc]')).not.toBeNull()
    expect($('[data-presentation-prev]')).not.toBeNull()
    expect($('[data-presentation-next]')).not.toBeNull()
    expect($$('[data-presentation-progress-item]')).toHaveLength(eras.length)
  })

  it('shows the ToC from the 1024px threshold, also after resizing', () => {
    setViewport(1023)
    show()
    expect($('[data-presentation-toc]')).toBeNull()
    act(() => setViewport(1024))
    expect($('[data-presentation-toc]')).not.toBeNull()
    act(() => setViewport(390))
    expect($('[data-presentation-toc]')).toBeNull()
    expect($('[data-presentation-caption]')).not.toBeNull() // browse chrome otherwise intact
    expect($$('[data-presentation-progress-item]')).toHaveLength(eras.length)
  })

  it('opens in the declared mode, defaulting to browse, and agrees with the root hook', () => {
    show({ initialMode: 'present' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    document.body.innerHTML = ''
    show()
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect($('[data-presentation-caption]')).not.toBeNull()
  })

  it('P toggles both ways and preserves the step and its content', () => {
    show()
    act(() => void key('ArrowRight'))
    act(() => void key('ArrowRight'))
    act(() => void key('p'))
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe('2')
    expect($('[data-presentation-title]')?.textContent).toBe('Title 2')
    expect($('[data-presentation-caption]')).toBeNull()
    act(() => void key('p'))
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe('2')
    expect($('[data-presentation-caption]')?.textContent).toBe('Caption 2')
  })
})

describe('direct jumps and active state', () => {
  it('progress indicators jump to their step', () => {
    show()
    $$('[data-presentation-progress-item]').forEach((button, i) => {
      fireEvent.click(button)
      expect(index()).toBe(String(i))
      expect($('[data-presentation-title]')?.textContent).toBe(`Title ${i}`)
    })
  })

  it('ToC entries jump to the first step of their era', () => {
    setViewport(1440)
    show()
    const entries = $$('[data-presentation-toc-entry]')
    expect(entries.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(entries[1])
    expect(index()).toBe('2')
    fireEvent.click($$('[data-presentation-toc-entry]')[2])
    expect(index()).toBe('5')
    fireEvent.click($$('[data-presentation-toc-entry]')[0])
    expect(index()).toBe('0')
  })

  it('only the active progress item and ToC entry carry aria-current and the active hook', () => {
    setViewport(1440)
    show()
    const check = (activeStep: number, activeEra: string) => {
      const items = $$('[data-presentation-progress-item]')
      items.forEach((el, i) => {
        const active = i === activeStep
        expect(el.getAttribute('aria-current')).toBe(active ? 'step' : null)
        expect(el.getAttribute('data-presentation-active')).toBe(active ? 'true' : null)
        expect(el.tagName).toBe('BUTTON')
      })
      $$('[data-presentation-toc-entry]').forEach((el) => {
        const active = el.textContent === activeEra
        expect(el.getAttribute('aria-current')).toBe(active ? 'step' : null)
        expect(el.getAttribute('data-presentation-active')).toBe(active ? 'true' : null)
      })
    }
    check(0, 'one')
    act(() => void key('ArrowRight'))
    check(1, 'one')
    act(() => void key('ArrowRight'))
    check(2, 'two')
    fireEvent.click($$('[data-presentation-progress-item]')[5])
    check(5, 'three')
    act(() => void key('ArrowLeft'))
    check(4, 'two')
  })
})

describe('boundaries through chrome', () => {
  it('prev at the start and next at the end do not wrap', () => {
    show()
    fireEvent.click($('[data-presentation-prev]')!)
    expect(index()).toBe('0')
    expect($('[data-presentation-prev]')?.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click($$('[data-presentation-progress-item]')[5])
    fireEvent.click($('[data-presentation-next]')!)
    expect(index()).toBe('5')
    expect($('[data-presentation-next]')?.getAttribute('aria-disabled')).toBe('true')
  })

  it('a one-step presentation stays on its only step', () => {
    show({ steps: makeSteps(['solo']) })
    fireEvent.click($('[data-presentation-next]')!)
    fireEvent.click($('[data-presentation-prev]')!)
    act(() => void key('ArrowRight'))
    expect(index()).toBe('0')
  })
})

describe('step-count and step-index hooks', () => {
  it('stay synchronized in both attribute pairs, across navigation, mode and step changes', () => {
    const { rerender } = show()
    const read = () => [
      root().getAttribute('data-step-count'),
      root().getAttribute('data-step-index'),
      root().getAttribute('data-presentation-step-count'),
      root().getAttribute('data-presentation-step-index'),
    ]
    expect(read()).toEqual(['6', '0', '6', '0'])
    act(() => void key('ArrowRight'))
    expect(read()).toEqual(['6', '1', '6', '1'])
    fireEvent.click($$('[data-presentation-progress-item]')[4])
    expect(read()).toEqual(['6', '4', '6', '4'])
    act(() => void key('p'))
    expect(read()).toEqual(['6', '4', '6', '4'])
    act(() => void key('ArrowRight'))
    expect(read()).toEqual(['6', '5', '6', '5'])
    rerender(<Presentation steps={makeSteps(['a', 'b'])} title="Deck" />)
    expect(read()).toEqual(['2', '1', '2', '1'])
  })
})

describe('attribution and brand', () => {
  it.each(['browse', 'present'] as const)('shows the default bottom-right attribution in %s mode', (mode) => {
    show({ initialMode: mode })
    const link = $('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.tagName).toBe('A')
    expect([link.style.position, link.style.right, link.style.bottom]).toEqual(['absolute', '0px', '0px'])
    expect(root().style.position).toBe('fixed') // containing block is the viewport, so 0/0 is bottom-right
  })

  it('can be overridden or removed by the host', () => {
    show({ attribution: { label: 'custom', href: 'https://example.com/' } })
    expect($('[data-presentation-attribution]')?.textContent).toBe('custom')
    expect($('[data-presentation-attribution]')?.getAttribute('href')).toBe('https://example.com/')
    document.body.innerHTML = ''
    show({ attribution: false })
    expect($('[data-presentation-attribution]')).toBeNull()
  })

  it('has no default top-left brand but renders a host brand', () => {
    const { rerender } = show()
    const slot = $('[data-presentation-header] [data-presentation-brand]')!
    expect(slot.childNodes).toHaveLength(0)
    expect($('[data-presentation-header] a')).toBeNull()
    rerender(<Presentation steps={makeSteps(eras)} title="Deck" brand={<a href="/">host</a>} />)
    expect($('[data-presentation-header] [data-presentation-brand] a')?.textContent).toBe('host')
  })
})
