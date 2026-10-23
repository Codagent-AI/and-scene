// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collectPageDiagnostics } from '../../scripts/lib/collect.mjs'

// jsdom has no layout, so each fixture element declares its rectangle as data-rect="x,y,w,h".
const originalRect = Element.prototype.getBoundingClientRect
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function rect() {
    const [x = 0, y = 0, width = 0, height = 0] = (this.getAttribute('data-rect') ?? '').split(',').map(Number)
    return { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height, toJSON() {} }
  }
})
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  document.body.innerHTML = ''
})

function mount(html) {
  document.body.innerHTML = `<section data-presentation-root="">${html}</section>`
}

describe('collectPageDiagnostics', () => {
  it('returns null when no presentation is mounted', () => {
    expect(collectPageDiagnostics()).toBeNull()
  })

  it('collects visible text items and excludes content inside an allow-overlap subtree', () => {
    mount(`
      <p data-rect="0,0,50,20">alpha</p>
      <p data-rect="20,5,50,20">beta</p>
      <div data-presentation-allow-overlap="" data-rect="0,0,100,100">
        <span data-rect="5,5,40,20">inside</span>
      </div>
    `)
    const { items } = collectPageDiagnostics()
    const labels = items.map((entry) => entry.label)
    expect(labels).toEqual(expect.arrayContaining(['p "alpha"', 'p "beta"']))
    expect(labels.some((label) => label.includes('inside'))).toBe(false)
  })

  it('records containment so a container and its child are not reported as a collision', () => {
    mount(`
      <div data-presentation-entity="card" data-rect="0,0,100,100"><span data-rect="10,10,60,20">title</span></div>
    `)
    const { items } = collectPageDiagnostics()
    const child = items.find((entry) => entry.label.includes('title'))
    const card = items.find((entry) => entry.label === 'card')
    expect(card).toBeUndefined()
    expect(child.ancestors).toEqual([])
  })

  it('ignores hidden and empty text', () => {
    mount(`<p data-rect="0,0,0,0">zero</p><p data-rect="0,0,50,20" style="visibility:hidden">hidden</p><p data-rect="0,0,50,20">  </p>`)
    expect(collectPageDiagnostics().items).toEqual([])
  })

  it('captures active and inactive chrome styles and attribution', () => {
    mount(`
      <button data-presentation-progress="" data-presentation-active="true" style="color: rgb(1, 2, 3)"></button>
      <button data-presentation-progress="" style="color: rgb(9, 9, 9)"></button>
      <a data-presentation-attribution="" style="font-size: 14px">made by and-scene</a>
    `)
    const diagnostics = collectPageDiagnostics()
    expect(diagnostics.progress.active.color).toBe('rgb(1, 2, 3)')
    expect(diagnostics.progress.inactive.color).toBe('rgb(9, 9, 9)')
    expect(diagnostics.toc).toBeNull()
    expect(diagnostics.attribution).toMatchObject({ present: true, fontSizePx: 14 })
  })

  it('reports a missing attribution without failing', () => {
    mount('<p data-rect="0,0,1,1">text</p>')
    expect(collectPageDiagnostics().attribution).toEqual({ present: false, fontSizePx: 0, color: '' })
  })

  it('includes textless chrome controls so a collision with an empty progress dot is reported', async () => {
    mount(`
      <button data-presentation-progress="" data-rect="0,0,10,10"></button>
      <p data-rect="4,2,60,20">caption text</p>
    `)
    const { items } = collectPageDiagnostics()
    const dot = items.find((entry) => entry.label.startsWith('button'))
    expect(dot).toBeDefined()
    const { overlapWarnings } = await import('../../scripts/lib/diagnostics.mjs')
    const warnings = overlapWarnings(3, items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('step 3')
  })
})
