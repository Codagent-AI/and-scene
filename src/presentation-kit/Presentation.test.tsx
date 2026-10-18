import { StrictMode, useEffect } from 'react'
import { act, fireEvent, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TextScene } from '../test-utils/TextScene'
import { FIVE, makeSteps, type TestPayload } from '../test-utils/steps'
import { ATTRIBUTION_HREF } from './constants'
import { Presentation } from './Presentation'
import type { Step } from './types'

const setWidth = (w: number) => {
  window.innerWidth = w
  fireEvent(window, new Event('resize'))
}
afterEach(() => setWidth(1024))

const q = (c: HTMLElement, sel: string) => c.querySelector(sel)
const qa = (c: HTMLElement, sel: string) => [...c.querySelectorAll(sel)]
const root = (c: HTMLElement) => q(c, '[data-presentation-root]') as HTMLElement
const index = (c: HTMLElement) => root(c).getAttribute('data-step-index')
const press = (key: string) => fireEvent.keyDown(window, { key })

describe('Presentation chrome', () => {
  it('exposes step count and index hooks that follow navigation', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" />)
    expect(root(container).getAttribute('data-step-count')).toBe('5')
    expect(index(container)).toBe('0')
    press('ArrowRight')
    press('ArrowRight')
    expect(index(container)).toBe('2')
  })

  it('numbers steps by position, whatever the insertions, removals or reorders', () => {
    const marker = (c: HTMLElement) => q(c, '[data-presentation-marker-number]')!.textContent
    const original = makeSteps([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
    const reordered = [original[2], original[0], original[1]]
    const inserted = [original[0], ...makeSteps([{ id: 'new' }]), original[1], original[2]]
    const removed = [original[0], original[2]]
    for (const steps of [original, reordered, inserted, removed]) {
      const { container, unmount } = render(<Presentation steps={steps} title="t" />)
      steps.forEach((s, i) => {
        expect(marker(container)).toBe(String(i + 1))
        expect(q(container, '[data-presentation-title]')!.textContent).toBe(s.title)
        press('ArrowRight')
      })
      unmount()
    }
  })

  it('present mode shows marker and one-line title only', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="present" />)
    expect(root(container).dataset.presentationMode).toBe('present')
    expect(q(container, '[data-presentation-marker]')).not.toBeNull()
    expect(q(container, '[data-presentation-title]')!.textContent).toBe('Title a')
    for (const hidden of ['caption', 'toc', 'progress', 'prev', 'next'])
      expect(q(container, `[data-presentation-${hidden}]`), hidden).toBeNull()
  })

  it('browse mode shows title, caption, wide-only ToC, prev/next and progress', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    expect(q(container, '[data-presentation-title]')!.textContent).toBe('Title a')
    expect(q(container, '[data-presentation-caption]')!.textContent).toBe('Caption a')
    expect(q(container, '[data-presentation-toc]')).not.toBeNull()
    expect(q(container, '[data-presentation-prev]')).not.toBeNull()
    expect(q(container, '[data-presentation-next]')).not.toBeNull()
    expect(qa(container, '[data-presentation-progress-item]')).toHaveLength(5)
  })

  it('shows the ToC only in browse mode on wide viewports, following resizes', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    const toc = () => q(container, '[data-presentation-toc]')
    expect(toc()).not.toBeNull()
    act(() => setWidth(600))
    expect(toc()).toBeNull()
    expect(q(container, '[data-presentation-progress]')).not.toBeNull()
    act(() => setWidth(1400))
    expect(toc()).not.toBeNull()
    press('p')
    expect(toc()).toBeNull()
  })

  it('toggles mode with the key and the control, preserving the step', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(root(container).dataset.presentationMode).toBe('present')
    expect(index(container)).toBe('2')
    fireEvent.click(q(container, '[data-presentation-mode-toggle]')!)
    expect(root(container).dataset.presentationMode).toBe('browse')
    expect(index(container)).toBe('2')
    expect(q(container, '[data-presentation-caption]')!.textContent).toBe('Caption c')
  })

  it('jumps from every progress item and to the first step of an era from the ToC', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    qa(container, '[data-presentation-progress-item]').forEach((_, i) => {
      fireEvent.click(qa(container, '[data-presentation-progress-item]')[i])
      expect(index(container)).toBe(String(i))
    })
    const entries = qa(container, '[data-presentation-toc-entry]')
    expect(entries.map((e) => e.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(entries[1])
    expect(index(container)).toBe('2')
    press('ArrowRight')
    fireEvent.click(entries[1])
    expect(index(container)).toBe('2')
    fireEvent.click(entries[0])
    expect(index(container)).toBe('0')
  })

  it('exposes current-step semantics on exactly the active items, in every mode', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    const eras = ['one', 'one', 'two', 'two', 'three']
    for (let i = 0; i < 5; i++) {
      qa(container, '[data-presentation-progress-item]').forEach((el, j) => {
        expect(el.getAttribute('aria-current')).toBe(j === i ? 'step' : null)
        expect(el.getAttribute('data-presentation-active')).toBe(j === i ? 'true' : null)
      })
      qa(container, '[data-presentation-toc-entry]').forEach((el) => {
        const active = el.textContent === eras[i]
        expect(el.getAttribute('aria-current')).toBe(active ? 'true' : null)
        expect(el.getAttribute('data-presentation-active')).toBe(active ? 'true' : null)
      })
      press('ArrowRight')
    }
    press('p')
    press('p')
    expect(qa(container, '[data-presentation-active="true"]').length).toBe(2)
  })

  it('moves with prev/next controls and clamps at the ends', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    const click = (s: string) => fireEvent.click(q(container, s)!)
    click('[data-presentation-prev]')
    expect(index(container)).toBe('0')
    for (let i = 0; i < 7; i++) click('[data-presentation-next]')
    expect(index(container)).toBe('4')
    click('[data-presentation-prev]')
    expect(index(container)).toBe('3')
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(index(container)).toBe('4')
  })

  it('keeps navigation keys for a focused control instead of advancing', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    fireEvent.keyDown(q(container, '[data-presentation-next]')!, { key: ' ' })
    fireEvent.keyDown(q(container, '[data-presentation-progress-item]')!, { key: 'ArrowRight' })
    expect(index(container)).toBe('0')
  })

  it('hands the active step payload to the active scene', () => {
    const { container, getByTestId } = render(<Presentation steps={FIVE} title="t" />)
    press('ArrowRight')
    press('ArrowRight')
    expect(index(container)).toBe('2')
    return vi.waitFor(() => expect(getByTestId('scene').textContent).toBe('c'))
  })
})

describe('attribution and branding', () => {
  it('shows a bottom-right link with a stable hook by default', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" />)
    const a = q(container, '[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toBe(ATTRIBUTION_HREF)
    expect(a.style.position).toBe('absolute')
    expect(a.style.right).toBe('0px')
    expect(a.style.bottom).toBe('0px')
  })

  it('shows it in browse mode too', () => {
    const { container } = render(<Presentation steps={FIVE} title="t" initialMode="browse" />)
    expect(q(container, '[data-presentation-attribution]')).not.toBeNull()
  })

  it('has no default top-left brand, but renders a host-provided one', () => {
    const plain = render(<Presentation steps={FIVE} title="t" />)
    const slot = q(plain.container, '[data-presentation-brand]')!
    expect(slot.textContent).toBe('')
    expect(within(plain.container).queryByText(/and-scene/)?.getAttribute('data-presentation-attribution')).toBe('')
    expect(q(plain.container, '[data-presentation-header] a')).toBeNull()
    plain.unmount()
    const branded = render(<Presentation steps={FIVE} title="t" brand={<span>host brand</span>} />)
    expect(q(branded.container, '[data-presentation-brand]')!.textContent).toBe('host brand')
  })

  it('lets a host replace or omit the attribution', () => {
    const custom = render(<Presentation steps={FIVE} title="t" attribution={<i data-x="1">mine</i>} />)
    expect(q(custom.container, '[data-presentation-attribution]')).toBeNull()
    expect(q(custom.container, '[data-x]')).not.toBeNull()
    custom.unmount()
    const none = render(<Presentation steps={FIVE} title="t" attribution={false} />)
    expect(q(none.container, '[data-presentation-attribution]')).toBeNull()
  })
})

describe('typed payloads', () => {
  it('accepts a typed step array at the boundary without casts', () => {
    const steps: Step<TestPayload>[] = makeSteps([{ id: 'x' }])
    render(<Presentation steps={steps} title="typed" />)
    // @ts-expect-error a step array with another payload type is rejected
    render(<Presentation<{ other: number }> steps={steps} title="typed" />)
    expect(TextScene).toBeTypeOf('function')
  })
})

describe('StrictMode', () => {
  it('does not remount a grouped scene when moving within the group', () => {
    let mounts = 0
    function Counting({ payload }: { payload: TestPayload }) {
      useEffect(() => {
        mounts++
      }, [])
      return <p data-testid="scene">{payload.label}</p>
    }
    const steps = makeSteps(
      [
        { id: 'a', groupKey: 'g' },
        { id: 'b', groupKey: 'g' },
        { id: 'c', groupKey: 'g' },
      ],
      Counting,
    )
    const { container } = render(
      <StrictMode>
        <Presentation steps={steps} title="t" />
      </StrictMode>,
    )
    const initial = mounts
    press('ArrowRight')
    press('ArrowRight')
    expect(index(container)).toBe('2')
    expect(mounts).toBe(initial)
    expect(qa(container, '[data-presentation-scene]')).toHaveLength(1)
  })
})
