import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Appear, Arrow, Box, ENTER_DELAY, LAYOUT_T, Presentation } from '../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'

afterEach(cleanup)

const mounts = vi.fn()
function Counting({ payload }: SceneProps<{ n: number }>) {
  useEffect(() => {
    mounts()
  }, [])
  return <div data-testid="counting">{payload.n}</div>
}
function Other() {
  return <div data-testid="other">other</div>
}

const steps: Step<{ n: number }>[] = [
  { id: 'a', era: 'one', title: 'Alpha', caption: 'Caption A', groupKey: 'g', payload: { n: 1 }, Scene: Counting },
  { id: 'b', era: 'one', title: 'Beta', caption: 'Caption B', groupKey: 'g', payload: { n: 2 }, Scene: Counting },
  { id: 'c', era: 'two', title: 'Gamma', caption: 'Caption C', payload: { n: 3 }, Scene: Counting },
  { id: 'd', era: 'two', title: 'Delta', caption: 'Caption D', payload: { n: 4 }, Scene: Counting },
]

const root = () => document.querySelector('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))
const key = (k: string) => fireEvent.keyDown(window, { key: k })

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true, writable: true })
}

describe('modes', () => {
  it('present mode shows marker and title only', () => {
    setWidth(1400)
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(document.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
  })

  it('browse mode shows title, caption, ToC on wide viewports, controls and dots', () => {
    setWidth(1400)
    render(<Presentation steps={steps} title="Deck" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('Caption A')).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-next]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-dot]')).toHaveLength(4)
  })

  it('omits the table of contents on narrow viewports', () => {
    setWidth(600)
    render(<Presentation steps={steps} title="Deck" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelectorAll('[data-presentation-dot]')).toHaveLength(4)
  })

  it('P toggles the mode and keeps the current step', () => {
    setWidth(1400)
    render(<Presentation steps={steps} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe(2)
    key('P')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe(2)
  })
})

describe('navigation', () => {
  it('moves with keyboard keys and clamps at both ends', () => {
    render(<Presentation steps={steps} title="Deck" />)
    key('ArrowLeft')
    expect(index()).toBe(0)
    key('ArrowRight')
    key(' ')
    key('PageDown')
    expect(index()).toBe(3)
    key('ArrowRight')
    expect(index()).toBe(3)
    key('ArrowLeft')
    key('PageUp')
    expect(index()).toBe(1)
  })

  it('moves with horizontal swipes', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const swipe = (dx: number) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: 300, clientY: 100 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 300 + dx, clientY: 104 }] })
    }
    swipe(-150)
    expect(index()).toBe(1)
    swipe(150)
    expect(index()).toBe(0)
  })

  it('jumps via progress dots and via ToC entries to the first step of the era', () => {
    setWidth(1400)
    render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(screen.getByLabelText('Step 3: Gamma'))
    expect(index()).toBe(2)
    fireEvent.click(screen.getByText('one', { selector: '[data-presentation-toc-entry]' }))
    expect(index()).toBe(0)
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight')
    fireEvent.click(screen.getByText('two', { selector: '[data-presentation-toc-entry]' }))
    expect(index()).toBe(2)
  })

  it('prev/next buttons step one at a time', () => {
    render(<Presentation steps={steps} title="Deck" />)
    fireEvent.click(document.querySelector('[data-presentation-next]')!)
    expect(index()).toBe(1)
    fireEvent.click(document.querySelector('[data-presentation-prev]')!)
    expect(index()).toBe(0)
  })

  it('exposes aria-current and an active hook on the active dot and ToC entry only', () => {
    setWidth(1400)
    render(<Presentation steps={steps} title="Deck" />)
    key('ArrowRight')
    key('ArrowRight')
    const dots = [...document.querySelectorAll('[data-presentation-dot]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.getAttribute('data-presentation-active'))).toEqual(['false', 'false', 'true', 'false'])
    const toc = [...document.querySelectorAll('[data-presentation-toc-entry]')]
    expect(toc.map((e) => e.getAttribute('data-presentation-active'))).toEqual(['false', 'true'])
    expect(toc[1].getAttribute('aria-current')).toBe('step')
  })

  it('does not advance the deck when a control has focus', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const button = document.querySelector<HTMLElement>('[data-presentation-dot]')!
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    fireEvent.keyDown(button, { key: ' ' })
    fireEvent.keyDown(button, { key: 'p' })
    expect(index()).toBe(0)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  })
})

describe('attribution and branding', () => {
  it('shows the default attribution link with a styling hook', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const link = document.querySelector<HTMLAnchorElement>('[data-presentation-attribution]')!
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(link.closest('footer')).not.toBeNull()
    expect(link.style.right).toBe('0px')
    expect(link.style.bottom).toBe('0px')
  })

  it('allows attribution to be overridden or disabled', () => {
    const { unmount } = render(<Presentation steps={steps} title="Deck" attribution={{ label: 'hi', href: 'https://x.test' }} />)
    expect(document.querySelector('[data-presentation-attribution]')?.textContent).toBe('hi')
    unmount()
    render(<Presentation steps={steps} title="Deck" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })

  it('renders no top-left brand unless the host provides one', () => {
    const { unmount } = render(<Presentation steps={steps} title="Deck" />)
    const slot = document.querySelector('[data-presentation-brand-slot]')!
    expect(slot.textContent).toBe('')
    expect(slot.querySelector('a')).toBeNull()
    unmount()
    render(<Presentation steps={steps} title="Deck" brand={<a href="/">host</a>} />)
    expect(document.querySelector('[data-presentation-brand-slot] a')?.textContent).toBe('host')
  })
})

describe('grouped scenes', () => {
  it('keeps one scene instance across grouped steps and remounts across groups', () => {
    mounts.mockClear()
    render(<Presentation steps={steps} title="Deck" />)
    expect(mounts).toHaveBeenCalledTimes(1)
    const scene = screen.getByTestId('counting')
    key('ArrowRight')
    expect(screen.getByTestId('counting')).toBe(scene)
    expect(scene.textContent).toBe('2')
    expect(mounts).toHaveBeenCalledTimes(1)
    key('ArrowRight')
    expect(mounts).toHaveBeenCalledTimes(2)
  })

  it('uses a different scene component without sharing an instance', async () => {
    const mixed: Step[] = [
      { id: 'x', era: 'e', title: 'X', caption: 'cx', payload: undefined, Scene: Other },
      { id: 'y', era: 'e', title: 'Y', caption: 'cy', payload: undefined, Scene: Other },
    ]
    render(<Presentation steps={mixed} title="Deck" />)
    key('ArrowRight')
    await waitFor(() => expect(screen.getAllByTestId('other')).toHaveLength(1))
  })
})

describe('entity continuity', () => {
  const ids = () =>
    new Set([...document.querySelectorAll('[data-presentation-id]')].map((e) => e.getAttribute('data-presentation-id')))

  it('sample entities persist with the same ids and the same DOM nodes as the scene grows', () => {
    render(<Presentation steps={STEPS} title="Sample" />)
    key('ArrowRight')
    key('ArrowRight')
    const before = ids()
    const card = document.querySelector('[data-presentation-id="htmp-card-1"]')!
    expect(card).not.toBeNull()
    key('ArrowRight')
    const after = ids()
    for (const id of before) expect(after.has(id)).toBe(true)
    expect(after.has('htmp-card-2')).toBe(true)
    expect(before.has('htmp-card-2')).toBe(false)
    // continuing entity is the same node, not re-created or re-wrapped as a newcomer
    expect(document.querySelector('[data-presentation-id="htmp-card-1"]')).toBe(card)
  })

  it('wraps only newcomers in Appear: the persisting entity keeps its original wrapper', () => {
    render(<Presentation steps={STEPS} title="Sample" />)
    key('ArrowRight')
    key('ArrowRight')
    const wrapper = document.querySelector('[data-presentation-id="htmp-card-1"]')!.closest('[data-presentation-appear]')
    key('ArrowRight')
    expect(document.querySelector('[data-presentation-id="htmp-card-1"]')!.closest('[data-presentation-appear]')).toBe(wrapper)
    const newcomer = document.querySelector('[data-presentation-id="htmp-card-2"]')!.closest('[data-presentation-appear]')
    expect(newcomer).not.toBe(wrapper)
  })

  it('newcomers stay hidden while persisting entities settle, then fade in', async () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    render(
      <Appear>
        <span data-testid="newcomer">hi</span>
      </Appear>,
    )
    const wrapper = screen.getByTestId('newcomer').closest<HTMLElement>('[data-presentation-appear]')!
    expect(wrapper.style.opacity).toBe('0')
    // well inside the layout transition: the newcomer has not started entering
    await new Promise((r) => setTimeout(r, (LAYOUT_T * 1000) / 3))
    expect(wrapper.style.opacity).toBe('0')
    // after the layout transition plus the fade, it is fully visible
    await waitFor(() => expect(wrapper.style.opacity).toBe('1'), { timeout: 3000 })
  })

  it('morphs a continuing arrow between geometries instead of snapping', async () => {
    const view = render(<svg><Arrow id="a1" from={{ x: 10, y: 10 }} to={{ x: 100, y: 10 }} /></svg>)
    const line = () => document.querySelector('[data-presentation-id="a1"] path')!.getAttribute('d')
    await waitFor(() => expect(line()).toBe('M10,10 Q55,10 100,10'))
    view.rerender(<svg><Arrow id="a1" from={{ x: 10, y: 10 }} to={{ x: 100, y: 200 }} /></svg>)
    // not snapped to the final geometry on the render that changed the endpoints
    expect(line()).not.toBe('M10,10 Q55,105 100,200')
    // it arrives there by animating
    await waitFor(() => expect(line()).toBe('M10,10 Q55,105 100,200'), { timeout: 3000 })
  })

  it('exposes a stable layoutId-backed identity on primitives', () => {
    render(<Box id="e1" variant="v" className="c" />)
    const el = document.querySelector('[data-presentation-id="e1"]')!
    expect(el.getAttribute('data-presentation-node')).toBe('box')
    expect(el.getAttribute('data-variant')).toBe('v')
    expect(el.classList.contains('c')).toBe(true)
  })

  it('removes departing entities with an exit animation', async () => {
    const Dep = ({ payload }: SceneProps<{ on: boolean }>) => (
      <div>
        <AnimatePresence>
          {payload.on && (
            <Appear key="gone">
              <span data-testid="gone">bye</span>
            </Appear>
          )}
        </AnimatePresence>
      </div>
    )
    const dep: Step<{ on: boolean }>[] = [
      { id: '1', era: 'e', title: 'One', caption: 'c1', groupKey: 'g', payload: { on: true }, Scene: Dep },
      { id: '2', era: 'e', title: 'Two', caption: 'c2', groupKey: 'g', payload: { on: false }, Scene: Dep },
    ]
    render(<Presentation steps={dep} title="Deck" />)
    expect(screen.queryByTestId('gone')).not.toBeNull()
    act(() => key('ArrowRight'))
    // the exit animation is in flight: the entity is still mounted and fading out
    expect(screen.queryByTestId('gone')).not.toBeNull()
    await waitFor(() => expect(screen.queryByTestId('gone')).toBeNull())
  })
})
