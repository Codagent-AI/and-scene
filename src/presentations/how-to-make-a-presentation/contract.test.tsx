import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { presentations } from '../index'
import Talk from './Talk'
import { STEPS } from './steps'

afterEach(cleanup)

// Literal expected table copied independently from the normative spec rows.
const EXPECTED = [
  { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
  { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
  { era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.' },
  { era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.' },
  { era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.' },
  { era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.' },
  { era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.' },
  { era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.' },
]

describe('sample contract', () => {
  it('has exactly nine steps matching the normative table in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(EXPECTED)
  })

  it('has unique step ids and eras in the required runs', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(STEPS.map((s) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it('is registered under its slug with the prescribed presentation title', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry).toBeDefined()
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof entry?.load).toBe('function')
  })

  it('renders the prescribed title as the document title', () => {
    render(<Talk />)
    expect(document.title).toBe('How to Use This Skill to Make a Presentation')
  })
})
