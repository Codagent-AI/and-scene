import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation, validateSteps } from '../../src/presentation-kit'
import { setViewport } from './helpers'
import { presentations } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/Scene'
import { BEATS, ENTITIES, LINKS, MODIFY_ARC, idsAt } from '../../src/presentations/how-to-make-a-presentation/entities'
import config from '../../verify.config.json'

const SLUG = 'how-to-make-a-presentation'
const outline = config.routes.find((r) => r.slug === SLUG)!.outline!

const ids = (beat: number) => idsAt(beat)
const added = (beat: number) => ids(beat).filter((id) => !ids(beat - 1).includes(id))

describe('reference sample', () => {
  it('is registered under its slug with the sample title', () => {
    const entry = presentations.find((p) => p.slug === SLUG)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof entry?.load).toBe('function')
  })

  it('implements the nine normative eras, titles, and captions in order', () => {
    expect(outline).toHaveLength(9)
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(outline)
    expect(outline.map((o) => o.title)).toEqual([
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
    expect(outline.map((o) => o.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it('has valid steps sharing one persistent scene group', () => {
    expect(validateSteps(STEPS)).toEqual([])
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => (s.payload as { beat: number }).beat)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('can load its Talk entry from the registry', async () => {
    const mod = await presentations.find((p) => p.slug === SLUG)!.load()
    expect(typeof mod.default).toBe('function')
  })
})

describe('sample walkthrough', () => {
  it('shows each committed step\'s caption and title forward and back through the presentation chrome', () => {
    setViewport(1440, 900)
    const { container } = render(<Presentation steps={STEPS} title="Sample" initialMode="browse" />)
    const caption = () => container.querySelector('[data-presentation-caption]')!.textContent
    const title = () => container.querySelector('[data-presentation-step-title]')!.textContent
    const click = (sel: string) => fireEvent.click(container.querySelector(sel)!)
    for (let i = 0; i < 9; i++) {
      expect([title(), caption()]).toEqual([outline[i].title, outline[i].caption])
      if (i < 8) click('[data-presentation-next]')
    }
    for (let i = 8; i >= 0; i--) {
      expect([title(), caption()]).toEqual([outline[i].title, outline[i].caption])
      if (i > 0) click('[data-presentation-prev]')
    }
  })
})

describe('sample entities', () => {
  it('uses one namespace: every entity, link, and arc id is unique', () => {
    const all = [...ENTITIES.map((e) => e.id), ...LINKS.map((l) => l.id), MODIFY_ARC.id]
    expect(new Set(all).size).toBe(all.length)
  })

  it('accumulates: each beat keeps everything before it and adds something, and none exits', () => {
    expect(BEATS).toBe(9)
    for (let beat = 2; beat <= BEATS; beat++) {
      expect(ids(beat - 1).every((id) => ids(beat).includes(id)), `beat ${beat} drops an entity`).toBe(true)
      expect(added(beat).length, `beat ${beat} adds nothing`).toBeGreaterThan(0)
    }
  })

  it('keeps one geometry per identity, so continuing entities never move or resize', () => {
    for (const e of ENTITIES) {
      expect(ENTITIES.filter((o) => o.id === e.id)).toHaveLength(1)
      expect(e.beat).toBeGreaterThanOrEqual(1)
      expect(e.beat).toBeLessThanOrEqual(BEATS)
    }
  })

  it('keeps every entity inside the 880 × 380 canvas', () => {
    for (const e of ENTITIES) {
      expect(e.x, e.id).toBeGreaterThanOrEqual(0)
      expect(e.y, e.id).toBeGreaterThanOrEqual(0)
      expect(e.x + e.w, e.id).toBeLessThanOrEqual(880)
      expect(e.y + e.h, e.id).toBeLessThanOrEqual(380)
    }
  })

  it('introduces the normative scene content at each beat', () => {
    expect(ids(1)).toEqual(['you', 'prompt'])
    expect(added(2)).toEqual(['skill', 'question', 'talk'])
    expect(LINKS.find((l) => l.id === 'talk')!.bidirectional).toBe(true)
    const q = ENTITIES.find((e) => e.id === 'question')!
    expect(q.y + q.h).toBeLessThanOrEqual(LINKS.find((l) => l.id === 'talk')!.from.y)
    // 3: tray under the conversation, first card with its three parts, the morph on the link between cards
    const conversationBottom = Math.max(...ENTITIES.filter((e) => e.beat <= 2).map((e) => e.y + e.h))
    expect(ENTITIES.find((e) => e.id === 'tray')!.y).toBeGreaterThan(conversationBottom)
    expect(added(3)).toEqual(expect.arrayContaining(['tray', 'card-1', 'card-1-title', 'card-1-caption', 'card-1-visual', 'link-1-2', 'morph-label']))
    const link = LINKS.find((l) => l.id === 'link-1-2')!
    const card1 = ENTITIES.find((e) => e.id === 'card-1')!
    expect(link.from.x).toBeGreaterThanOrEqual(card1.x + card1.w)
    expect(ENTITIES.find((e) => e.id === 'morph-label')!.x).toBeGreaterThanOrEqual(card1.x + card1.w)
    // 4: more cards, the same shapes
    expect(added(4)).toEqual(expect.arrayContaining(['card-2', 'card-3', 'link-2-3']))
    // 5: ghost card and the depth control docked on you
    expect(added(5)).toEqual(['ghost-card', 'depth'])
    const you = ENTITIES.find((e) => e.id === 'you')!
    const depth = ENTITIES.find((e) => e.id === 'depth')!
    expect(Math.abs(depth.y - (you.y + you.h))).toBeLessThanOrEqual(12)
    // 6: socket plugs into the bottom edge of the tray, and the tray gets no frame
    const tray = ENTITIES.find((e) => e.id === 'tray')!
    const kit = ENTITIES.find((e) => e.id === 'scene-kit')!
    expect(added(6)).toEqual(['scene-kit'])
    expect(kit.y).toBeLessThan(tray.y + tray.h)
    expect(kit.y + kit.h).toBeGreaterThan(tray.y + tray.h)
    expect(ENTITIES.filter((e) => e.kind === 'frame' && e.beat <= 8)).toEqual([])
    // 7: verify chained after the cards in the same row, with a pass check on it
    const verify = ENTITIES.find((e) => e.id === 'verify')!
    const card3 = ENTITIES.find((e) => e.id === 'card-3')!
    expect(verify.y).toBe(card3.y)
    expect(verify.x).toBeGreaterThan(card3.x + card3.w)
    expect(added(7)).toEqual(expect.arrayContaining(['verify', 'verify-pass', 'link-to-verify']))
    // 8: modify arc from the conversation down into the route, edited card flagged
    expect(added(8)).toEqual(expect.arrayContaining(['modify-arc', 'edited-flag']))
    // 9: an outer frame around the whole diagram, labeled
    const frame = ENTITIES.find((e) => e.id === 'reveal-frame')!
    expect(added(9)).toEqual(['reveal-frame', 'reveal-label'])
    for (const e of ENTITIES.filter((o) => o.beat < 9)) {
      expect(frame.x).toBeLessThan(e.x)
      expect(frame.y).toBeLessThan(e.y)
      expect(frame.x + frame.w).toBeGreaterThan(e.x + e.w)
      expect(frame.y + frame.h).toBeGreaterThan(e.y + e.h)
    }
  })
})

describe('sample scene rendering', () => {
  const props = (beat: number) => ({ payload: { beat }, step: STEPS[beat - 1], index: beat - 1 })
  const rendered = (c: HTMLElement) => [...c.querySelectorAll('[data-presentation-entity]')].map((e) => e.getAttribute('data-presentation-entity')!)

  it('renders exactly the entities defined for each beat', () => {
    for (let beat = 1; beat <= BEATS; beat++) {
      const { container, unmount } = render(<SampleScene {...props(beat)} />)
      expect(rendered(container).sort(), `beat ${beat}`).toEqual(ids(beat).sort())
      unmount()
    }
  })

  it('updates in place: persisting entities keep their DOM nodes and geometry', () => {
    const { container, rerender } = render(<SampleScene {...props(1)} />)
    for (let beat = 2; beat <= BEATS; beat++) {
      const before = new Map(
        [...container.querySelectorAll<HTMLElement>('[data-presentation-entity]')].map((el) => [
          el.getAttribute('data-presentation-entity')!,
          { el, box: [el.style.left, el.style.top, el.style.width, el.style.height] },
        ]),
      )
      rerender(<SampleScene {...props(beat)} />)
      for (const [id, { el, box }] of before) {
        const now = container.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)!
        expect(now, `${id} at beat ${beat}`).toBe(el)
        expect([now.style.left, now.style.top, now.style.width, now.style.height]).toEqual(box)
      }
    }
  })

  it('animates entities out when navigating back', async () => {
    const { container, rerender } = render(<SampleScene {...props(9)} />)
    rerender(<SampleScene {...props(5)} />)
    await waitFor(() => expect(rendered(container).sort()).toEqual(ids(5).sort()), { timeout: 3000 })
  })
})

describe('sample diagram legibility', () => {
  // The 880 x 380 canvas is scaled to about 0.39 on a 390px-wide phone, so design-size text that is
  // comfortable on desktop becomes unreadable there. Diagram text must stay large in canvas pixels.
  const MIN_DIAGRAM_FONT_PX = 20
  const css = readFileSync(path.resolve(process.cwd(), 'src/presentations/how-to-make-a-presentation/styles.css'), 'utf8')
  const scene = css.slice(css.indexOf('/* Scene entities */'), css.indexOf('/* Arrows and the modify arc'))

  it('sets every scene-entity font size at or above the minimum', () => {
    const sizes = [...scene.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]))
    expect(sizes.length).toBeGreaterThan(0)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(MIN_DIAGRAM_FONT_PX)
  })

  it('gives every text label room for a line at its font size', () => {
    for (const e of ENTITIES.filter((o) => o.kind === 'label')) {
      expect(e.h, e.id).toBeGreaterThanOrEqual(MIN_DIAGRAM_FONT_PX)
    }
  })
})
