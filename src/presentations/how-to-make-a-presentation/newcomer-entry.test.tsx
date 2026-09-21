import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ENTER_DELAY, LAYOUT_T } from '../../presentation-kit/constants'
import { ReferenceScene } from './scene'
import { referenceSteps } from './steps'

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input'])

/** Entity ids in `html` that are not nested inside an `Appear` wrapper. */
function entitiesOutsideAppear(html: string): string[] {
  const outside: string[] = []
  const stack: boolean[] = []
  for (const [, closing, tag, attrs] of html.matchAll(/<(\/?)([a-z]+)([^>]*)>/g)) {
    if (closing) { stack.pop(); continue }
    const entityId = attrs.match(/data-entity-id="([^"]+)"/)?.[1]
    if (entityId && !stack.some(Boolean)) outside.push(entityId)
    if (!VOID_TAGS.has(tag)) stack.push(attrs.includes('data-scene-node="appear"'))
  }
  return outside
}

describe('reference scene newcomer entry', () => {
  it('delays newcomers until persisting entities have settled', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('wraps every entity introduced after the anchor in an Appear', () => {
    for (const step of referenceSteps) {
      const html = renderToStaticMarkup(<ReferenceScene payload={step.payload} />)
      expect(entitiesOutsideAppear(html), `step ${step.id}`).toEqual(['reference:you'])
    }
  })
})
