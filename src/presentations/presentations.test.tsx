import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { REFERENCE_OUTLINE, REFERENCE_SLUG } from '../../scripts/reference-outline.mjs'
import Landing from '../Landing'
import { E } from './how-to-make-a-presentation/entities'
import { SampleScene } from './how-to-make-a-presentation/steps/Scene'
import { STEPS } from './how-to-make-a-presentation/steps'
import { findPresentation, PRESENTATIONS, slugFromPath } from '.'

describe('presentation registry and routing', () => {
  it('registers presentations with unique slugs and loadable components', async () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of PRESENTATIONS) {
      const mod = await p.load()
      expect(typeof mod.default).toBe('function')
    }
  })

  it('registers the reference sample', () => {
    expect(findPresentation(REFERENCE_SLUG)?.slug).toBe(REFERENCE_SLUG)
  })

  it('resolves routes by pathname and falls back for unknown slugs', () => {
    expect(slugFromPath('/how-to-make-a-presentation/')).toBe('how-to-make-a-presentation')
    expect(slugFromPath('/')).toBe('')
    expect(findPresentation('')).toBeUndefined()
    expect(findPresentation('nope')).toBeUndefined()
  })

  it('lists every registered presentation on the landing page', () => {
    const { container } = render(<Landing />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(PRESENTATIONS.map((p) => `/${p.slug}`))
  })
})

describe('reference sample steps', () => {
  it('has the nine normative steps in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(
      REFERENCE_OUTLINE.map((o) => [o.era, o.title, o.caption]),
    )
  })

  it('carries a unique id, era, title, caption and payload per step', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    for (const s of STEPS) {
      expect(s.era && s.title && s.caption).toBeTruthy()
      expect(s.payload).toBeDefined()
    }
  })

  it('matches the spec table titles', () => {
    expect(STEPS.map((s) => s.title)).toEqual([
      'You have a topic',
      'The skill interviews you',
      'Answers become steps',
      'The deck grows',
      'You set the depth',
      'It assembles the scene',
      'It checks its own work',
      'Changed your mind? Loop it.',
      "You're looking at one",
    ])
  })

  it('shares one scene group so the scene persists', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })
})

describe('reference sample scene', () => {
  const ids = (el: Element) =>
    [...el.querySelectorAll('[data-presentation-id]')].map((n) => n.getAttribute('data-presentation-id')!)

  function at(n: number) {
    const view = render(<SampleScene payload={{ n }} stepIndex={n - 1} />)
    return { view, ids: new Set(ids(view.container)) }
  }

  it('introduces each beat\'s entities at the step the outline names', () => {
    const expected: [number, string[]][] = [
      [1, [E.you, E.prompt]],
      [2, [E.skill, E.conversation, E.question]],
      [3, [E.card(0)]],
      [4, [E.card(1), E.card(2), E.card(3), E.link(0), E.morph(0)]],
      [5, [E.ghost, E.depth]],
      [6, [E.kit, E.kitPlug]],
      [7, [E.verify, E.pass, E.chain]],
      [8, [E.modify, E.edited, E.editedFlag]],
      [9, [E.frame, E.frameLabel]],
    ]
    for (const [n, entering] of expected) {
      const now = at(n)
      const before = n > 1 ? at(n - 1) : { ids: new Set<string>() }
      for (const id of entering) {
        expect(now.ids.has(id), `step ${n} shows ${id}`).toBe(true)
        expect(before.ids.has(id), `step ${n - 1} does not yet show ${id}`).toBe(false)
      }
      now.view.unmount()
    }
  })

  it('accumulates: every entity persists into later steps, in place', () => {
    const { container, rerender } = render(<SampleScene payload={{ n: 1 }} stepIndex={0} />)
    const seen = new Map<string, { el: Element; left: string; top: string }>()
    for (let n = 1; n <= 9; n++) {
      rerender(<SampleScene payload={{ n }} stepIndex={n - 1} />)
      const present = new Set<string>()
      for (const el of container.querySelectorAll('[data-presentation-id]')) {
        const id = el.getAttribute('data-presentation-id')!
        present.add(id)
        const { left, top } = (el as HTMLElement).style
        const prior = seen.get(id)
        if (prior) {
          expect(el, `${id} keeps its element`).toBe(prior.el)
          expect([left, top], `${id} is not rearranged`).toEqual([prior.left, prior.top])
        }
        seen.set(id, { el, left, top })
      }
      for (const id of seen.keys()) expect(present.has(id), `${id} still present at step ${n}`).toBe(true)
    }
  })

  it('is one scene instance: the layer element persists across steps', () => {
    const { container, rerender } = render(<SampleScene payload={{ n: 1 }} stepIndex={0} />)
    const layer = container.querySelector('[data-presentation-layer]')
    rerender(<SampleScene payload={{ n: 6 }} stepIndex={5} />)
    expect(container.querySelector('[data-presentation-layer]')).toBe(layer)
  })
})
