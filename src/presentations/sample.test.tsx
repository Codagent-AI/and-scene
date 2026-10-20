// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { key } from '../../tests/helpers/events.ts'
import { SPEC_STEPS } from '../../tests/helpers/spec-outline.ts'
import { Presentation } from '../presentation-kit/index.ts'
import { PRESENTATIONS } from './index.ts'
import { CARD_IDS, RECTS } from './how-to-make-a-presentation/entities.ts'
import { SampleScene } from './how-to-make-a-presentation/Scene.tsx'
import { STEPS } from './how-to-make-a-presentation/steps/steps.ts'

const SPEC = SPEC_STEPS

function entitiesAt(index: number): Map<string, Record<string, string>> {
  const { container, unmount } = render(<SampleScene payload={STEPS[index].payload} stepIndex={index} />)
  const out = new Map<string, Record<string, string>>()
  container.querySelectorAll<HTMLElement>('[data-presentation-entity]').forEach((el) => {
    const { left, top, width, height } = el.style
    out.set(el.getAttribute('data-presentation-entity')!, { left, top, width, height })
  })
  unmount()
  return out
}

const idsAt = (index: number) => [...entitiesAt(index).keys()]

describe('registration', () => {
  it('registers the sample under its route with a loader that resolves to a component', async () => {
    const entry = PRESENTATIONS.find((p) => p.slug === 'how-to-make-a-presentation')!
    expect(entry.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof (await entry.load()).default).toBe('function')
  })

  it('lists each slug once', () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('outline', () => {
  it('has the nine normative steps, in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(SPEC.map((row) => [...row]))
  })

  it('has unique stable ids and non-blank narration', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    for (const s of STEPS) {
      for (const text of [s.id, s.era, s.title, s.caption]) expect(text.trim()).not.toBe('')
      expect(s.title).not.toMatch(/\n/)
    }
  })

  it('renders each title and caption in order through the real presentation', () => {
    render(<Presentation steps={STEPS} title="x" initialMode="browse" />)
    SPEC.forEach(([, title, caption], i) => {
      expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe(String(i))
      expect(document.querySelector('[data-presentation-step-title]')?.textContent).toBe(title)
      expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(caption)
      key(document.body, 'ArrowRight')
    })
  })
})

describe('one continuously evolving scene', () => {
  it('shares a single scene component and group across all nine steps', () => {
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS[0].groupKey).toBeTruthy()
  })

  it('introduces exactly the specified entities at each beat', () => {
    const added = (i: number) => idsAt(i).filter((id) => !(i > 0 && idsAt(i - 1).includes(id)) && id !== 'focus')
    expect(added(0).sort()).toEqual(['prompt', 'you'])
    expect(added(1).sort()).toEqual(['chat', 'question', 'skill'])
    expect(added(2).sort()).toEqual(['card-1', 'card-1-caption', 'card-1-title', 'card-1-visual', 'link-1', 'link-1-label'])
    expect(added(3).filter((id) => /^card-[234]$/.test(id)).sort()).toEqual(['card-2', 'card-3', 'card-4'])
    expect(added(4).sort()).toEqual(['control', 'ghost', 'link-4'])
    expect(added(5)).toEqual(['kit'])
    expect(added(6).sort()).toEqual(['check-build', 'check-render', 'link-5', 'pass', 'verify'])
    expect(added(7).sort()).toEqual(['flag', 'modify', 'modify-arc'])
    expect(added(8).sort()).toEqual(['frame', 'frame-label'])
  })

  it('never removes an entity once it has appeared (the emphasis marker aside)', () => {
    for (let i = 1; i < 9; i++) {
      const before = idsAt(i - 1).filter((id) => id !== 'focus')
      const after = idsAt(i)
      for (const id of before) expect(after).toContain(id)
    }
  })

  it('never rearranges or resizes a continuing entity', () => {
    const first = new Map<string, Record<string, string>>()
    for (let i = 0; i < 9; i++) {
      for (const [id, geometry] of entitiesAt(i)) {
        if (id === 'focus') continue
        if (first.has(id)) expect(geometry, `${id} at step ${i + 1}`).toEqual(first.get(id))
        else first.set(id, geometry)
      }
    }
  })

  it('moves the emphasis marker in place with a stable identity', () => {
    const geometry = [3, 4].map((i) => entitiesAt(i).get('focus'))
    expect(geometry[0]).not.toEqual(geometry[1])
    expect(idsAt(8)).not.toContain('focus')
  })
})

describe('scene content topology', () => {
  it('anchors the conversation row at the top and the tray below it', () => {
    for (const id of ['you', 'skill', 'question', 'control', 'prompt'] as const) {
      expect(RECTS[id].y + RECTS[id].h).toBeLessThan(RECTS['card-1'].y)
    }
    expect(RECTS.you.x).toBeLessThan(RECTS.skill.x)
  })

  it('shows what every step card carries and keeps morph information on the links', () => {
    const ids = idsAt(2)
    for (const part of ['title', 'caption', 'visual']) expect(ids).toContain(`card-1-${part}`)
    expect(idsAt(3).filter((id) => /^link-[123]-label$/.test(id))).toHaveLength(3)
    expect(ids.filter((id) => id.includes('morph'))).toEqual([])
  })

  it('docks the control on you and marks the unspecified steps with a ghost card', () => {
    expect(RECTS.control.x + RECTS.control.w).toBeLessThanOrEqual(RECTS.you.x)
    expect(RECTS.control.y).toBeGreaterThanOrEqual(RECTS.you.y)
    expect(RECTS.ghost.x).toBeGreaterThan(RECTS['card-4'].x)
    expect(RECTS.ghost.y).toBe(RECTS['card-4'].y)
  })

  it('plugs the scene kit into the tray bottom edge without framing the tray', () => {
    const trayBottom = RECTS['card-1'].y + RECTS['card-1'].h
    expect(RECTS.kit.y).toBe(trayBottom)
    expect(idsAt(5)).not.toContain('frame')
  })

  it('chains verify after the cards in the same row and resolves it to a green pass', () => {
    expect(RECTS.verify.y).toBe(RECTS['card-1'].y)
    for (const id of CARD_IDS) expect(RECTS.verify.x).toBeGreaterThan(RECTS[id].x)
    const { container } = render(<SampleScene payload={STEPS[6].payload} stepIndex={6} />)
    expect(container.querySelector('[data-presentation-entity="pass"]')?.getAttribute('data-presentation-state')).toBe('pass')
    expect(idsAt(6)).toEqual(expect.arrayContaining(['check-build', 'check-render', 'link-5']))
  })

  it('reaches a modify arc from the conversation into the route and flags the edited card', () => {
    expect(idsAt(7)).toEqual(expect.arrayContaining(['modify-arc', 'flag']))
    expect(STEPS[7].payload.focus).toBe('card-2')
  })

  it('ends with a labeled frame around everything on screen', () => {
    const frame = RECTS.frame
    for (const [id, r] of Object.entries(RECTS)) {
      if (id.startsWith('frame')) continue
      expect(r.x).toBeGreaterThanOrEqual(frame.x)
      expect(r.y).toBeGreaterThanOrEqual(frame.y)
      expect(r.x + r.w).toBeLessThanOrEqual(frame.x + frame.w)
      expect(r.y + r.h).toBeLessThanOrEqual(frame.y + frame.h)
    }
    expect(idsAt(8)).toContain('frame-label')
  })
})

describe('entrance wiring', () => {
  it('keeps continuing entities mounted and unfaded while only newcomers enter', async () => {
    render(<Presentation steps={STEPS} title="x" />)
    const el = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)
    const wrapperOf = (id: string) => el(id)!.closest<HTMLElement>('[data-presentation-appear]')!
    const you = el('you')
    expect(you).not.toBeNull()
    await waitFor(() => expect(wrapperOf('you').style.opacity).toBe('1'), { timeout: 3000 })
    key(document.body, 'ArrowRight')
    expect(el('you')).toBe(you)
    expect(el('skill')).not.toBeNull()
    expect(wrapperOf('skill').style.opacity).toBe('0')
    expect(wrapperOf('you').style.opacity).not.toBe('0')
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })
})
