import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { Box, DESIGN_H, DESIGN_W, Presentation, type SceneProps, type Step } from '../src/presentation-kit'
import { setWideViewport } from './setup'

interface Payload { label: string; count: number }

const mounts: string[] = []

function GroupedScene({ payload }: SceneProps<Payload>) {
  useEffect(() => { mounts.push('grouped') }, [])
  return <Box id="fixture:subject" className="fixture-subject">{payload.label}</Box>
}

function SoloScene({ payload }: SceneProps<Payload>) {
  return <Box id="fixture:solo">{payload.label}</Box>
}

// Typed steps must reach <Presentation> without casts; `tsc -b` checks this file.
const steps: Step<Payload>[] = [
  { id: 'one', era: 'opening', title: 'First', caption: 'First caption', Scene: GroupedScene, payload: { label: 'alpha', count: 1 }, groupKey: 'story' },
  { id: 'two', era: 'opening', title: 'Second', caption: 'Second caption', Scene: GroupedScene, payload: { label: 'beta', count: 2 }, groupKey: 'story' },
  { id: 'three', era: 'middle', title: 'Third', caption: 'Third caption', Scene: GroupedScene, payload: { label: 'gamma', count: 3 }, groupKey: 'story' },
  { id: 'four', era: 'ending', title: 'Fourth', caption: 'Fourth caption', Scene: SoloScene, payload: { label: 'delta', count: 4 } },
]

function renderDeck(props: Partial<Parameters<typeof Presentation<Payload>>[0]> = {}) {
  const result = render(<Presentation steps={steps} title="Fixture deck" {...props} />)
  const root = () => result.container.querySelector('[data-presentation]') as HTMLElement
  const index = () => Number(root().getAttribute('data-step-index'))
  return { ...result, root, index }
}

const press = (key: string, target: Element = document.body) => act(() => { fireEvent.keyDown(target, { key }) })

describe('typed payload boundary', () => {
  it('passes each step payload to its scene', () => {
    const { root } = renderDeck()
    expect(root().getAttribute('data-step-count')).toBe('4')
    expect(screen.getByText('alpha')).toBeTruthy()
  })
})

describe('style ownership boundary', () => {
  it('renders kit markup without visual inline styles', () => {
    const { container } = renderDeck()
    const visual = /^(color|background|border|box-shadow|font|outline|text-decoration|padding|margin|gap|border-radius)/
    for (const element of container.querySelectorAll<HTMLElement>('*')) {
      const properties = Array.from({ length: element.style.length }, (_, i) => element.style.item(i))
      expect(properties.filter((name) => visual.test(name)), element.outerHTML.slice(0, 80)).toEqual([])
    }
  })

  it('exposes stable hooks for presentation-owned CSS', () => {
    const { container } = renderDeck({ className: 'fixture-deck' })
    for (const hook of ['data-presentation', 'data-presentation-header', 'data-presentation-stage', 'data-presentation-scene', 'data-presentation-footer', 'data-presentation-caption', 'data-presentation-progress', 'data-presentation-toc', 'data-presentation-attribution']) {
      expect(container.querySelector(`[${hook}]`), hook).not.toBeNull()
    }
    expect(container.querySelector('[data-presentation-node="box"]')?.classList.contains('fixture-subject')).toBe(true)
    expect(container.querySelector('[data-presentation]')?.classList.contains('fixture-deck')).toBe(true)
  })

  it('uses the 880 × 380 design canvas by default', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    const { container } = renderDeck()
    const canvas = container.querySelector<HTMLElement>('.presentation-canvas')!
    expect([canvas.style.width, canvas.style.height]).toEqual(['880px', '380px'])
  })
})

describe('attribution', () => {
  it('links the default bottom-right credit to the and-scene repository', () => {
    const { container } = renderDeck()
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.closest('[data-presentation-attribution]')?.closest('[data-presentation-footer]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('')
  })

  it('can be replaced or removed by the presentation', () => {
    renderDeck({ attribution: false })
    expect(screen.queryByRole('link', { name: 'made by and-scene' })).toBeNull()
  })
})

describe('navigation', () => {
  it('advances with Right, Space, and PageDown and goes back with Left and PageUp', () => {
    const { index } = renderDeck()
    press('ArrowRight')
    press(' ')
    press('PageDown')
    expect(index()).toBe(3)
    press('ArrowLeft')
    press('PageUp')
    expect(index()).toBe(1)
  })

  it('clamps at both ends without wrapping', () => {
    const { index } = renderDeck()
    press('ArrowLeft')
    expect(index()).toBe(0)
    for (let i = 0; i < 10; i++) press('ArrowRight')
    expect(index()).toBe(3)
  })

  it('swipes left to advance and right to go back', () => {
    const { root, index } = renderDeck()
    const swipe = (from: number, to: number) => {
      fireEvent.touchStart(root(), { touches: [{ clientX: from, clientY: 100 }] })
      fireEvent.touchEnd(root(), { changedTouches: [{ clientX: to, clientY: 100 }] })
    }
    swipe(300, 100)
    expect(index()).toBe(1)
    swipe(100, 300)
    expect(index()).toBe(0)
  })

  it('jumps directly from progress and table-of-contents entries', () => {
    const { container, index } = renderDeck()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3: Third' }))
    expect(index()).toBe(2)
    const ending = [...container.querySelectorAll('[data-presentation-toc-item]')].find((item) => item.textContent === 'opening')!
    fireEvent.click(ending)
    expect(index()).toBe(0)
  })

  it('does not advance the deck while an interactive control has focus', () => {
    const { index } = renderDeck()
    const next = screen.getByRole('button', { name: 'Next' })
    next.focus()
    press('ArrowRight', next)
    expect(index()).toBe(0)
  })

  it('exposes semantic and hook-based active state on progress and contents', () => {
    const { container } = renderDeck()
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3: Third' }))
    const progress = [...container.querySelectorAll('[data-presentation-progress-item]')]
    expect(progress.map((item) => item.getAttribute('data-presentation-active'))).toEqual(['false', 'false', 'true', 'false'])
    expect(progress.map((item) => item.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
    const toc = [...container.querySelectorAll('[data-presentation-toc-item]')]
    expect(toc.map((item) => item.getAttribute('data-presentation-active'))).toEqual(['false', 'true', 'false'])
    expect(toc.map((item) => item.getAttribute('aria-current'))).toEqual([null, 'location', null])
  })
})

describe('modes', () => {
  it('shows reading chrome in browse mode', () => {
    const { container } = renderDeck()
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('First caption')
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy()
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
  })

  it('hides the table of contents on narrow viewports until opened', () => {
    setWideViewport(false)
    const { container } = renderDeck()
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Contents' }))
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('shows only the marker and title in present mode', () => {
    const { container } = renderDeck({ initialMode: 'present' })
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01First')
    for (const hook of ['data-presentation-caption', 'data-presentation-toc', 'data-presentation-progress', 'data-presentation-prev', 'data-presentation-next']) {
      expect(container.querySelector(`[${hook}]`), hook).toBeNull()
    }
  })

  it('keeps the current step when toggling modes', () => {
    const { root, index } = renderDeck()
    press('ArrowRight')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect([root().getAttribute('data-presentation-mode'), index()]).toEqual(['present', 1])
    press('p')
    expect([root().getAttribute('data-presentation-mode'), index()]).toEqual(['browse', 1])
  })
})

describe('scene continuity', () => {
  it('updates a grouped scene in place instead of remounting it', () => {
    mounts.length = 0
    const { container } = renderDeck()
    const subject = container.querySelector('[data-presentation-node="box"]')
    press('ArrowRight')
    press('ArrowRight')
    expect(screen.getByText('gamma')).toBe(subject)
    expect(mounts).toEqual(['grouped'])
  })
})
