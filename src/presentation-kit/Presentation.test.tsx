import { useEffect } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setWide } from '../../tests/setup'
import { Presentation, type SceneProps, type Step } from '.'

interface Payload {
  n: number
}
let mounts = 0
function Counter({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts++
  }, [])
  return <div data-testid="scene">scene {payload.n}</div>
}
function Other() {
  return <div data-testid="other">other</div>
}

const ERAS = ['one', 'one', 'two', 'two', 'three']
const steps: Step<Payload>[] = ERAS.map((era, i) => ({
  id: `s${i}`,
  era,
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  Scene: Counter,
  groupKey: i < 4 ? 'g' : undefined,
  payload: { n: i },
}))

const root = () => document.querySelector('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))
const press = (key: string) => fireEvent.keyDown(window, { key })

function setup(props: Partial<Parameters<typeof Presentation<Payload>>[0]> = {}) {
  return render(<Presentation<Payload> steps={steps} title="Deck" {...props} />)
}

describe('Presentation', () => {
  it('exposes step count and index hooks and accepts a typed grouped payload without casts', () => {
    setup()
    expect(root().getAttribute('data-step-count')).toBe('5')
    expect(index()).toBe(0)
  })

  it('navigates with Right/Space/PageDown and Left/PageUp, clamping at both ends', () => {
    setup()
    press('ArrowLeft')
    expect(index()).toBe(0)
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(index()).toBe(3)
    press('PageUp')
    expect(index()).toBe(2)
    press('ArrowLeft')
    expect(index()).toBe(1)
    for (let i = 0; i < 10; i++) press('ArrowRight')
    expect(index()).toBe(4)
  })

  it('supports horizontal swipes', () => {
    setup()
    const touch = (x: number, type: 'touchstart' | 'touchend') =>
      fireEvent(window, Object.assign(new Event(type), { changedTouches: [{ clientX: x, clientY: 100 }] }))
    touch(300, 'touchstart')
    touch(100, 'touchend')
    expect(index()).toBe(1)
    touch(100, 'touchstart')
    touch(300, 'touchend')
    expect(index()).toBe(0)
  })

  it('does not hijack keys from focused controls', () => {
    setup()
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    fireEvent.keyDown(next, { key: ' ' })
    expect(index()).toBe(0)
    fireEvent.click(next)
    expect(index()).toBe(1)
  })

  it('toggles modes with P, preserves the step, and shows the specified chrome', () => {
    setup({ initialMode: 'browse' })
    press('ArrowRight')
    press('ArrowRight')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(screen.getByText('Caption 2')).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc]')).toBeTruthy()
    expect(document.querySelectorAll('[data-presentation-dot]')).toHaveLength(5)
    press('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe(2)
    expect(screen.getByText('Title 2')).toBeTruthy()
    expect(screen.queryByText('Caption 2')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next step' })).toBeNull()
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('03')
    press('P')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe(2)
  })

  it('can open in present mode and hides the toc on narrow viewports', () => {
    setup({ initialMode: 'present' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    setWide(false)
    document.body.innerHTML = ''
    setup({ initialMode: 'browse' })
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    setWide(true)
  })

  it('jumps via progress dots and toc entries (first step of the era) with active semantics', () => {
    setup()
    fireEvent.click(document.querySelector('[data-presentation-dot="3"]')!)
    expect(index()).toBe(3)
    const dot = document.querySelector('[data-presentation-dot="3"]')!
    expect(dot.getAttribute('aria-current')).toBe('step')
    expect(dot.getAttribute('data-presentation-active')).toBe('true')
    expect(document.querySelectorAll('[data-presentation-dot][aria-current]')).toHaveLength(1)
    const toc = within(document.querySelector('[data-presentation-toc]') as HTMLElement)
    fireEvent.click(toc.getByText('three'))
    expect(index()).toBe(4)
    fireEvent.click(toc.getByText('one'))
    expect(index()).toBe(0)
    expect(toc.getByText('one').getAttribute('aria-current')).toBe('step')
    expect(toc.getByText('two').getAttribute('aria-current')).toBeNull()
  })

  it('derives numbering from order', () => {
    const reordered = [steps[2], steps[0]]
    render(<Presentation<Payload> steps={reordered} title="Deck" />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('01')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('02')
  })

  it('keeps one scene instance across grouped steps', () => {
    mounts = 0
    setup()
    press('ArrowRight')
    press('ArrowRight')
    press('ArrowRight')
    expect(screen.getByTestId('scene').textContent).toBe('scene 3')
    expect(mounts).toBe(1)
  })

  it('swaps scenes between groups', async () => {
    const mixed: Step<Payload>[] = [
      { ...steps[0], groupKey: 'a' },
      { ...steps[1], Scene: Other as Step<Payload>['Scene'], groupKey: 'b' },
    ]
    render(<Presentation<Payload> steps={mixed} title="Deck" />)
    press('ArrowRight')
    await act(async () => new Promise((r) => setTimeout(r, 900)))
    expect(screen.getByTestId('other')).toBeTruthy()
  })

  it('renders the default attribution bottom-right and no top-left brand', () => {
    setup()
    const link = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    expect(document.querySelector('[data-presentation-header] a')).toBeNull()
  })

  it('lets hosts opt into a brand and customize or remove attribution', () => {
    setup({ brand: <b>host</b>, attribution: { label: 'custom', href: 'https://example.com/' } })
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('host')
    expect(document.querySelector('[data-presentation-attribution]')?.textContent).toBe('custom')
    document.body.innerHTML = ''
    setup({ attribution: false })
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('exposes stable hooks for presentation-owned styling', () => {
    setup()
    for (const hook of ['root', 'header', 'footer', 'stage', 'canvas', 'progress', 'title', 'caption', 'prev', 'next']) {
      expect(document.querySelector(`[data-presentation-${hook}]`), hook).toBeTruthy()
    }
  })

  it('keeps the toc in sync when repeated era labels are reordered', () => {
    const mk = (eras: string[]): Step<Payload>[] =>
      eras.map((era, i) => ({ ...steps[0], id: `r${eras.join('')}${i}`, era, groupKey: 'g', payload: { n: i } }))
    const { rerender } = render(<Presentation<Payload> steps={mk(['a', 'b', 'a'])} title="Deck" />)
    const entries = () => [...document.querySelectorAll('[data-presentation-toc-entry]')].map((e) => e.textContent)
    expect(entries()).toEqual(['a', 'b', 'a'])
    rerender(<Presentation<Payload> steps={mk(['b', 'a'])} title="Deck" />)
    expect(entries()).toEqual(['b', 'a'])
  })
})
