import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { computeFitScale } from '../../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../../src/presentation-kit/constants'

const SAMPLE_CSS = readFileSync(
  join(import.meta.dirname, '..', '..', 'src', 'presentations', 'how-to-make-a-presentation', 'talk.css'),
  'utf8',
)

/** Smallest rendered scene text (px) the sample should reach on a phone-width viewport. */
const MIN_RENDERED_PX = 8
const PHONE = { width: 390, height: 844 }

/** font-size (px) declared by each scene-entity rule, keyed by its selectors. */
function entityFontSizes(css: string): Array<{ selectors: string; px: number }> {
  const found: Array<{ selectors: string; px: number }> = []
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/\.talk-/.test(selectors)) continue
    const size = /font-size:\s*(\d+(?:\.\d+)?)px/.exec(body)
    if (size) found.push({ selectors: selectors.trim(), px: Number(size[1]) })
  }
  return found
}

describe('sample legibility on a narrow viewport', () => {
  const scale = computeFitScale(PHONE, STAGE_LAYOUT.browse)

  it('scales the canvas by the width of the phone, not by the viewport height', () => {
    expect(scale).toBeCloseTo((PHONE.width - STAGE_LAYOUT.browse.padding * 2) / DESIGN_W, 3)
    expect(DESIGN_H * scale).toBeLessThan(PHONE.height)
  })

  it('declares a font size for scene entities', () => {
    expect(entityFontSizes(SAMPLE_CSS).length).toBeGreaterThan(0)
  })

  it('keeps every scene text size readable once the canvas is scaled to a phone', () => {
    for (const { selectors, px } of entityFontSizes(SAMPLE_CSS)) {
      expect(px * scale, selectors).toBeGreaterThanOrEqual(MIN_RENDERED_PX)
    }
  })

  it('removes the default body margin so the canvas can use the phone width', () => {
    expect(SAMPLE_CSS).toMatch(/body:has\(\[data-presentation-root\]\)\s*\{[^}]*margin:\s*0/)
  })
})
