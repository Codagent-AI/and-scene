import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from '../../src/presentation-kit/index.ts'
import { ATTRIBUTION_HREF, STAGE_LAYOUT } from '../../src/presentation-kit/constants.ts'
import { tocEras } from '../../src/presentation-kit/chrome/tocEras.ts'
import { makeSteps, mounts, setViewport } from './fixtures.tsx'

vi.mock('motion/react', async () => (await import('./motion-mock.tsx')).motionMock)

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const q = (sel: string) => document.querySelector(sel)
const qa = (sel: string) => [...document.querySelectorAll(sel)]
const press = (k: string) =>
  act(() => {
    fireEvent.keyDown(window, { key: k })
  })

beforeEach(() => {
  setViewport(1280, 800)
  mounts.count = 0
  mounts.unmounts = 0
})

describe('present and browse modes', () => {
  it('present mode shows marker and one-line title and hides caption, ToC, prev/next, progress', () => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="present" />)
    expect(root().dataset.presentationMode).toBe('present')
    expect(q('[data-presentation-marker]')?.textContent).toContain('1')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title 0')
    for (const hidden of [
      '[data-presentation-caption]',
      '[data-presentation-toc]',
      '[data-presentation-prev]',
      '[data-presentation-next]',
      '[data-presentation-progress]',
      '[data-presentation-deck-title]',
    ]) {
      expect(q(hidden), hidden).toBeNull()
    }
  })

  it('browse mode shows title, multi-line caption, ToC on wide viewports, prev/next and progress', () => {
    render(<Presentation steps={makeSteps()} title="Deck" initialMode="browse" />)
    expect(root().dataset.presentationMode).toBe('browse')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title 0')
    expect(q('[data-presentation-caption]')?.textContent).toBe(makeSteps()[0].caption)
    expect(q('[data-presentation-deck-title]')?.textContent).toBe('Deck')
    expect(q('[data-presentation-toc]')).not.toBeNull()
    expect(q('[data-presentation-prev]')).not.toBeNull()
    expect(q('[data-presentation-next]')).not.toBeNull()
    expect(qa('[data-presentation-progress-item]')).toHaveLength(6)
  })

  it('hides the ToC on narrow viewports and shows it again when widened', () => {
    setViewport(900, 800)
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q('[data-presentation-toc]')).toBeNull()
    expect(q('[data-presentation-progress]')).not.toBeNull()
    act(() => setViewport(1280, 800))
    expect(q('[data-presentation-toc]')).not.toBeNull()
  })

  it('defaults to browse when no initial mode is declared', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(root().dataset.presentationMode).toBe('browse')
  })

  it('P toggles the mode in both directions and keeps the active step, id and payload', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    press('ArrowRight')
    press('ArrowRight')
    press('p')
    expect(root().dataset.presentationMode).toBe('present')
    expect(root().dataset.stepIndex).toBe('2')
    expect(q('[data-presentation-scene]')?.getAttribute('data-presentation-step-id')).toBe('s2')
    expect(screen.getByTestId('scene').textContent).toBe('payload 2')
    expect(q('[data-presentation-caption]')).toBeNull()
    press('p')
    expect(root().dataset.presentationMode).toBe('browse')
    expect(root().dataset.stepIndex).toBe('2')
    expect(q('[data-presentation-title]')?.textContent).toBe('Title 2')
  })
})

describe('step model', () => {
  it('shows each step with its own id, era, title, caption and scene payload', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    for (let i = 0; i < 6; i++) {
      expect(q('[data-presentation-scene]')?.getAttribute('data-presentation-step-id')).toBe(`s${i}`)
      expect(q('[data-presentation-title]')?.textContent).toBe(`Title ${i}`)
      expect(q('[data-presentation-caption]')?.textContent).toBe(makeSteps()[i].caption)
      expect(q('[data-presentation-caption]')?.getAttribute('data-presentation-era')).toBe(makeSteps()[i].era)
      expect(screen.getByTestId('scene').textContent).toBe(`payload ${i}`)
      press('ArrowRight')
    }
  })

  it('derives numbering from position: inserted, shortened and reordered arrays', () => {
    const base = makeSteps()
    const { rerender } = render(<Presentation steps={base} title="Deck" />)
    expect(root().dataset.stepCount).toBe('6')
    const markers = () => q('[data-presentation-marker]')?.textContent
    const labels = () => qa('[data-presentation-progress-item]').map((b) => b.getAttribute('aria-label'))
    expect(markers()).toBe('1/6')

    const inserted = [{ ...base[0], id: 'new', title: 'Inserted' }, ...base]
    rerender(<Presentation steps={inserted} title="Deck" />)
    expect(root().dataset.stepCount).toBe('7')
    expect(markers()).toBe('1/7')
    expect(labels()[0]).toBe('Step 1: Inserted')
    expect(labels()[1]).toBe('Step 2: Title 0')

    const reordered = [...base].reverse()
    rerender(<Presentation steps={reordered} title="Deck" />)
    expect(root().dataset.stepCount).toBe('6')
    expect(labels().map((l) => l?.split(':')[0])).toEqual(['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6'])
    expect(labels()[0]).toBe('Step 1: Title 5')
    press('ArrowRight')
    expect(markers()).toBe('2/6')

    rerender(<Presentation steps={base.slice(0, 3)} title="Deck" />)
    expect(root().dataset.stepCount).toBe('3')
    expect(qa('[data-presentation-progress-item]')).toHaveLength(3)
  })

  it('exposes the step count and current index on the chrome as navigation proceeds', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(root().dataset.stepCount).toBe('6')
    expect(root().dataset.presentationStepCount).toBe('6')
    for (let i = 0; i < 5; i++) {
      expect(root().dataset.stepIndex).toBe(String(i))
      expect(root().dataset.presentationStepIndex).toBe(String(i))
      press('ArrowRight')
    }
    expect(root().dataset.stepIndex).toBe('5')
  })
})

describe('direct jumps and active state', () => {
  it('jumps to the exact step for a progress indicator', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    fireEvent.click(qa('[data-presentation-progress-item]')[4])
    expect(root().dataset.stepIndex).toBe('4')
    expect(screen.getByTestId('scene').textContent).toBe('payload 4')
    fireEvent.click(qa('[data-presentation-progress-item]')[1])
    expect(root().dataset.stepIndex).toBe('1')
  })

  it('jumps to the first step of the era for a ToC entry, even from inside that era', () => {
    expect(tocEras(makeSteps())).toEqual(['alpha', 'beta', 'gamma'])
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const entry = (era: string) =>
      qa('[data-presentation-toc-item]').find((b) => b.textContent === era) as HTMLElement
    fireEvent.click(entry('beta'))
    expect(root().dataset.stepIndex).toBe('2')
    press('ArrowRight')
    press('ArrowRight')
    expect(root().dataset.stepIndex).toBe('4')
    fireEvent.click(entry('beta'))
    expect(root().dataset.stepIndex).toBe('2')
    fireEvent.click(entry('gamma'))
    expect(root().dataset.stepIndex).toBe('5')
    fireEvent.click(entry('alpha'))
    expect(root().dataset.stepIndex).toBe('0')
  })

  it('marks only the active progress and ToC entries, and moves the mark with navigation', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const state = (sel: string) =>
      qa(sel).map((e) => [e.getAttribute('aria-current'), e.hasAttribute('data-presentation-active')])
    const expectOnlyActive = (sel: string, active: number) => {
      state(sel).forEach(([cur, hook], i) => {
        if (i === active) {
          expect(cur).toBeTruthy()
          expect(hook).toBe(true)
        } else {
          expect(cur).toBeNull()
          expect(hook).toBe(false)
        }
      })
    }
    expectOnlyActive('[data-presentation-progress-item]', 0)
    expectOnlyActive('[data-presentation-toc-item]', 0)
    press('ArrowRight')
    press('ArrowRight')
    expectOnlyActive('[data-presentation-progress-item]', 2)
    expectOnlyActive('[data-presentation-toc-item]', 1)
    fireEvent.click(qa('[data-presentation-progress-item]')[5])
    expectOnlyActive('[data-presentation-progress-item]', 5)
    expectOnlyActive('[data-presentation-toc-item]', 2)
    fireEvent.click(qa('[data-presentation-toc-item]')[0])
    expectOnlyActive('[data-presentation-progress-item]', 0)
    expectOnlyActive('[data-presentation-toc-item]', 0)
  })

  it('prev/next buttons navigate, disable at the ends, and never wrap', () => {
    render(<Presentation steps={makeSteps(3)} title="Deck" />)
    const prev = q('[data-presentation-prev]') as HTMLButtonElement
    const next = q('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    expect(root().dataset.stepIndex).toBe('0')
    fireEvent.click(next)
    fireEvent.click(next)
    expect(root().dataset.stepIndex).toBe('2')
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(root().dataset.stepIndex).toBe('2')
    fireEvent.click(prev)
    expect(root().dataset.stepIndex).toBe('1')
  })

  it('a focused chrome button keeps its key behavior instead of advancing the deck', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const dot = qa('[data-presentation-progress-item]')[0] as HTMLElement
    dot.focus()
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    act(() => {
      dot.dispatchEvent(ev)
    })
    expect(root().dataset.stepIndex).toBe('0')
    expect(ev.defaultPrevented).toBe(false)
  })
})

describe('attribution and branding', () => {
  it('shows the default bottom-right attribution link with a stable hook in both modes', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    for (const mode of ['browse', 'present']) {
      const a = q('[data-presentation-attribution]') as HTMLAnchorElement
      expect(a.textContent).toBe('made by and-scene')
      expect(a.getAttribute('href')).toBe(ATTRIBUTION_HREF)
      expect(ATTRIBUTION_HREF).toMatch(/^https:\/\/github\.com\/[^/]+\/and-scene$/)
      expect(a.style.position).toBe('absolute')
      expect(a.style.right).toBe('0px')
      expect(a.style.bottom).toBe('0px')
      expect(a.style.left).toBe('')
      expect(a.style.top).toBe('')
      expect(a.parentElement).toBe(root())
      expect(root().dataset.presentationMode).toBe(mode)
      press('p')
    }
  })

  it('can omit the attribution on request', () => {
    render(<Presentation steps={makeSteps()} title="Deck" attribution={false} />)
    expect(q('[data-presentation-attribution]')).toBeNull()
  })

  it('has no top-left brand by default and renders a host-provided brand in that slot', () => {
    const { unmount } = render(<Presentation steps={makeSteps()} title="Deck" />)
    expect(q('[data-presentation-brand-slot]')?.childNodes).toHaveLength(0)
    expect(within(q('[data-presentation-header]') as HTMLElement).queryAllByRole('link')).toHaveLength(0)
    expect(q('[data-presentation-header]')?.textContent).not.toContain('and-scene')
    unmount()
    render(<Presentation steps={makeSteps()} title="Deck" brand={<a href="/home">Host Co</a>} />)
    expect(within(q('[data-presentation-brand-slot]') as HTMLElement).getByText('Host Co')).toBeTruthy()
  })
})

describe('fixed canvas, geometry and re-render behavior', () => {
  it('reserves the per-mode header/footer geometry around the stage', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const stage = () => q('[data-presentation-stage]') as HTMLElement
    expect(stage().style.top).toBe(`${STAGE_LAYOUT.browse.top}px`)
    expect(stage().style.bottom).toBe(`${STAGE_LAYOUT.browse.bottom}px`)
    expect(stage().style.left).toBe(`${STAGE_LAYOUT.browse.side}px`)
    press('p')
    expect(stage().style.top).toBe(`${STAGE_LAYOUT.present.top}px`)
    expect(stage().style.bottom).toBe(`${STAGE_LAYOUT.present.bottom}px`)
    expect(stage().style.left).toBe('0px')
  })

  it('keeps one scale across steps within a mode, and a mode switch does not remount the scene', () => {
    render(<Presentation steps={makeSteps()} title="Deck" />)
    const scale = () => (q('[data-presentation-canvas]') as HTMLElement).dataset.presentationScale
    const first = scale()
    for (let i = 0; i < 5; i++) {
      press('ArrowRight')
      expect(scale()).toBe(first)
    }
    const mountsBefore = mounts.count
    const sceneEl = q('[data-presentation-scene]')
    press('p')
    expect(scale()).not.toBe(first) // present geometry reserves different space
    expect(q('[data-presentation-scene]')).toBe(sceneEl)
    expect(mounts.count).toBe(mountsBefore)
    expect(root().dataset.stepIndex).toBe('5')
  })

  it('works under StrictMode without double-firing navigation', () => {
    render(
      <StrictMode>
        <Presentation steps={makeSteps()} title="Deck" />
      </StrictMode>,
    )
    press('ArrowRight')
    expect(root().dataset.stepIndex).toBe('1')
  })
})

describe('chrome hooks and passthrough', () => {
  it('exposes stable data-presentation hooks on every chrome piece', () => {
    render(<Presentation steps={makeSteps()} title="Deck" className="mine" />)
    expect(root().classList.contains('mine')).toBe(true)
    for (const hook of [
      'header',
      'brand-slot',
      'marker',
      'deck-title',
      'stage',
      'canvas',
      'scene',
      'footer',
      'title',
      'caption',
      'controls',
      'prev',
      'next',
      'progress',
      'progress-item',
      'toc',
      'toc-item',
      'attribution',
    ]) {
      expect(q(`[data-presentation-${hook}]`), hook).not.toBeNull()
    }
  })

  it('types accept a custom canvas override', () => {
    render(<Presentation steps={makeSteps()} title="Deck" canvas={{ width: 400, height: 200 }} />)
    const c = q('[data-presentation-canvas]') as HTMLElement
    expect(c.style.width).toBe('400px')
    expect(c.style.height).toBe('200px')
  })
})
