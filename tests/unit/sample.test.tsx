import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { setViewport } from '../../src/presentation-kit/__tests__/fixtures'
import { presentations } from '../../src/presentations'
import { CARD_X, ENTITY, RECT } from '../../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { SAMPLE_OUTLINE } from '../../scripts/lib/outline.mjs'

const q = (s: string) => document.querySelector(s)
const entity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement | null
const present = () =>
  Array.from(document.querySelectorAll('[data-presentation-entity]')).map((e) => e.getAttribute('data-presentation-entity')!)
const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))

beforeEach(() => setViewport(1440, 900))

describe('reference sample', () => {
  it('is registered under its slug and title', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('has nine unique-id steps whose era, title, and caption match the normative table in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(STEPS.map((s) => ({ era: s.era, title: s.title, caption: s.caption }))).toEqual(
      SAMPLE_OUTLINE.map(({ era, title, caption }: { era: string; title: string; caption: string }) => ({ era, title, caption })),
    )
    for (const step of STEPS) expect(step.caption.length).toBeGreaterThan(20)
  })

  it('opens in browse mode and shows every step\'s title and caption with working prev/next', () => {
    render(<Talk />)
    expect(q('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('browse')
    STEPS.forEach((step, i) => {
      expect(q('[data-presentation-header] [data-presentation-title]')!.textContent).toBe(step.title)
      expect(q('[data-presentation-caption]')!.textContent).toBe(step.caption)
      expect(q('[data-presentation-marker]')!.textContent).toBe(`${i + 1} / 9`)
      if (i < 8) fireEvent.click(q('[data-presentation-next]')!)
    })
    expect((q('[data-presentation-next]') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 8; i > 0; i--) fireEvent.click(q('[data-presentation-prev]')!)
    expect(q('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('0')
    expect((q('[data-presentation-prev]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('shares one scene group so a single Scene instance persists', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })

  it('uses the era sequence for its table of contents', () => {
    render(<Talk />)
    expect(Array.from(document.querySelectorAll('[data-presentation-toc-entry]')).map((e) => e.textContent)).toEqual([
      'the ask',
      'the gathering',
      'the build',
      'the loop',
      'the reveal',
    ])
  })
})

describe('scene content per step (normative scene intent)', () => {
  const ids: string[][] = []
  it('collects the entity set at every step', () => {
    render(<Presentation steps={STEPS} title="x" />)
    for (let i = 0; i < 9; i++) {
      ids.push(present())
      press('ArrowRight')
    }
    expect(ids).toHaveLength(9)
  })

  const has = (step: number, ...want: string[]) => {
    for (const id of want) expect(ids[step - 1], `step ${step} has ${id}`).toContain(id)
  }

  it('step 1: you and a prompt bubble', () => {
    has(1, ENTITY.you, ENTITY.prompt)
    expect(ids[0]).not.toContain(ENTITY.skill)
  })
  it('step 2: skill, a two-way arrow, and a question chip', () => {
    has(2, ENTITY.you, ENTITY.prompt, ENTITY.skill, ENTITY.dialog, ENTITY.question)
    expect(ids[1]).not.toContain(ENTITY.card1)
  })
  it('step 3: a tray with the first step card carrying title, caption, and visual; no links inside', () => {
    has(3, ENTITY.tray, ENTITY.card1)
    expect(ids[2]).not.toContain(ENTITY.card2)
  })
  it('step 4: more cards, with the morph labels on the links between them', () => {
    has(4, ENTITY.card1, ENTITY.card2, ENTITY.card3, ENTITY.link12, ENTITY.link23, ENTITY.linkLabel12)
  })
  it('step 5: a ghost card and a partial/full control docked on you', () => {
    has(5, ENTITY.ghost, ENTITY.depth)
    expect(RECT.depth.left).toBe(RECT.you.left)
    expect(RECT.depth.top).toBeGreaterThanOrEqual(RECT.you.top + RECT.you.height)
  })
  it('step 6: the scene-kit socket plugs into the tray bottom edge; the tray is not framed', () => {
    has(6, ENTITY.socket, ENTITY.plug)
    expect(ids[5]).not.toContain(ENTITY.frame)
    const trayBottom = RECT.card1.top + RECT.card1.height
    expect(RECT.socket.top).toBeGreaterThan(trayBottom)
  })
  it('step 7: verify chained after the cards in the same row with a pass check', () => {
    has(7, ENTITY.verify, ENTITY.pass, ENTITY.linkVerify)
    expect(RECT.verify.top).toBe(RECT.card1.top)
    expect(RECT.verify.left).toBeGreaterThan(RECT.ghost.left)
  })
  it('step 8: a modify arc and a flagged edited card', () => {
    has(8, ENTITY.modify, ENTITY.edited)
    expect(ids[6]).not.toContain(ENTITY.edited)
  })
  it('step 9: a labeled outer frame around the whole diagram', () => {
    has(9, ENTITY.frame, ENTITY.frameLabel)
    const f = RECT.frame
    for (const r of Object.values(RECT).filter((r) => r !== f)) {
      expect(r.left).toBeGreaterThanOrEqual(f.left)
      expect(r.top).toBeGreaterThanOrEqual(f.top)
      expect(r.left + r.width).toBeLessThanOrEqual(f.left + f.width)
      expect(r.top + r.height).toBeLessThanOrEqual(f.top + f.height)
    }
  })

  it('accumulates entities monotonically through step 7, then only adds', () => {
    for (let i = 1; i < 9; i++) {
      for (const id of ids[i - 1]) expect(ids[i], `step ${i + 1} keeps ${id}`).toContain(id)
    }
  })
})

describe('accumulation keeps earlier entities in place', () => {
  it('already-present entities never move or resize across steps', () => {
    render(<Presentation steps={STEPS} title="x" />)
    const geometry = (id: string) => {
      const el = entity(id)
      return el ? [el.style.left, el.style.top, el.style.width, el.style.height] : null
    }
    const seen = new Map<string, Array<string | null>>()
    for (let i = 0; i < 9; i++) {
      for (const id of present()) {
        const g = geometry(id)
        if (!g || g[0] === '') continue
        if (!seen.has(id)) seen.set(id, g)
        else expect(g, `${id} at step ${i + 1}`).toEqual(seen.get(id))
      }
      press('ArrowRight')
    }
    expect(seen.has(ENTITY.you)).toBe(true)
    expect(seen.has(ENTITY.card1)).toBe(true)
  })

  it('keeps the same DOM node for continuing entities (no redraw)', () => {
    render(<Presentation steps={STEPS} title="x" />)
    const you = entity(ENTITY.you)
    for (let i = 0; i < 8; i++) {
      press('ArrowRight')
      expect(entity(ENTITY.you)).toBe(you)
    }
  })

  it('places the cards in one tray row at the declared x positions', () => {
    expect(CARD_X).toEqual([30, 210, 390])
    expect(new Set([RECT.card1.top, RECT.card2.top, RECT.card3.top, RECT.ghost.top, RECT.verify.top]).size).toBe(1)
  })
})

describe('sample styling ownership', () => {
  const dir = join(__dirname, '../../src/presentations/how-to-make-a-presentation')
  const css = readFileSync(join(dir, 'sample.css'), 'utf8')

  it('keeps its look in presentation-owned CSS imported by Talk', () => {
    expect(readFileSync(join(dir, 'Talk.tsx'), 'utf8')).toMatch(/import '\.\/sample\.css'/)
  })

  it('styles the active chrome and attribution through the semantic hooks', () => {
    expect(css).toMatch(/\[data-presentation-progress-dot\]\[data-presentation-active='true'\]\s*\{[^}]*background/)
    expect(css).toMatch(/\[data-presentation-toc-entry\]\[data-presentation-active='true'\]\s*\{[^}]*background/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size:\s*\d+px/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*text-decoration/)
  })

  it('applies no blanket overlap exemption', () => {
    expect(readFileSync(join(dir, 'Scene.tsx'), 'utf8')).not.toMatch(/allow-overlap/)
  })
})
