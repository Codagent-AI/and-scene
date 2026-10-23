import { fireEvent, render, screen, within } from '@testing-library/react'
import { motion } from 'motion/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import {
  ATTRIBUTION_HREF,
  Presentation,
  STAGE_LAYOUT,
  WIDE_BREAKPOINT,
  formatStepNumber,
  groupEras,
  type SceneProps,
  type Step,
} from '../../src/presentation-kit'
import { key, makeSteps, Plain, setViewport, stepIndex } from './helpers'

const q = (c: HTMLElement, hook: string) => c.querySelector(`[data-presentation-${hook}]`)
const qa = (c: HTMLElement, hook: string) => [...c.querySelectorAll(`[data-presentation-${hook}]`)]

function open(props: Partial<React.ComponentProps<typeof Presentation<{ n: number }>>> = {}, width = 1200) {
  setViewport(width)
  return render(<Presentation steps={makeSteps()} title="Deck" {...props} />)
}

describe('step model and chrome content (L-1, I-1)', () => {
  it('shows marker, title, caption and the active scene payload, and updates all on advance', () => {
    const { container } = open()
    expect(q(container, 'marker')?.textContent).toContain('01')
    expect(q(container, 'marker')?.textContent).toContain('first era')
    expect(q(container, 'title')?.textContent).toBe('Title 0')
    expect(q(container, 'caption')?.textContent).toBe('Caption 0 is a full paragraph of text.')
    expect(screen.getByTestId('scene').textContent).toBe('scene 0')
    key('ArrowRight', window)
    key('ArrowRight', window)
    expect(q(container, 'marker')?.textContent).toContain('03')
    expect(q(container, 'marker')?.textContent).toContain('second era')
    expect(q(container, 'title')?.textContent).toBe('Title 2')
    expect(q(container, 'caption')?.textContent).toBe('Caption 2 is a full paragraph of text.')
    expect(container.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-step-id')).toBe('s2')
  })
})

describe('order-derived numbering (L-2, I-2)', () => {
  const marker = (c: HTMLElement) => q(c, 'marker-number')?.textContent
  it('derives numbers from position after insert, remove and reorder', () => {
    const steps = makeSteps(3)
    const { container, rerender } = open({ steps })
    const jumpTo = (i: number) => fireEvent.click(qa(container, 'progress')[i] as Element)
    jumpTo(2)
    expect(marker(container)).toBe('03')
    const inserted = [steps[0]!, { ...steps[0]!, id: 'new', title: 'New' }, steps[1]!, steps[2]!]
    rerender(<Presentation steps={inserted} title="Deck" />)
    expect(qa(container, 'progress')).toHaveLength(4)
    jumpTo(1)
    expect(marker(container)).toBe('02')
    rerender(<Presentation steps={[steps[2]!, steps[1]!, steps[0]!]} title="Deck" />)
    jumpTo(0)
    expect(q(container, 'title')?.textContent).toBe('Title 2')
    expect(marker(container)).toBe('01')
    rerender(<Presentation steps={[steps[1]!]} title="Deck" />)
    expect(container.querySelector('[data-step-count]')?.getAttribute('data-step-count')).toBe('1')
    expect(marker(container)).toBe('01')
  })
  it('formats step numbers from the index', () => {
    expect(formatStepNumber(0)).toBe('01')
    expect(formatStepNumber(11)).toBe('12')
  })
})

describe('step-count and step-index hooks (I-19)', () => {
  it('track navigation, jumps, mode changes and list changes', () => {
    const steps = makeSteps(4)
    const { container, rerender } = open({ steps })
    const root = container.querySelector('[data-step-count]')!
    expect(root.getAttribute('data-step-count')).toBe('4')
    expect(stepIndex(container)).toBe(0)
    key('ArrowRight')
    expect(stepIndex(container)).toBe(1)
    fireEvent.click(qa(container, 'progress')[3] as Element)
    expect(stepIndex(container)).toBe(3)
    key('p')
    expect(stepIndex(container)).toBe(3)
    key('ArrowLeft')
    expect(stepIndex(container)).toBe(2)
    rerender(<Presentation steps={steps.slice(0, 2)} title="Deck" />)
    expect(root.getAttribute('data-step-count')).toBe('2')
    expect(stepIndex(container)).toBe(1)
  })
})

describe('present and browse modes (L-17, L-18, L-19, L-20, I-10, I-11)', () => {
  it('present mode shows marker and title only, hiding caption, ToC and prev/next, at wide and narrow widths', () => {
    for (const width of [1400, 500]) {
      const { container, unmount } = open({ initialMode: 'present' }, width)
      expect(q(container, 'marker')).toBeTruthy()
      expect(q(container, 'title')?.textContent).toBe('Title 0')
      for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) expect(q(container, hook)).toBeNull()
      expect(container.querySelectorAll('button')).toHaveLength(0)
      unmount()
    }
  })
  it('browse mode shows title, caption, controls and progress', () => {
    const { container } = open({ initialMode: 'browse' }, 1400)
    for (const hook of ['title', 'caption', 'prev', 'next', 'toc']) expect(q(container, hook)).toBeTruthy()
    expect(qa(container, 'progress')).toHaveLength(4)
    expect(q(container, 'caption')?.getAttribute('style') ?? '').not.toMatch(/ellipsis|nowrap|line-clamp/)
  })
  it('shows the ToC only at or above the wide breakpoint while other browse controls remain', () => {
    const below = open({}, WIDE_BREAKPOINT - 1)
    expect(q(below.container, 'toc')).toBeNull()
    for (const hook of ['title', 'caption', 'prev', 'next', 'progress']) expect(q(below.container, hook)).toBeTruthy()
    below.unmount()
    const at = open({}, WIDE_BREAKPOINT)
    expect(q(at.container, 'toc')).toBeTruthy()
  })
  it('reacts to a resize across the breakpoint', () => {
    const { container } = open({}, 1400)
    expect(q(container, 'toc')).toBeTruthy()
    setViewport(500)
    expect(q(container, 'toc')).toBeNull()
  })
  it('toggles with P, preserving step, stable id, payload and narration', () => {
    const { container } = open({ initialMode: 'browse' })
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    const root = container.querySelector('[data-presentation-root]')!
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    expect(stepIndex(container)).toBe(2)
    expect(root.getAttribute('data-presentation-step-id')).toBe('s2')
    expect(screen.getByTestId('scene').textContent).toBe('scene 2')
    expect(q(container, 'title')?.textContent).toBe('Title 2')
    key('p')
    expect(root.getAttribute('data-presentation-mode')).toBe('browse')
    expect(q(container, 'caption')?.textContent).toContain('Caption 2')
    expect(stepIndex(container)).toBe(2)
  })
})

describe('direct jump and active state (L-23, L-24, I-14, I-15)', () => {
  it('progress indicators jump to nonadjacent steps', () => {
    const { container } = open()
    fireEvent.click(qa(container, 'progress')[3] as Element)
    expect(stepIndex(container)).toBe(3)
    expect(screen.getByTestId('scene').textContent).toBe('scene 3')
    fireEvent.click(qa(container, 'progress')[0] as Element)
    expect(stepIndex(container)).toBe(0)
  })
  it('ToC entries jump to the first step of their era', () => {
    const { container } = open()
    const entries = qa(container, 'toc-entry')
    expect(entries.map((e) => e.textContent)).toEqual(['first era', 'second era'])
    fireEvent.click(entries[1] as Element)
    expect(stepIndex(container)).toBe(2)
    key('ArrowRight')
    fireEvent.click(entries[0] as Element)
    expect(stepIndex(container)).toBe(0)
  })
  it('groups eras by position', () => {
    const eras = groupEras(makeSteps(4, [{ era: 'a' }, { era: 'a' }, { era: 'b' }, { era: 'a' }]))
    expect(eras.map((e) => [e.era, e.firstIndex, e.indices])).toEqual([['a', 0, [0, 1]], ['b', 2, [2]], ['a', 3, [3]]])
  })
  it('marks exactly the active dot and era entry with aria-current and the active hook', () => {
    const { container } = open()
    const check = (dot: number, era: number) => {
      const dots = qa(container, 'progress')
      const entries = qa(container, 'toc-entry')
      dots.forEach((d, i) => {
        expect(d.getAttribute('aria-current')).toBe(i === dot ? 'step' : null)
        expect(d.getAttribute('data-presentation-active')).toBe(i === dot ? 'true' : null)
      })
      entries.forEach((e, i) => {
        expect(e.getAttribute('aria-current')).toBe(i === era ? 'step' : null)
        expect(e.getAttribute('data-presentation-active')).toBe(i === era ? 'true' : null)
      })
    }
    check(0, 0)
    key('ArrowRight')
    check(1, 0)
    fireEvent.click(qa(container, 'progress')[3] as Element)
    check(3, 1)
  })
  it('disables prev at the start and next at the end', () => {
    const { container } = open()
    expect(q(container, 'prev')).toHaveProperty('disabled', true)
    fireEvent.click(qa(container, 'progress')[3] as Element)
    expect(q(container, 'next')).toHaveProperty('disabled', true)
    expect(q(container, 'prev')).toHaveProperty('disabled', false)
  })
  it('lets a focused progress button keep Space/Enter instead of advancing the deck', () => {
    const { container } = open()
    const dot = qa(container, 'progress')[2] as HTMLElement
    dot.focus()
    key(' ', dot)
    key('ArrowRight', dot)
    expect(stepIndex(container)).toBe(0)
  })
})

describe('attribution and branding (L-14, L-15, L-16)', () => {
  it('renders the default bottom-right link in both modes', () => {
    for (const mode of ['browse', 'present'] as const) {
      const { container, unmount } = open({ initialMode: mode })
      const a = q(container, 'attribution') as HTMLAnchorElement
      expect(a.textContent).toBe('made by and-scene')
      expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
      expect(a.getAttribute('href')).toBe(ATTRIBUTION_HREF)
      expect(a.style.position).toBe('fixed')
      expect(a.style.right).toBe('0px')
      expect(a.style.bottom).toBe('0px')
      unmount()
    }
  })
  it('passes author class, style and data props to the attribution link and can be overridden or removed', () => {
    const { container, rerender } = open({ attribution: { className: 'mine', style: { fontSize: 14 }, 'data-extra': 'x' } as never })
    const a = q(container, 'attribution') as HTMLElement
    expect(a.className).toBe('mine')
    expect(a.style.fontSize).toBe('14px')
    expect(a.getAttribute('data-extra')).toBe('x')
    rerender(<Presentation steps={makeSteps()} title="Deck" attribution={{ label: 'custom', href: 'https://example.com' }} />)
    expect(q(container, 'attribution')?.textContent).toBe('custom')
    rerender(<Presentation steps={makeSteps()} title="Deck" attribution={false} />)
    expect(q(container, 'attribution')).toBeNull()
  })
  it('has no default top-left brand, but renders a host-provided one in both modes', () => {
    const { container, rerender } = open()
    expect(q(container, 'brand')).toBeNull()
    expect(within(q(container, 'header') as HTMLElement).queryByRole('link')).toBeNull()
    for (const mode of ['browse', 'present'] as const) {
      rerender(<Presentation steps={makeSteps()} title="Deck" initialMode={mode} brand={<span>host brand</span>} key={mode} />)
      expect(q(container, 'brand')?.textContent).toBe('host brand')
    }
  })
})

describe('typed payloads reach the boundary without casts (L-3, I-3)', () => {
  interface A { n: number }
  interface B { label: string }
  const SceneA: ComponentType<SceneProps<A>> = () => null
  const SceneB: ComponentType<SceneProps<B>> = () => null
  it('compiles valid typed arrays and rejects malformed or mismatched ones', () => {
    const ok: Step<A>[] = [{ id: 'a', era: 'e', title: 't', caption: 'c', groupKey: 'g', Scene: SceneA, payload: { n: 1 } }]
    render(<Presentation steps={ok} title="x" />)
    // @ts-expect-error the payload does not match the declared payload type
    const badPayload: Step<A> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: SceneA, payload: { n: 'one' } }
    // @ts-expect-error the Scene accepts a different payload type
    const badScene: Step<A> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: SceneB, payload: { n: 1 } }
    // @ts-expect-error every narration field is required (caption missing)
    const missing: Step<A> = { id: 'a', era: 'e', title: 't', Scene: SceneA, payload: { n: 1 } }
    // @ts-expect-error id is required
    const missingId: Step<A> = { era: 'e', title: 't', caption: 'c', Scene: SceneA, payload: { n: 1 } }
    // @ts-expect-error era is required
    const missingEra: Step<A> = { id: 'a', title: 't', caption: 'c', Scene: SceneA, payload: { n: 1 } }
    // @ts-expect-error title is required
    const missingTitle: Step<A> = { id: 'a', era: 'e', caption: 'c', Scene: SceneA, payload: { n: 1 } }
    expect([badPayload, badScene, missing, missingTitle, missingId, missingEra]).toHaveLength(6)
  })
})

describe('raw motion elements inside the stage (L-13, I-8)', () => {
  it('accepts raw motion content with literal coordinates and stable layoutIds', () => {
    const Raw: ComponentType<SceneProps<{ x: number }>> = ({ payload }) => (
      <motion.div layout layoutId="raw" data-testid="raw" style={{ position: 'absolute', left: payload.x, top: 10 }} />
    )
    const steps: Step<{ x: number }>[] = [
      { id: 'a', era: 'e', title: 'a', caption: 'a', groupKey: 'g', Scene: Raw, payload: { x: 10 } },
      { id: 'b', era: 'e', title: 'b', caption: 'b', groupKey: 'g', Scene: Raw, payload: { x: 300 } },
    ]
    setViewport(1200)
    render(<Presentation steps={steps} title="raw" />)
    const node = screen.getByTestId('raw')
    expect(node.style.left).toBe('10px')
    key('ArrowRight')
    expect(screen.getByTestId('raw')).toBe(node)
    expect(screen.getByTestId('raw').style.left).toBe('300px')
  })
})

describe('kit stage reservation', () => {
  it('reserves different chrome geometry per mode', () => {
    expect(STAGE_LAYOUT.browse.bottom).toBeGreaterThan(STAGE_LAYOUT.present.bottom)
  })
  it('uses the shared Plain scene fixture', () => {
    expect(Plain).toBeTypeOf('function')
  })
})

describe('every chrome and canvas part exposes its stable hook (L-11, I-8)', () => {
  it('renders the full hook set in browse mode on a wide viewport', () => {
    const { container } = open({ brand: <span>b</span> }, 1400)
    const expected = [
      'root', 'header', 'brand', 'marker', 'marker-number', 'marker-era', 'title', 'toc', 'toc-entry', 'stage', 'canvas', 'canvas-inner', 'scene-host',
      'footer', 'caption', 'controls', 'prev', 'next', 'progress-list', 'progress', 'attribution',
    ]
    for (const hook of expected) expect(q(container, hook), `data-presentation-${hook}`).toBeTruthy()
    expect(q(container, 'stage')?.contains(q(container, 'canvas'))).toBe(true)
    expect(q(container, 'canvas')?.contains(q(container, 'canvas-inner'))).toBe(true)
    expect(q(container, 'canvas-inner')?.contains(q(container, 'scene-host'))).toBe(true)
    expect(q(container, 'footer')?.contains(q(container, 'controls'))).toBe(true)
    expect(q(container, 'controls')?.contains(q(container, 'progress-list'))).toBe(true)
    expect(q(container, 'root')?.hasAttribute('data-presentation-mode')).toBe(true)
  })
  it('keeps the shared hooks in present mode and drops the browse-only ones', () => {
    const { container } = open({ initialMode: 'present' }, 1400)
    for (const hook of ['root', 'header', 'marker', 'title', 'stage', 'canvas', 'canvas-inner', 'scene-host', 'footer', 'attribution']) expect(q(container, hook), hook).toBeTruthy()
    for (const hook of ['controls', 'progress-list', 'progress', 'toc', 'caption', 'prev', 'next']) expect(q(container, hook), hook).toBeNull()
  })
  it('accepts author class and style on the root', () => {
    const { container } = open({ className: 'deck', style: { opacity: 0.9 } })
    const root = q(container, 'root') as HTMLElement
    expect(root.className).toBe('deck')
    expect(root.style.opacity).toBe('0.9')
  })
})
