import { describe, expect, it } from 'vitest'
import { validateReferenceContract } from '../scripts/verification-contract.mjs'

const registry = `export const presentations = [{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') }]`
const canonicalTitles = [
  'You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows',
  'You set the depth', 'It assembles the scene', 'It checks its own work',
  'Changed your mind? Loop it.', "You're looking at one",
]
const canonicalCaptions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]
const stepSource = canonicalTitles.map((title, i) => `title: ${JSON.stringify(title)}, caption: ${JSON.stringify(canonicalCaptions[i])}`).join('\n')

describe('reference verification contract', () => {
  it('accepts the registered sample with the canonical nine titles and captions in order', () => {
    expect(() => validateReferenceContract(registry, stepSource)).not.toThrow()
  })

  it('rejects a missing or out-of-order sample with an actionable contract failure', () => {
    expect(() => validateReferenceContract(registry.replace('how-to-make-a-presentation', 'other'), stepSource)).toThrow(/sample.*registered/i)
    expect(() => validateReferenceContract(registry, stepSource.replace('The deck grows', 'The deck shrinks'))).toThrow(/step 4/i)
  })
})
