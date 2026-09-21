import { isValidElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { Appear } from '../../presentation-kit'
import { ENTER_DELAY, LAYOUT_T } from '../../presentation-kit/constants'
import { ReferenceScene } from './scene'
import { referenceSteps } from './steps'

/** Entity ids in the tree that are not nested inside an `Appear`. */
function entitiesOutsideAppear(node: ReactNode, inAppear = false): string[] {
  if (!isValidElement(node)) return Array.isArray(node) ? node.flatMap((child) => entitiesOutsideAppear(child, inAppear)) : []
  const { entityId, children } = node.props as { entityId?: string; children?: ReactNode }
  const nested = inAppear || node.type === Appear
  const self = entityId && !nested ? [entityId] : []
  return [...self, ...entitiesOutsideAppear(children, nested)]
}

describe('reference scene newcomer entry', () => {
  it('delays newcomers until persisting entities have settled', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('wraps every entity introduced after the anchor in an Appear', () => {
    for (const step of referenceSteps) {
      expect(entitiesOutsideAppear(ReferenceScene({ payload: step.payload })), `step ${step.id}`)
        .toEqual(['reference:you'])
    }
  })
})
