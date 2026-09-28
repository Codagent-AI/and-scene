import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  Appear,
  Box,
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  Presentation,
  SceneLayer,
  type SceneProps,
  type Step,
  usePresentationNav,
} from '..'

afterEach(cleanup)

interface Payload {
  items: string[]
}

let mounts = 0
function GroupScene({ payload }: SceneProps<Payload>) {
  const [id] = useState(() => ++mounts)
  return (
    <SceneLayer>
      {payload.items.map((item) => (
        <Box key={item} id={item} data-testid={`box-${item}`}>
          {item}
        </Box>
      ))}
      <span data-testid="instance">{id}</span>
    </SceneLayer>
  )
}

function OtherScene() {
  return <SceneLayer />
}

const steps: Step<Payload>[] = [
  { id: 'a', era: 'One', title: 'Title A', caption: 'Caption A', groupKey: 'g', Scene: GroupScene, payload: { items: ['x'] } },
  { id: 'b', era: 'One', title: 'Title B', caption: 'Caption B', groupKey: 'g', Scene: GroupScene, payload: { items: ['x', 'y'] } },
  { id: 'c', era: 'Two', title: 'Title C', caption: 'Caption C', Scene: OtherScene, payload: { items: [] } },
]

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const index = () => Number(root().dataset.stepIndex)
const key = (k: string, target: Element | Window = window) => act(() => void fireEvent.keyDown(target, { key: k }))

describe('typed payload boundary', () => {
  it('accepts a typed step array without casts', () => {
    render(<Presentation<Payload> steps={steps} title="Deck" />)
    expect(root().dataset.stepCount).toBe('3')
  })
})

describe('style ownership', () => {
  it('provides hooks and no visual defaults', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const visual = /color|background|font|border|shadow|padding|margin|radius|gap/i
    for (const el of document.querySelectorAll<HTMLElement>('[data-presentation-root], [data-presentation-root] *')) {
      expect(el.getAttribute('style') ?? '').not.toMatch(visual)
    }
    expect(document.querySelector('[data-presentation-stage]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-entity="x"]')).not.toBeNull()
  })

  it('uses the 880 x 380 canvas by default', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
  })
})

describe('attribution', () => {
  it('renders the default link with a hook and no top-left brand', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const a = document.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(a.textContent).toBe('made by and-scene')
    expect(a.href).toContain('github.com')
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    expect(document.querySelector('[data-presentation-brand] a')).toBeNull()
  })
})

describe('navigation', () => {
  it('handles keys and clamps at both ends', () => {
    render(<Presentation steps={steps} title="Deck" />)
    key('ArrowLeft')
    expect(index()).toBe(0)
    key('ArrowRight')
    key(' ')
    expect(index()).toBe(2)
    key('PageDown')
    expect(index()).toBe(2)
    key('PageUp')
    expect(index()).toBe(1)
    key('ArrowLeft')
    expect(index()).toBe(0)
  })

  it('swipes', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const swipe = (from: number, to: number) => {
      fireEvent.touchStart(window, { changedTouches: [{ clientX: from, clientY: 0 }] })
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: to, clientY: 0 }] })
    }
    swipe(300, 100)
    expect(index()).toBe(1)
    swipe(100, 300)
    expect(index()).toBe(0)
  })

  it('does not hijack keys on focused controls', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const next = document.querySelector('[data-presentation-next]') as HTMLElement
    next.focus()
    key('ArrowRight', next)
    expect(index()).toBe(0)
  })

  it('exposes active state on progress and ToC and jumps directly', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const dots = document.querySelectorAll('[data-presentation-progress-item]')
    expect(dots).toHaveLength(3)
    fireEvent.click(dots[1])
    expect(index()).toBe(1)
    const active = (sel: string) =>
      [...document.querySelectorAll(sel)].map((e) => [e.getAttribute('aria-current'), (e as HTMLElement).dataset.presentationActive])
    expect(active('[data-presentation-progress-item]')).toEqual([[null, 'false'], ['step', 'true'], [null, 'false']])
    expect(active('[data-presentation-toc-item]')).toEqual([['step', 'true'], [null, 'false']])
    fireEvent.click(screen.getByText('Two'))
    expect(index()).toBe(2)
    fireEvent.click(screen.getByText('One'))
    expect(index()).toBe(0)
  })

  it('clamps goTo and ignores non-finite targets', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.goTo(1.7))
    expect(result.current.index).toBe(1)
    act(() => result.current.goTo(Number.NaN))
    expect(result.current.index).toBe(1)
    act(() => result.current.goTo(Number.POSITIVE_INFINITY))
    expect(result.current.index).toBe(1)
    act(() => result.current.goTo(99))
    expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-5))
    expect(result.current.index).toBe(0)
  })
})

describe('modes', () => {
  it('present mode hides caption, ToC, and controls; browse shows them; toggle keeps position', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="present" />)
    key('ArrowRight')
    const q = (s: string) => document.querySelector(s)
    expect(q('[data-presentation-title]')?.textContent).toBe('Title B')
    expect(q('[data-presentation-marker]')?.textContent).toContain('02')
    for (const s of ['caption', 'toc', 'prev', 'next', 'progress']) expect(q(`[data-presentation-${s}]`)).toBeNull()
    key('p')
    expect(root().dataset.presentationMode).toBe('browse')
    expect(index()).toBe(1)
    expect(q('[data-presentation-caption]')?.textContent).toBe('Caption B')
    for (const s of ['toc', 'prev', 'next', 'progress']) expect(q(`[data-presentation-${s}]`)).not.toBeNull()
    key('P')
    expect(root().dataset.presentationMode).toBe('present')
    expect(index()).toBe(1)
  })
})

describe('scene continuity', () => {
  it('keeps one scene instance across grouped steps and exits departing entities', async () => {
    mounts = 0
    const dep: Step<Payload>[] = [steps[1], steps[0], steps[2]]
    render(<Presentation steps={dep} title="Deck" />)
    expect(screen.getByTestId('instance').textContent).toBe('1')
    expect(screen.getByTestId('box-y')).toBeTruthy()
    key('ArrowRight')
    expect(mounts).toBe(1)
    await waitFor(() => expect(screen.queryByTestId('box-y')).toBeNull())
    expect(screen.getByTestId('box-x')).toBeTruthy()
    expect(screen.getByTestId('instance').textContent).toBe('1')
  })

  it('delays newcomers until layout morphs settle and starts them hidden', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    render(<Appear data-testid="new">n</Appear>)
    expect(screen.getByTestId('new').style.opacity).toBe('0')
  })
})
