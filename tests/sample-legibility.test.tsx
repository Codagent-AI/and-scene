import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fitScale } from '../src/presentation-kit/useFitScale'
const css = readFileSync('src/presentations/how-to-make-a-presentation/style.css', 'utf8')
function fontSize(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = [...css.matchAll(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{[^}]*?font-size:\\s*(\\d+)px`, 'gm'))]
  return matches.length ? Number(matches[matches.length - 1][1]) : undefined
}
describe('reference sample legibility on a narrow viewport', () => {
  const narrow = fitScale(390, 844, 'browse')
  it('scales the canvas to roughly 0.4 at 390px wide', () => { expect(narrow).toBeGreaterThan(0.39); expect(narrow).toBeLessThan(0.41) })
  it('sizes primary diagram labels so they render at 7px or larger at that scale', () => {
    for (const selector of ['.entity b', '.card b', '.verify b']) expect(fontSize(selector)! * narrow, selector).toBeGreaterThanOrEqual(7)
  })
  it('keeps every other diagram label at 10px or larger inside the canvas', () => {
    for (const selector of ['.prompt', '.connection small', '.tray-label', '.card small', '.card span', '.ghost', '.depth', '.kit', '.modify', '.edited', '.reveal span', '.card-link']) expect(fontSize(selector), selector).toBeGreaterThanOrEqual(10)
  })
})
