// @vitest-environment jsdom
import { StrictMode, useEffect, type ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Star } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import {
  ENTER_DELAY,
  LAYOUT_T,
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  Presentation,
  SceneLayer,
  SymbolChip,
  sectionsOf,
  stepNumber,
  type SceneProps,
  type Step,
} from '../index.ts'

interface Payload {
  n: number
}

let mounts = 0
function Counting({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts++
  }, [])
  return <SceneLayer><Box id="persist">n={payload.n}</Box></SceneLayer>
}
function Other({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Label id="other">other {payload.n}</Label></SceneLayer>
}

const meta = (i: number, era: string) => ({
  id: `s${i}`,
  era,
  title: `Title ${i}`,
  caption: `Caption ${i}`,
})

// Typed payloads flow through <Presentation> with no casts.
const grouped: Step<Payload>[] = [
  { ...meta(1, 'alpha'), Scene: Counting, groupKey: 'g', payload: { n: 1 } },
  { ...meta(2, 'alpha'), Scene: Counting, groupKey: 'g', payload: { n: 2 } },
  { ...meta(3, 'beta'), Scene: Other, payload: { n: 3 } },
  { ...meta(4, 'gamma'), Scene: Counting, groupKey: 'g', payload: { n: 4 } },
]

const press = (key: string) => act(() => void fireEvent.keyDown(window, { key }))
const root = () => document.querySelector('[data-presentation-root]')!
const index = () => root().getAttribute('data-step-index')

function setWidth(w: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
}

function show(ui: ReactNode, width = 1400) {
  setWidth(width)
  return render(ui)
}

describe('step model', () => {
  it('exposes id, era, title, caption and the step count/index hooks', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />)
    expect(root().getAttribute('data-step-count')).toBe('4')
    expect(index()).toBe('0')
    expect(root().getAttribute('data-step-id')).toBe('s1')
    expect(screen.getByText('Title 1')).toBeTruthy()
    expect(screen.getByText('Caption 1')).toBeTruthy()
  })

  it('derives the on-screen number from position when steps are reordered', () => {
    expect(stepNumber(0)).toBe(1)
    const { rerender } = show(<Presentation steps={grouped} title="Deck" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('01 / 04')
    const reordered = [grouped[2], grouped[0], grouped[1]]
    rerender(<Presentation steps={reordered} title="Deck" />)
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('01 / 03')
    expect(root().getAttribute('data-step-id')).toBe('s3')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('02 / 03')
  })

  it('groups consecutive steps with the same era into sections', () => {
    expect(sectionsOf(grouped)).toEqual([
      { era: 'alpha', first: 0, last: 1 },
      { era: 'beta', first: 2, last: 2 },
      { era: 'gamma', first: 3, last: 3 },
    ])
  })
})

describe('modes', () => {
  it('present mode shows the marker and one-line title only', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="present" />)
    expect(document.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(screen.getByText('Title 1')).toBeTruthy()
    expect(document.querySelector('[data-presentation-step-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-nav-button]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
  })

  it('browse mode shows title, caption, ToC on wide viewports, controls and progress', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />)
    expect(screen.getByText('Caption 1')).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(document.querySelectorAll('[data-presentation-nav-button]')).toHaveLength(2)
    expect(document.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Deck')
  })

  it('hides the table of contents on narrow viewports in browse mode', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />, 600)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).not.toBeNull()
  })

  it('defaults to present mode and toggling keeps the current step', () => {
    show(<Presentation steps={grouped} title="Deck" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(index()).toBe('2')
    fireEvent.click(screen.getByLabelText('Switch to present mode'))
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(index()).toBe('2')
  })
})

describe('navigation chrome', () => {
  it('jumps from a progress indicator and from a ToC entry (first step of the era)', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />)
    fireEvent.click(screen.getByLabelText('Go to step 3: Title 3'))
    expect(index()).toBe('2')
    fireEvent.click(within(document.querySelector('[data-presentation-toc]')!).getByText('alpha'))
    expect(index()).toBe('0')
    press('ArrowRight')
    fireEvent.click(within(document.querySelector('[data-presentation-toc]')!).getByText('gamma'))
    expect(index()).toBe('3')
  })

  it('exposes aria-current and an active hook on the active progress item and ToC entry only', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />)
    press('ArrowRight')
    press('ArrowRight')
    const dots = [...document.querySelectorAll('[data-presentation-progress-item]')]
    expect(dots.map((d) => d.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    expect(dots.map((d) => d.getAttribute('data-active'))).toEqual(['false', 'false', 'true', 'false'])
    const toc = [...document.querySelectorAll('[data-presentation-toc-item]')]
    expect(toc.map((d) => d.getAttribute('aria-current'))).toEqual([null, 'step', null])
    expect(toc.map((d) => d.getAttribute('data-active'))).toEqual(['false', 'true', 'false'])
  })

  it('prev/next buttons navigate and are disabled at the ends', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />)
    const prev = screen.getByLabelText('Previous step') as HTMLButtonElement
    const next = screen.getByLabelText('Next step') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    expect(index()).toBe('1')
    fireEvent.click(screen.getByLabelText('Go to step 4: Title 4'))
    expect(next.disabled).toBe(true)
    fireEvent.click(prev)
    expect(index()).toBe('2')
  })

  it('leaves navigation keys to a focused control instead of advancing', () => {
    show(<Presentation steps={grouped} title="Deck" initialMode="browse" />)
    const dot = screen.getByLabelText('Go to step 2: Title 2')
    act(() => void fireEvent.keyDown(dot, { key: 'ArrowRight' }))
    act(() => void fireEvent.keyDown(dot, { key: ' ' }))
    expect(index()).toBe('0')
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution link with a styling hook', () => {
    show(<Presentation steps={grouped} title="Deck" />)
    const a = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    expect(a.style.right).toBe('16px')
    expect(a.style.bottom).toBe('8px')
  })

  it('does not render a default top-left brand', () => {
    show(<Presentation steps={grouped} title="Deck" />)
    const brand = document.querySelector('[data-presentation-brand]')!
    expect(brand.childNodes).toHaveLength(0)
    expect(brand.querySelector('a')).toBeNull()
  })

  it('renders host-provided branding and honours attribution overrides', () => {
    show(<Presentation steps={grouped} title="Deck" brand={<b>Acme</b>} attribution={{ label: 'by me', href: '/me' }} />)
    expect(document.querySelector('[data-presentation-brand]')!.textContent).toBe('Acme')
    expect(screen.getByText('by me').getAttribute('href')).toBe('/me')
  })

  it('can omit the attribution entirely', () => {
    show(<Presentation steps={grouped} title="Deck" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('canvas', () => {
  it('uses 880 x 380 by default and honours an override', () => {
    const { unmount } = show(<Presentation steps={grouped} title="Deck" />)
    const canvas = () => document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([canvas().style.width, canvas().style.height]).toEqual(['880px', '380px'])
    unmount()
    show(<Presentation steps={grouped} title="Deck" canvas={{ width: 400, height: 200 }} />)
    expect([canvas().style.width, canvas().style.height]).toEqual(['400px', '200px'])
  })

  it('rescales on resize while keeping the composition size fixed', () => {
    show(<Presentation steps={grouped} title="Deck" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    const before = canvas.getAttribute('data-presentation-scale')
    setWidth(700)
    act(() => void fireEvent(window, new Event('resize')))
    expect(canvas.getAttribute('data-presentation-scale')).not.toBe(before)
    expect(canvas.style.width).toBe('880px')
  })
})

describe('grouped scenes', () => {
  it('updates one mounted scene in place across steps that share a group', async () => {
    mounts = 0
    show(<Presentation steps={grouped} title="Deck" />)
    expect(mounts).toBe(1)
    press('ArrowRight')
    expect(screen.getByText('n=2')).toBeTruthy()
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
    expect(mounts).toBe(1)
  })

  it('replaces the scene when the group or scene component differs', async () => {
    mounts = 0
    show(<Presentation steps={grouped} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    expect(screen.getByText('other 3')).toBeTruthy()
    await waitFor(() => expect(screen.queryByText('n=2')).toBeNull())
    press('ArrowRight')
    await waitFor(() => expect(screen.getByText('n=4')).toBeTruthy())
    expect(mounts).toBe(2)
  })

  it('keeps the same entity element across grouped steps under StrictMode', () => {
    show(<StrictMode><Presentation steps={grouped.slice(0, 2)} title="Deck" /></StrictMode>)
    const before = document.querySelector('[data-presentation-entity="persist"]')
    press('ArrowRight')
    expect(document.querySelector('[data-presentation-entity="persist"]')).toBe(before)
  })
})

describe('entity transitions', () => {
  it('gives persisting entities a shared identity hook and wraps newcomers only in Appear', () => {
    const { rerender } = show(
      <Box id="a">A</Box>,
    )
    expect(document.querySelector('[data-presentation-entity="a"]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-appear]')).toBeNull()
    rerender(<><Box id="a">A</Box><Appear><Box id="b">B</Box></Appear></>)
    const appear = document.querySelector('[data-presentation-appear]')!
    expect(appear.querySelector('[data-presentation-entity="b"]')).not.toBeNull()
    expect(appear.querySelector('[data-presentation-entity="a"]')).toBeNull()
    expect((appear as HTMLElement).style.opacity).toBe('0')
  })

  it('delays newcomers until the persisting entities have mostly finished their layout morph', () => {
    expect(ENTER_DELAY).toBeGreaterThan(LAYOUT_T.duration / 2)
    expect(ENTER_DELAY).toBeLessThanOrEqual(LAYOUT_T.duration)
  })

  it('animates a departing entity out before removing it', async () => {
    const { rerender } = show(<Appear when><Box id="gone">x</Box></Appear>)
    rerender(<Appear when={false}><Box id="gone">x</Box></Appear>)
    expect(document.querySelector('[data-presentation-entity="gone"]')).not.toBeNull()
    await waitFor(() => expect(document.querySelector('[data-presentation-entity="gone"]')).toBeNull(), {
      timeout: 3000,
    })
  })
})

describe('primitives expose style hooks', () => {
  it('forwards class, style and variant hooks and stable entity ids', () => {
    show(
      <SceneLayer className="layer">
        <Box id="b" className="c1" style={{ zIndex: 3 }} variant="v" at={{ x: 5, y: 6, w: 7, h: 8 }} Icon={Star}>t</Box>
        <Label id="l" className="c2">l</Label>
        <Frame id="f" className="c3" />
        <Emphasis id="e" className="c4" />
        <SymbolChip id="s" className="c5" Icon={Star}>s</SymbolChip>
        <Arrow id="a" className="c6" from={[0, 0]} to={[40, 40]} both dashed variant="av" />
      </SceneLayer>,
    )
    const kinds = ['box', 'label', 'frame', 'emphasis', 'symbol-chip', 'arrow']
    const ids = ['b', 'l', 'f', 'e', 's', 'a']
    kinds.forEach((kind, i) => {
      const el = document.querySelector(`[data-presentation-node="${kind}"]`) as HTMLElement
      expect(el.getAttribute('data-presentation-entity')).toBe(ids[i])
      expect(el.className).toBe(`c${i + 1}`)
    })
    const box = document.querySelector('[data-presentation-node="box"]') as HTMLElement
    expect(box.getAttribute('data-presentation-variant')).toBe('v')
    expect(box.style.left).toBe('5px')
    expect(box.style.zIndex).toBe('3')
    expect(box.querySelector('[data-presentation-glyph]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-layer]')).not.toBeNull()
  })
})
