import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, getFitScale, getNavigationTarget } from '../index'
import type { Step } from '../types'

describe('presentation kit contract', () => {
  it('uses the reference fixed canvas dimensions', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('clamps navigation at both ends without wrapping', () => {
    expect(getNavigationTarget(0, 'previous', 3)).toBe(0)
    expect(getNavigationTarget(2, 'next', 3)).toBe(2)
    expect(getNavigationTarget(1, 'next', 3)).toBe(2)
    expect(getNavigationTarget(1, 'previous', 3)).toBe(0)
  })

  it('fits the fixed canvas uniformly for each mode', () => {
    expect(getFitScale(1760, 940, 'present')).toBe(2)
    expect(getFitScale(440, 380, 'browse')).toBeGreaterThan(0)
  })

  it('keeps typed grouped payloads at the presentation boundary', () => {
    type Payload = { entityIds: string[] }
    const scene = ({ payload }: { payload: Payload }) => payload.entityIds.join(',')
    const steps: Step<Payload>[] = [
      {
        id: 'start',
        section: 'Beginning',
        title: 'Start',
        caption: 'The first state.',
        groupKey: 'story',
        scene,
        payload: { entityIds: ['one'] },
      },
    ]

    const typedBoundary: Step<Payload>[] = steps
    expect(typedBoundary[0].payload.entityIds).toEqual(['one'])
  })
})
