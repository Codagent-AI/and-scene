import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'

const root = join(import.meta.dirname, '..')
describe('reference presentation contract', () => {
  it('contains and registers the canonical nine-step sample in order', async () => {
    const registry = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
    const expectedTitles = [
      'You have a topic',
      'The skill interviews you',
      'Answers become steps',
      'The deck grows',
      'You set the depth',
      'It assembles the scene',
      'It checks its own work',
      'Changed your mind? Loop it.',
      "You're looking at one",
    ]

    expect(registry).toContain("slug: 'how-to-make-a-presentation'")
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((step) => step.title)).toEqual(expectedTitles)
    expect(STEPS.every((step) => step.groupKey === 'how-to-evolving-scene')).toBe(true)
    expect(STEPS.every((step) => step.caption.length > 0 && step.era.length > 0)).toBe(true)
  })
})
