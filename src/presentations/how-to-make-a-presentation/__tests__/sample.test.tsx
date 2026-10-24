import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import Talk from '../Talk'
import { ENTITIES } from '../entities'
import type { EntityKey } from '../entities'
import { STEPS } from '../steps'
import { presentations } from '../..'
import { resolveRoute } from '../../../route'

afterEach(cleanup)

const OUTLINE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const entityIds = () =>
  [...document.querySelectorAll('[data-presentation-scene] [data-presentation-entity]')].map((el) =>
    el.getAttribute('data-presentation-entity'),
  )
const idsOf = (...keys: EntityKey[]) => keys.map((k) => ENTITIES[k].id)

describe('reference sample outline', () => {
  it('is registered under its own route and loads', async () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(resolveRoute('/how-to-make-a-presentation', presentations)).toEqual({ kind: 'presentation', entry })
    expect((await entry!.load()).default).toBe(Talk)
  })

  it('routes "/" and unknown paths to the landing page', () => {
    expect(resolveRoute('/', presentations).kind).toBe('landing')
    expect(resolveRoute('/nope', presentations).kind).toBe('landing')
  })

  it('has the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(OUTLINE)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('shows each step caption in browse mode and keeps one scene instance', () => {
    render(<Talk />)
    for (const [, title, caption] of OUTLINE) {
      expect(document.querySelector('[data-presentation-title]')?.textContent).toBe(title)
      expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(caption)
      expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
      next()
    }
  })
})

describe('reference sample scene', () => {
  it('introduces the listed entities per step and accumulates them', () => {
    render(<Talk />)
    const seen: string[][] = []
    for (let i = 0; i < 9; i++) {
      seen.push(entityIds() as string[])
      next()
    }
    expect(seen[0]).toEqual(idsOf('you', 'prompt'))
    expect(seen[1]).toEqual(expect.arrayContaining(idsOf('you', 'prompt', 'skill', 'dialogue', 'question')))
    expect(seen[2]).toEqual(expect.arrayContaining(idsOf('tray', 'card1', 'morphLink', 'morphChip')))
    expect(seen[3]).toEqual(expect.arrayContaining(idsOf('card2', 'card3', 'card4')))
    expect(seen[4]).toEqual(expect.arrayContaining(idsOf('ghost', 'depth')))
    expect(seen[5]).toEqual(expect.arrayContaining(idsOf('sceneKit')))
    expect(seen[5]).not.toContain(ENTITIES.frame.id)
    expect(seen[6]).toEqual(expect.arrayContaining(idsOf('verify', 'verifyCheck')))
    expect(seen[7]).toEqual(expect.arrayContaining(idsOf('modify', 'edited')))
    expect(seen[8]).toEqual(expect.arrayContaining(idsOf('frame')))
    for (let i = 1; i < 9; i++) expect(seen[i]).toEqual(expect.arrayContaining(seen[i - 1]))
    for (let i = 0; i < 9; i++) {
      const expected = (Object.keys(ENTITIES) as EntityKey[]).filter((k) => ENTITIES[k].since <= i + 1)
      expect(seen[i]).toHaveLength(expected.length)
    }
  })

  it('never rearranges or redraws entities that are already on screen', () => {
    render(<Talk />)
    const geometry = () =>
      new Map(
        [...document.querySelectorAll<HTMLElement>('[data-presentation-scene] [data-presentation-entity]')].map((el) => [
          el.getAttribute('data-presentation-entity'),
          [el, el.style.left, el.style.top, el.style.width, el.style.height],
        ]),
      )
    let previous = geometry()
    for (let i = 0; i < 8; i++) {
      next()
      const current = geometry()
      for (const [id, value] of previous) expect(current.get(id), id!).toEqual(value)
      previous = current
    }
  })

  it('docks the depth control on "you" from step 5', () => {
    render(<Talk />)
    for (let i = 0; i < 4; i++) next()
    const box = (id: string) => {
      const el = document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)!
      return { left: parseFloat(el.style.left), top: parseFloat(el.style.top), width: parseFloat(el.style.width), height: parseFloat(el.style.height) }
    }
    const you = box(ENTITIES.you.id)
    const depth = box(ENTITIES.depth.id)
    expect(depth.top).toBe(you.top + you.height)
    expect(depth.left).toBeGreaterThanOrEqual(you.left)
    expect(depth.left + depth.width).toBeLessThanOrEqual(you.left + you.width)
    expect(document.querySelector(`[data-presentation-entity="${ENTITIES.depth.id}"]`)?.getAttribute('data-presentation-state')).toBe('docked')
  })

  it('styles active chrome and attribution in presentation-owned CSS', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf8')
    expect(css).toMatch(/\[data-presentation-progress-item\]\[data-presentation-active="true"\]\s*\{[^}]*background/)
    expect(css).toMatch(/\[data-presentation-toc-item\]\[data-presentation-active="true"\]\s*\{[^}]*font-weight/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*(font-size|color)/)
  })
})
