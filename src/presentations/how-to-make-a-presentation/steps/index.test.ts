import { describe, expect, it } from 'vitest'
import CANONICAL_STEPS from '../canonical-outline.json'
import { STEPS } from './index'

describe('how-to-make-a-presentation STEPS', () => {
  it('implements exactly the nine canonical steps in order', () => {
    expect(STEPS).toHaveLength(9)
  })

  it('matches every canonical era, title, and caption in order', () => {
    STEPS.forEach((step, index) => {
      const canonical = CANONICAL_STEPS[index]
      expect(step.era).toBe(canonical.era)
      expect(step.title).toBe(canonical.title)
      expect(step.caption).toBe(canonical.caption)
    })
  })

  it('accumulates as one continuously evolving scene: every step after the first shares a groupKey with its predecessor', () => {
    for (let index = 1; index < STEPS.length; index += 1) {
      expect(STEPS[index].groupKey).toBeDefined()
      expect(STEPS[index].groupKey).toBe(STEPS[index - 1].groupKey)
    }
  })
})
