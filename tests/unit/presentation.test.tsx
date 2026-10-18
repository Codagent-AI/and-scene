// @vitest-environment jsdom
import { StrictMode, useEffect } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, Presentation, computeFitScale, eraEntries, type SceneProps } from '../../src/presentation-kit'
import { BeatScene, makeSteps, setViewport, type BeatPayload } from './fixtures'

afterEach(cleanup)
beforeEach(() => setViewport(1440))

const ERAS = ['one', 'one', 'two', 'two', 'two', 'three']
const root = (c: HTMLElement) => c.querySelector('[data-presentation-root]') as HTMLElement
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))

describe('step model', () => {
  it('renders the active step title, caption and diagram state', () => {
    const steps = makeSteps(ERAS)
    const { container } = render(<Presentation steps={steps} title="T" />)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 0')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 0')
    key('ArrowRight')
    key('ArrowRight')
    expect(screen.getAllByTestId('scene').at(-1)?.textContent).toBe('beat 2')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 2')
  })

  it('derives numbers and progress labels from position after insert, remove and reorder', () => {
    const steps = makeSteps(['a', 'a', 'b'])
    const { container, rerender } = render(<Presentation steps={steps} title="T" />)
    const marker = () => container.querySelector('[data-presentation-marker]')?.textContent
    const labels = () => [...container.querySelectorAll('[data-presentation-progress-item]')].map((b) => b.getAttribute('aria-label'))
    expect(marker()).toContain('01 / 03')
    const inserted = [steps[0], { ...steps[1], id: 'new', title: 'Inserted' }, ...steps.slice(1)]
    rerender(<Presentation steps={inserted} title="T" />)
    expect(marker()).toContain('01 / 04')
    expect(labels()).toEqual(['Step 1: Title 0', 'Step 2: Inserted', 'Step 3: Title 1', 'Step 4: Title 2'])
    rerender(<Presentation steps={[inserted[3], inserted[0]]} title="T" />)
    expect(labels()).toEqual(['Step 1: Title 2', 'Step 2: Title 0'])
    expect(root(container).getAttribute('data-presentation-step-count')).toBe('2')
    key('ArrowRight')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toContain('02 / 02')
    expect(inserted.map((s) => s.id)).toEqual(['s0', 'new', 's1', 's2'])
  })

  it('keeps the step-count and step-index hooks (both spellings) in sync', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    const check = (index: number) => {
      const r = root(container)
      for (const name of ['data-step-index', 'data-presentation-step-index']) expect(r.getAttribute(name)).toBe(String(index))
      for (const name of ['data-step-count', 'data-presentation-step-count']) expect(r.getAttribute(name)).toBe('6')
    }
    check(0)
    key('ArrowRight')
    check(1)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[4])
    check(4)
    fireEvent.click(screen.getByText('Previous'))
    check(3)
  })
})

describe('present and browse modes', () => {
  it('present mode shows marker and one-line title only', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" initialMode="present" />)
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(container.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-title]')).toHaveLength(1)
    for (const hidden of ['caption', 'toc', 'prev', 'next', 'progress-item']) {
      expect(container.querySelector(`[data-presentation-${hidden}]`)).toBeNull()
    }
    expect(container.querySelector('[data-presentation-footer] > [data-presentation-title]')).not.toBeNull()
  })

  it('browse mode shows title, caption, progress, prev/next and a table of contents on wide viewports', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" initialMode="browse" />)
    expect(root(container).getAttribute('data-presentation-mode')).toBe('browse')
    expect(container.querySelector('[data-presentation-header] [data-presentation-title]')).not.toBeNull()
    for (const shown of ['caption', 'toc', 'prev', 'next']) {
      expect(container.querySelector(`[data-presentation-${shown}]`)).not.toBeNull()
    }
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)
  })

  it('hides the table of contents below 1024px but keeps the other browse chrome', () => {
    setViewport(1023)
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(container.querySelector('[data-presentation-caption]')).not.toBeNull()
    act(() => setViewport(1024))
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
  })

  it('toggling the mode keeps the step and updates fit geometry without changing the scene instance', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    key('ArrowRight')
    key('ArrowRight')
    const frame = () => container.querySelector('[data-presentation-canvas-frame]')!
    const browseScale = frame().getAttribute('data-presentation-scale')
    key('p')
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('2')
    expect(frame().getAttribute('data-presentation-scale')).not.toBe(browseScale)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 2')
    key('p')
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('2')
  })
})

describe('direct jumps and active state', () => {
  it('progress items jump to their step and only the active one exposes current state', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    const dots = () => [...container.querySelectorAll('[data-presentation-progress-item]')]
    dots().forEach((dot, i) => {
      fireEvent.click(dot)
      expect(root(container).getAttribute('data-presentation-step-index')).toBe(String(i))
      dots().forEach((other, j) => {
        expect(other.getAttribute('aria-current')).toBe(i === j ? 'step' : null)
        expect(other.hasAttribute('data-presentation-active')).toBe(i === j)
      })
    })
    expect(container.querySelectorAll('[data-presentation-progress-item][data-presentation-active]')).toHaveLength(1)
  })

  it('table-of-contents entries jump to the first step of their era from any later step', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    const toc = within(container.querySelector('[data-presentation-toc]') as HTMLElement)
    expect(toc.getAllByRole('button').map((b) => b.textContent)).toEqual(['one', 'two', 'three'])
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[4])
    fireEvent.click(toc.getByText('two'))
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('2')
    const active = () => [...container.querySelectorAll('[data-presentation-toc-item][data-presentation-active]')].map((e) => e.textContent)
    expect(active()).toEqual(['two'])
    key('ArrowRight')
    expect(active()).toEqual(['two'])
    fireEvent.click(toc.getByText('three'))
    expect(active()).toEqual(['three'])
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('5')
    fireEvent.click(toc.getByText('one'))
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('0')
    expect(container.querySelector('[data-presentation-toc-item][aria-current="step"]')?.textContent).toBe('one')
  })

  it('clamps rendered prev/next controls at the boundaries', () => {
    const { container } = render(<Presentation steps={makeSteps(['a', 'b'])} title="T" />)
    const prev = screen.getByText('Previous') as HTMLButtonElement
    const next = screen.getByText('Next') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(next.disabled).toBe(true)
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('1')
  })

  it('lets a focused control keep Space instead of also advancing the deck', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    const next = screen.getByText('Next')
    act(() => void fireEvent.keyDown(next, { key: ' ' }))
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('0')
  })
})

describe('attribution and brand', () => {
  it('shows a linked "made by and-scene" attribution with a styling hook and no top-left brand', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    const link = container.querySelector('[data-presentation-attribution]') as HTMLAnchorElement
    expect(link.textContent).toBe('made by and-scene')
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(link.parentElement?.style.position).toBe('absolute')
    expect(link.parentElement?.style.right).toBe('0px')
    expect(link.parentElement?.style.bottom).toBe('0px')
    expect(container.querySelector('[data-presentation-header] a')).toBeNull()
    expect(container.querySelector('[data-presentation-brand-slot]')?.childElementCount).toBe(0)
  })

  it('renders a host brand in the header and can drop the attribution', () => {
    const { container } = render(
      <Presentation steps={makeSteps(ERAS)} title="T" brand={<a href="/">host</a>} attribution={false} />,
    )
    expect(container.querySelector('[data-presentation-header] a')?.textContent).toBe('host')
    expect(container.querySelector('[data-presentation-attribution]')).toBeNull()
  })
})

describe('typed payloads and StrictMode', () => {
  it('passes each step its own payload to the Scene', () => {
    const { container } = render(<Presentation<BeatPayload> steps={makeSteps(ERAS, BeatScene, 'g')} title="T" />)
    key('ArrowRight')
    expect(container.querySelector('[data-testid="scene"]')?.textContent).toBe('beat 1')
  })

  it('does not run a grouped Scene effect twice per navigation under StrictMode', () => {
    let mounts = 0
    function Counting({ payload }: SceneProps<BeatPayload>) {
      useEffect(() => {
        mounts++
      }, [])
      return <div>{payload.beat}</div>
    }
    render(
      <StrictMode>
        <Presentation steps={makeSteps(ERAS, Counting, 'g')} title="T" />
      </StrictMode>,
    )
    const afterMount = mounts
    key('ArrowRight')
    key('ArrowRight')
    expect(mounts).toBe(afterMount)
  })
})

describe('table of contents with a repeated era', () => {
  it('lists each era once, jumps to its first step, and marks exactly one entry current', () => {
    const steps = makeSteps(['a', 'b', 'a'])
    expect(eraEntries(steps)).toEqual([
      { era: 'a', first: 0 },
      { era: 'b', first: 1 },
    ])
    const { container } = render(<Presentation steps={steps} title="T" />)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[2])
    const active = () => [...container.querySelectorAll('[data-presentation-toc-item][data-presentation-active]')].map((e) => e.textContent)
    expect(active()).toEqual(['a'])
    fireEvent.click(within(container.querySelector('[data-presentation-toc]') as HTMLElement).getByText('a'))
    expect(root(container).getAttribute('data-presentation-step-index')).toBe('0')
    expect(active()).toEqual(['a'])
  })
})

describe('canvas scaling through the component', () => {
  it('renders the default 880 x 380 canvas and refits uniformly when the viewport resizes', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    const canvas = () => container.querySelector('[data-presentation-canvas]') as HTMLElement
    const frame = () => container.querySelector('[data-presentation-canvas-frame]') as HTMLElement
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    expect(canvas().style.height).toBe(`${DESIGN_H}px`)
    for (const [w, h] of [[1440, 900], [1100, 700], [700, 900]]) {
      act(() => setViewport(w, h))
      const scale = computeFitScale(w, h, 'browse')
      expect(Number(frame().getAttribute('data-presentation-scale'))).toBeCloseTo(scale, 3)
      expect(canvas().style.transform).toBe(`scale(${scale})`)
      expect(parseFloat(frame().style.width) / parseFloat(frame().style.height)).toBeCloseTo(DESIGN_W / DESIGN_H, 3)
    }
    key('ArrowRight')
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
  })

  it('honours a custom design canvas', () => {
    const { container } = render(<Presentation steps={makeSteps(ERAS)} title="T" designWidth={400} designHeight={200} />)
    expect((container.querySelector('[data-presentation-canvas]') as HTMLElement).style.width).toBe('400px')
  })
})

describe('step hooks follow a changed steps array', () => {
  it('re-reads count and clamps the index when steps shrink or grow', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps(ERAS)} title="T" />)
    fireEvent.click(container.querySelectorAll('[data-presentation-progress-item]')[5])
    rerender(<Presentation steps={makeSteps(['a', 'b', 'c'])} title="T" />)
    for (const name of ['data-step-count', 'data-presentation-step-count']) expect(root(container).getAttribute(name)).toBe('3')
    for (const name of ['data-step-index', 'data-presentation-step-index']) expect(root(container).getAttribute(name)).toBe('2')
    rerender(<Presentation steps={makeSteps(['a', 'b', 'c', 'd', 'e'])} title="T" />)
    expect(root(container).getAttribute('data-step-count')).toBe('5')
    expect(root(container).getAttribute('data-presentation-step-count')).toBe('5')
  })
})
