import { describe, expect, it } from 'vitest'
import { checkOutline } from '../../scripts/lib/outline-check.mjs'

// Independent expectations for the outline validator (not imported from production constants).
const EXPECTED = [
  { era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.' },
  { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.' },
  { era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.' },
]
const SLUG = 'how-to-make-a-presentation'
const registry = [{ slug: SLUG }]
const copy = () => EXPECTED.map((step) => ({ ...step }))

describe('outline validator', () => {
  it('accepts the exact outline in order', () => {
    expect(checkOutline({ registry, slug: SLUG, steps: copy(), expected: EXPECTED })).toEqual([])
  })

  it('reports a missing registry entry', () => {
    const problems = checkOutline({ registry: [], slug: SLUG, steps: copy(), expected: EXPECTED })
    expect(problems[0].message).toMatch(/no registry entry/)
  })

  it('reports a wrong title, caption, or era at the right index', () => {
    for (const field of ['title', 'caption', 'era']) {
      const steps = copy()
      steps[1][field] = `${steps[1][field]} (edited)`
      const problems = checkOutline({ registry, slug: SLUG, steps, expected: EXPECTED })
      expect(problems).toHaveLength(1)
      expect(problems[0].step).toBe(1)
      expect(problems[0].message).toContain(field)
    }
  })

  it('reports reordered steps', () => {
    const steps = copy()
    ;[steps[0], steps[1]] = [steps[1], steps[0]]
    expect(checkOutline({ registry, slug: SLUG, steps, expected: EXPECTED }).length).toBeGreaterThan(0)
  })

  it('reports extra and missing steps', () => {
    const extra = [...copy(), { ...EXPECTED[0] }]
    const missing = copy().slice(0, 2)
    expect(checkOutline({ registry, slug: SLUG, steps: extra, expected: EXPECTED })[0].message).toMatch(/expected 3 steps, found 4/)
    expect(checkOutline({ registry, slug: SLUG, steps: missing, expected: EXPECTED })[0].message).toMatch(/expected 3 steps, found 2/)
  })

  it('accepts the committed sample outline as normative', async () => {
    const { NORMATIVE_OUTLINE, SAMPLE_SLUG } = await import('../../scripts/lib/sample-outline.mjs')
    const { SAMPLE_STEPS } = await import('../../src/presentations/how-to-make-a-presentation/steps')
    const { PRESENTATIONS } = await import('../../src/presentations')
    expect(checkOutline({ registry: PRESENTATIONS, slug: SAMPLE_SLUG, steps: SAMPLE_STEPS, expected: NORMATIVE_OUTLINE })).toEqual([])
  })
})
