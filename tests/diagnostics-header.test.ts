// @vitest-environment jsdom
// @ts-expect-error Node scripts are deliberately portable JavaScript.
import { afterEach, describe, expect, it } from 'vitest'
import { diagnose, readDiagnosticElements } from '../scripts/diagnostics.mjs'

const box = (left: number, top: number, right: number, bottom: number) =>
  ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON() {} }) as DOMRect
afterEach(() => { document.body.innerHTML = '' })

describe('chrome diagnostics geometry', () => {
  it('does not report a full-width header or title row as overlapping a separated mode button', () => {
    document.body.innerHTML = `<header data-presentation-header><span data-presentation-marker>01 / ask</span><div data-presentation-title>The title</div></header>
      <button data-presentation-mode-toggle aria-label="Switch to present mode">Present</button>
      <a data-presentation-attribution href="#">made by and-scene</a>`
    const rects = new Map<Element, DOMRect>([
      [document.querySelector('header')!, box(24, 24, 1416, 90)],
      [document.querySelector('[data-presentation-marker]')!, box(24, 24, 100, 44)],
      [document.querySelector('[data-presentation-title]')!, box(24, 50, 1416, 90)], // block spans the row
      [document.querySelector('[data-presentation-mode-toggle]')!, box(1320, 24, 1416, 56)],
      [document.querySelector('[data-presentation-attribution]')!, box(1200, 860, 1416, 880)],
    ])
    Element.prototype.getBoundingClientRect = function () { return rects.get(this) ?? box(0, 0, 0, 0) }
    const textRects = (node: Node) => {
      const owner = node.parentElement!
      if (owner.matches('[data-presentation-title]')) return [box(24, 50, 300, 90)] // drawn text only
      return [rects.get(owner)!]
    }
    Range.prototype.getClientRects = function () {
      const node = this.startContainer
      return (node.nodeType === Node.TEXT_NODE ? textRects(node) : []) as unknown as DOMRectList
    }
    const warnings = diagnose(readDiagnosticElements()).filter((warning) => warning.startsWith('overlap'))
    expect(warnings).toEqual([])
  })
})
