import { describe, expect, it } from 'vitest'
import { presentations } from './index'
import { OUTLINE, SAMPLE_TITLE } from './how-to-make-a-presentation/steps/outline'
import { STEPS } from './how-to-make-a-presentation/steps'

describe('reference sample presentation contract', () => {
  it('is registered and follows the canonical nine-step outline', () => {
    expect(presentations).toContainEqual(expect.objectContaining({ slug: 'how-to-make-a-presentation', title: SAMPLE_TITLE }))
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ title, caption, section }) => ({ title, caption, era: section }))).toEqual(OUTLINE)
    expect(new Set(STEPS.map(step => step.id)).size).toBe(9)
    expect(STEPS.every(step => step.groupKey === STEPS[0].groupKey)).toBe(true)
  })
})
