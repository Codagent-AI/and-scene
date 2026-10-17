import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '..'
import Talk from '../how-to-make-a-presentation/Talk'
import { E } from '../how-to-make-a-presentation/entities'
import { OUTLINE } from '../how-to-make-a-presentation/outline'
import { SAMPLE_ENTITIES } from '../how-to-make-a-presentation/steps/layout'
import { STEPS } from '../how-to-make-a-presentation/steps'

afterEach(cleanup)

// Independent copy of the normative table in presentation-verification/spec.md.
const EXPECTED = [
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

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

describe('reference sample', () => {
  it('is registered under its slug with the normative title', () => {
    const entry = PRESENTATIONS.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('has the nine normative eras, titles and captions in order', () => {
    expect(OUTLINE).toHaveLength(9)
    OUTLINE.forEach((beat, i) => {
      expect([norm(beat.era), norm(beat.title), norm(beat.caption)]).toEqual([...EXPECTED[i]])
    })
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(EXPECTED.map((e) => [...e]))
  })

  it('gives every step an id, narration and the shared scene group', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(9)
    for (const step of STEPS) {
      expect(step.groupKey).toBe('scene')
      expect(step.sceneId).toBe(STEPS[0].sceneId)
      for (const field of [step.id, step.era, step.title, step.caption]) expect(field.trim()).not.toBe('')
    }
  })

  it('adds exactly the normative entities per beat and never removes any', () => {
    const additions: Record<number, string[]> = {
      1: [E.you, E.prompt],
      2: [E.skill, E.conversation, E.question],
      3: [E.tray, E.card1, E.link1, E.morph1],
      4: [E.card2, E.card3, E.card4, E.link2, E.link3, E.morph2, E.morph3],
      5: [E.ghost, E.depth],
      6: [E.plug, E.socket],
      7: [E.verifyLink, E.verify, E.verifyPass],
      8: [E.route, E.modifyArc, E.flagRing, E.flagChip],
      9: [E.frame, E.frameLabel],
    }
    let seen = new Set<string>()
    for (let stage = 1; stage <= 9; stage++) {
      const visible = new Set(SAMPLE_ENTITIES.filter((e) => e.from <= stage).map((e) => e.key))
      expect([...seen].every((id) => visible.has(id))).toBe(true)
      expect([...visible].filter((id) => !seen.has(id)).sort()).toEqual([...additions[stage]].sort())
      seen = visible
    }
    expect(seen.size).toBe(Object.keys(E).length)
  })

  it('uses one namespaced, duplicate-free id per entity', () => {
    const ids = Object.values(E)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id.startsWith('htmp-')).toBe(true)
  })

  it('marks the sample\'s intentional overlaps as allowed', () => {
    const marked = SAMPLE_ENTITIES.filter((e) => (e.node as { props: Record<string, unknown> }).props['data-presentation-allow-overlap'] !== undefined)
    expect(marked.map((e) => e.key).sort()).toEqual([E.flagChip, E.flagRing, E.frame, E.frameLabel].sort())
  })

  it('keeps the closing reveal labelled and framing the whole diagram', () => {
    expect(STEPS[8].title).toBe("You're looking at one")
    const { container } = render(<Talk />)
    for (let i = 0; i < 8; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector(`[data-presentation-entity="${E.frame}"]`)).not.toBeNull()
    expect(container.querySelector(`[data-presentation-entity="${E.frameLabel}"]`)?.textContent).toBeTruthy()
  })

  it('opens in browse mode and renders its first step', () => {
    const { container } = render(<Talk />)
    expect(container.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect(container.querySelector(`[data-presentation-entity="${E.you}"]`)).not.toBeNull()
    expect(container.querySelector(`[data-presentation-entity="${E.skill}"]`)).toBeNull()
  })
})
