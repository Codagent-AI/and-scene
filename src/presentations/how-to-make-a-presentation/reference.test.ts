import { describe, expect, it } from 'vitest'
import { presentations } from '../index'
import { ENTITIES } from './entities'
import { STEPS } from './steps'

const outline = [
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

describe('reference presentation contract', () => {
  it('is registered at its canonical route', () => {
    expect(presentations.some(({ slug, title }) => slug === 'how-to-make-a-presentation' && title === 'How to Use This Skill to Make a Presentation')).toBe(true)
  })

  it('matches the nine normative beats in order and shares one persistent scene group', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(outline)
    expect(new Set(STEPS.map(({ groupKey }) => groupKey))).toEqual(new Set(['reference-scene']))
    expect(STEPS.every(({ Scene }) => Scene === STEPS[0].Scene)).toBe(true)
  })

  it('uses unique stable entity ids', () => {
    expect(new Set(Object.values(ENTITIES)).size).toBe(Object.values(ENTITIES).length)
  })
})

describe('reference scene legibility', () => {
  // At a 390px viewport the 880×380 canvas scales to about 0.33, so scene text below 24px lands under 8px on screen.
  it('keeps every scene text size at or above 24px on the design canvas', async () => {
    const { readFile } = await import('node:fs/promises')
    const css = await readFile(new URL('./reference.css', import.meta.url), 'utf8')
    const sizes = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selector]) => selector.includes('.ref-'))
      .flatMap(([, selector, body]) => [...body.matchAll(/font(?:-size)?:\s*(?:[^;]*?\s)?(\d+(?:\.\d+)?)px/g)].map(([, px]) => ({ selector: selector.trim(), px: Number(px) })))
    expect(sizes.length).toBeGreaterThan(0)
    expect(sizes.filter(({ px }) => px < 24)).toEqual([])
  })
})
