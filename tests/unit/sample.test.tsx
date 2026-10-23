import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { presentations } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { Landing } from '../../src/Landing'
import { Presentation } from '../../src/presentation-kit'
import { Router } from '../../src/router'
import { resolveRoute } from '../../src/routes'
import type { PresentationEntry } from '../../src/presentations'

const root = path.resolve(__dirname, '../..')
const outline = JSON.parse(readFileSync(path.join(root, 'scripts/reference-outline.json'), 'utf8'))

const SPEC_TABLE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

describe('reference sample', () => {
  it('is registered under its own slug', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof entry?.load).toBe('function')
  })

  it('implements the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(SPEC_TABLE)
  })

  it('has the same outline in the verification script data', () => {
    expect(outline.slug).toBe('how-to-make-a-presentation')
    expect(outline.steps.map((s: Record<string, string>) => [s.era, s.title, s.caption])).toEqual(SPEC_TABLE)
  })

  it('has unique stable step ids and one shared scene group', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(new Set(STEPS.map((s) => s.groupKey))).toEqual(new Set(['scene']))
  })

  it('accumulates entities: nothing is removed, moved, or redrawn between steps', () => {
    for (let i = 1; i < STEPS.length; i++) {
      const before = new Map(STEPS[i - 1].payload.entities.map((e) => [e.id, e]))
      const after = new Map(STEPS[i].payload.entities.map((e) => [e.id, e]))
      expect(after.size).toBeGreaterThan(before.size)
      for (const [id, entity] of before) expect(after.get(id), `${id} at step ${i + 1}`).toEqual(entity)
    }
  })

  it('introduces the entities each step names', () => {
    const idsAt = (n: number) => STEPS[n - 1].payload.entities.map((e) => e.id)
    expect(idsAt(1)).toEqual(['htp-you', 'htp-prompt'])
    expect(idsAt(2)).toEqual(expect.arrayContaining(['htp-skill', 'htp-talk-arrow', 'htp-question']))
    expect(idsAt(3)).toEqual(expect.arrayContaining(['htp-tray', 'htp-card-1']))
    expect(idsAt(4)).toEqual(expect.arrayContaining(['htp-card-2', 'htp-card-3']))
    expect(idsAt(5)).toEqual(expect.arrayContaining(['htp-ghost', 'htp-depth']))
    expect(idsAt(6)).toEqual(expect.arrayContaining(['htp-scene-kit']))
    expect(idsAt(7)).toEqual(expect.arrayContaining(['htp-verify', 'htp-pass']))
    expect(idsAt(8)).toEqual(expect.arrayContaining(['htp-modify-arc', 'htp-edited-flag']))
    expect(idsAt(9)).toEqual(expect.arrayContaining(['htp-frame']))
  })

  it('keeps every entity inside the 880 x 380 design canvas', () => {
    for (const entity of STEPS[8].payload.entities) {
      if (entity.x === undefined) continue
      expect(entity.x + (entity.width ?? 0)).toBeLessThanOrEqual(880)
      expect(entity.y! + (entity.height ?? 0)).toBeLessThanOrEqual(380)
    }
  })

  it('every step has a caption', () => {
    for (const step of STEPS) expect(step.caption.length).toBeGreaterThan(0)
  })
})

describe('entity continuity in the rendered sample', () => {
  it('keeps the same DOM node for an entity that persists from one step to the next', async () => {
    const { act, fireEvent } = await import('@testing-library/react')
    render(<Presentation steps={STEPS} title="Sample" initialMode="present" />)
    const idOf = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`)
    const you = idOf('htp-you')
    expect(you).not.toBeNull()
    act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    expect(idOf('htp-skill')).not.toBeNull()
    expect(idOf('htp-you')).toBe(you)
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })
})

describe('routing and landing', () => {
  const fake = (slug: string, title = slug): PresentationEntry => ({
    slug,
    title,
    load: async () => ({ default: () => <p data-testid={slug}>{`page ${slug}`}</p> }),
  })
  const registry = [fake('alpha', 'Alpha talk'), fake('beta', 'Beta talk')]

  it('resolves slugs and tolerates slashes', () => {
    expect(resolveRoute('/alpha', registry)?.slug).toBe('alpha')
    expect(resolveRoute('/beta/', registry)?.slug).toBe('beta')
    expect(resolveRoute('/', registry)).toBeNull()
    expect(resolveRoute('/nope', registry)).toBeNull()
  })

  it('shows the landing page at / and for unknown routes', () => {
    for (const pathname of ['/', '/missing']) {
      const { unmount } = render(<Router pathname={pathname} registry={registry} />)
      expect(document.querySelector('[data-landing]')).not.toBeNull()
      unmount()
    }
  })

  it('lazy-loads the matching presentation', async () => {
    render(<Router pathname="/beta" registry={registry} />)
    await waitFor(() => expect(screen.getByTestId('beta')).toBeTruthy())
    expect(document.querySelector('[data-landing]')).toBeNull()
  })

  it('lists every registry entry as a link on the landing page', () => {
    render(<Landing registry={registry} />)
    expect(screen.getByRole('link', { name: 'Alpha talk' }).getAttribute('href')).toBe('/alpha')
    expect(screen.getByRole('link', { name: 'Beta talk' }).getAttribute('href')).toBe('/beta')
  })

  it('coexisting registrations stay reachable when one is added', () => {
    const grown = [...presentations, fake('extra')]
    for (const entry of grown) expect(resolveRoute(`/${entry.slug}`, grown)).toBe(entry)
  })
})
