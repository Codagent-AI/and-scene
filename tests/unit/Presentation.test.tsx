import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import { Presentation } from '../../src/presentation-kit'
import { makeSteps, setViewport } from '../helpers/fixtures'

const q = (c: HTMLElement, sel: string) => c.querySelector(sel)
const qa = (c: HTMLElement, sel: string) => Array.from(c.querySelectorAll(sel))

beforeEach(() => setViewport(1280))
afterEach(() => setViewport(1024))

describe('present mode', () => {
  it('shows the marker and one-line title only', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(q(container, '[data-presentation-marker]')?.textContent).toBe('1 / 5')
    expect(q(container, '[data-presentation-step-title]')?.textContent).toBe('Title 1')
    expect(q(container, '[data-presentation-step-caption]')).toBeNull()
    expect(q(container, '[data-presentation-toc]')).toBeNull()
    expect(q(container, '[data-presentation-prev]')).toBeNull()
    expect(q(container, '[data-presentation-next]')).toBeNull()
    expect(q(container, '[data-presentation-progress]')).toBeNull()
  })
})

describe('browse mode', () => {
  it('shows title, caption, ToC on wide viewports, controls, and progress dots', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    expect(q(container, '[data-presentation-title]')?.textContent).toBe('Deck')
    expect(q(container, '[data-presentation-step-title]')?.textContent).toBe('Title 1')
    expect(q(container, '[data-presentation-step-caption]')?.textContent).toBe('Caption 1')
    expect(q(container, '[data-presentation-toc]')).not.toBeNull()
    expect(q(container, '[data-presentation-prev]')).not.toBeNull()
    expect(q(container, '[data-presentation-next]')).not.toBeNull()
    expect(qa(container, '[data-presentation-dot]')).toHaveLength(5)
  })

  it('hides the table of contents on narrow viewports', () => {
    setViewport(600)
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q(container, '[data-presentation-toc]')).toBeNull()
    expect(q(container, '[data-presentation-progress]')).not.toBeNull()
  })

  it('defaults to browse mode', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q(container, '[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')
  })
})

describe('mode toggle', () => {
  it('switches mode while staying on the current step', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const root = q(container, '[data-presentation-root]')!
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    fireEvent.click(q(container, '[data-presentation-mode-toggle]')!)
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    expect(root.getAttribute('data-step-index')).toBe('2')
    fireEvent.click(q(container, '[data-presentation-mode-toggle]')!)
    expect(root.getAttribute('data-presentation-mode')).toBe('browse')
    expect(root.getAttribute('data-step-index')).toBe('2')
  })
})

describe('step hooks', () => {
  it('exposes step count and index hooks that follow navigation', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const root = q(container, '[data-presentation-root]')!
    expect(root.getAttribute('data-step-count')).toBe('5')
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(q(container, '[data-presentation-next]')!)
    expect(root.getAttribute('data-step-index')).toBe('1')
    expect(root.getAttribute('data-step-id')).toBe('s2')
    fireEvent.click(q(container, '[data-presentation-prev]')!)
    expect(root.getAttribute('data-step-index')).toBe('0')
  })
})

describe('direct jumps and active state', () => {
  it('jumps from a progress dot and a ToC entry (first step of the era)', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const root = q(container, '[data-presentation-root]')!
    fireEvent.click(qa(container, '[data-presentation-dot]')[3])
    expect(root.getAttribute('data-step-index')).toBe('3')
    fireEvent.click(qa(container, '[data-presentation-toc-entry]')[0])
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(qa(container, '[data-presentation-toc-entry]')[1])
    expect(root.getAttribute('data-step-index')).toBe('2')
  })

  it('marks exactly the active dot and ToC entry with aria-current and the active hook', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    fireEvent.click(qa(container, '[data-presentation-dot]')[3])
    for (const sel of ['[data-presentation-dot]', '[data-presentation-toc-entry]']) {
      const active = qa(container, `${sel}[data-presentation-active="true"]`)
      const current = qa(container, `${sel}[aria-current="step"]`)
      expect(active).toHaveLength(1)
      expect(current).toEqual(active)
    }
    expect(qa(container, '[data-presentation-dot]')[3].getAttribute('data-presentation-active')).toBe('true')
    expect(qa(container, '[data-presentation-toc-entry]')[1].getAttribute('data-presentation-active')).toBe('true')
  })

  it('disables previous at the start and next at the end', () => {
    const { container } = render(<Presentation steps={makeSteps(2)} title="Deck" />)
    expect((q(container, '[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(q(container, '[data-presentation-next]')!)
    expect((q(container, '[data-presentation-next]') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('focused controls keep their keys', () => {
  it('does not advance the deck when Space is pressed on a focused button', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const dot = qa(container, '[data-presentation-dot]')[0]
    fireEvent.keyDown(dot, { key: ' ' })
    fireEvent.keyDown(dot, { key: 'ArrowRight' })
    expect(q(container, '[data-presentation-root]')?.getAttribute('data-step-index')).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows a bottom-right "made by and-scene" link to the GitHub repo with a styling hook', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const a = q(container, '[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    const row = a.parentElement!
    expect(row.style.justifyContent).toBe('flex-end')
    const root = q(container, '[data-presentation-root]')!
    expect(root.lastElementChild).toBe(row)
  })

  it('omits the attribution when disabled and accepts overrides', () => {
    const off = render(<Presentation steps={makeSteps()} title="Deck" attribution={false} />)
    expect(q(off.container, '[data-presentation-attribution]')).toBeNull()
    const custom = render(<Presentation steps={makeSteps()} title="Deck" attribution={{ label: 'hi', href: 'https://example.com' }} />)
    expect(q(custom.container, '[data-presentation-attribution]')?.textContent).toBe('hi')
  })

  it('has no default top-left brand; a host-provided brand renders in the slot', () => {
    const plain = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q(plain.container, '[data-presentation-brand]')).toBeNull()
    expect(plain.container.querySelector('[data-presentation-header] a')).toBeNull()
    expect(plain.container.querySelector('[data-presentation-header]')?.textContent).not.toMatch(/and-scene/i)
    const branded = render(<Presentation steps={makeSteps()} title="Deck" brand={<b>Acme</b>} />)
    expect(q(branded.container, '[data-presentation-brand]')?.textContent).toBe('Acme')
  })
})

describe('canvas', () => {
  it('uses an 880 × 380 canvas by default and accepts an override', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const canvas = q(container, '[data-presentation-canvas]') as HTMLElement
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
    const o = render(<Presentation steps={makeSteps()} title="Deck" canvas={{ width: 400, height: 200 }} />)
    const c2 = q(o.container, '[data-presentation-canvas]') as HTMLElement
    expect([c2.style.width, c2.style.height]).toEqual(['400px', '200px'])
  })

  it('applies one uniform scale transform to the canvas', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const canvas = q(container, '[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.transform).toMatch(/^translate\(-50%, -50%\) scale\([\d.]+\)$/)
  })
})

describe('resizing', () => {
  it('recomputes one uniform scale when the stage area changes size', () => {
    let size = { width: 1000, height: 500 }
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ ...size, x: 0, y: 0, top: 0, left: 0, right: size.width, bottom: size.height, toJSON: () => ({}) }),
    )
    const { container } = render(<Presentation steps={makeSteps()} title="Deck" />)
    const canvas = q(container, '[data-presentation-canvas]') as HTMLElement
    const transformScale = () => Number(/scale\(([\d.]+)\)/.exec(canvas.style.transform)![1])
    const scaleOf = () => Number(canvas.getAttribute('data-presentation-scale'))
    // browse inset 16: min((1000-32)/880, (500-32)/380) = 1.1
    expect(scaleOf()).toBeCloseTo(1.1, 3)
    expect(transformScale()).toBeCloseTo(scaleOf(), 3)
    size = { width: 500, height: 600 }
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    // min((500-32)/880, (600-32)/380) = 0.5318
    expect(scaleOf()).toBeCloseTo(0.5318, 3)
    expect(transformScale()).toBeCloseTo(scaleOf(), 3)
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
    spy.mockRestore()
  })
})
