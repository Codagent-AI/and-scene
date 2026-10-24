// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { collectSceneContent } from '../../scripts/lib/inspect-diagnostics.mjs'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('scene content sampling', () => {
  it('keys elements that share an entity id by DOM order so each is compared with itself', () => {
    document.body.innerHTML = '<div data-presentation-entity="x"></div><div data-presentation-entity="x"></div><div data-presentation-entity="y"></div>'
    expect(collectSceneContent().map((sample: { id: string }) => sample.id)).toEqual(['x', 'x#1', 'y'])
  })

  it('reports the opacity accumulated through ancestors', () => {
    document.body.innerHTML = '<div style="opacity:0.5"><div data-presentation-entity="a" style="opacity:0.5"></div></div>'
    expect(collectSceneContent()[0].opacity).toBeCloseTo(0.25)
  })
})
