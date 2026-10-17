import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W } from '../../src/presentation-kit/constants.ts'
import { CARD_SIZE, CARD_SLOTS, CARD_TOP, GHOST, RECT } from '../../src/presentations/how-to-make-a-presentation/entities.ts'

const css = readFileSync('src/presentations/how-to-make-a-presentation/talk.css', 'utf8')

/** In-canvas text is scaled by ~0.39 on a 390px viewport, so design-unit sizes need a floor. */
const MIN_SCENE_FONT_PX = 15

describe('sample scene legibility at narrow viewports', () => {
  it('keeps every in-canvas font size at or above the floor', () => {
    const sceneRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) => /\.htm \.(entity|step-card|verify-checks)/.test(selector))
    const sizes = sceneRules.flatMap(([, selector, body]) => [...body.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => ({ selector: selector.trim(), px: Number(m[1]) })))
    expect(sizes.length).toBeGreaterThan(10)
    for (const { selector, px } of sizes) expect(px, selector).toBeGreaterThanOrEqual(MIN_SCENE_FONT_PX)
  })

  it('keeps every entity rectangle inside the design canvas', () => {
    const rects = [...Object.values(RECT), GHOST, ...CARD_SLOTS.map((left) => ({ left, top: CARD_TOP, ...CARD_SIZE }))]
    for (const { left, top, width, height } of rects) {
      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(left + width).toBeLessThanOrEqual(DESIGN_W)
      expect(top + height).toBeLessThanOrEqual(DESIGN_H)
    }
  })
})
