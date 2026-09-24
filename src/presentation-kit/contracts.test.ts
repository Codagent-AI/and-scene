import { describe, expect, it } from 'vitest'
import { clampStepIndex, getFitScale } from './utils'
import { DEFAULT_ATTRIBUTION_URL, DESIGN_H, DESIGN_W } from './constants'
import type { Step } from './types'
import type { BoxProps } from './nodes/Box'

const requiredPayload: Step<{ message: string }> = {
  id: 'required-payload', era: 'Test', title: 'Test', caption: 'Test', Scene: () => null,
  payload: { message: 'present' },
}
// @ts-expect-error payload is mandatory when the scene requires a concrete payload type
const invalidMissingPayload: Step<{ message: string }> = {
  id: 'missing-payload', era: 'Test', title: 'Test', caption: 'Test', Scene: () => null,
}
const articleBox: BoxProps = { entityId: 'card', as: 'article' }
// @ts-expect-error Box keeps its public contract of omitting `id` in favor of `entityId`
const invalidBoxId: BoxProps = { entityId: 'card', id: 'card' }
void requiredPayload
void invalidMissingPayload
void articleBox
void invalidBoxId

describe('scene kit contracts', () => {
  it('clamps navigation at both ends', () => {
    expect(clampStepIndex(-1, 4)).toBe(0)
    expect(clampStepIndex(8, 4)).toBe(3)
  })

  it('uses uniform fit scaling and the reference canvas dimensions', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(getFitScale(440, 190)).toBe(0.5)
    expect(getFitScale(1760, 190)).toBe(0.5)
  })

  it('links attribution to the project without toolkit theme defaults', () => {
    expect(DEFAULT_ATTRIBUTION_URL).toBe('https://github.com/and-scene/and-scene')
  })
})
