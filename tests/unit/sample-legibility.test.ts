import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('reference sample legibility', () => {
  it('keeps in-canvas diagram text large enough to stay legible when the canvas scales down', () => {
    // The 880 x 380 canvas is scaled to about 0.39 on a 390 px wide viewport, so canvas text
    // below 14 px would render at roughly 5 px there.
    const css = readFileSync(
      join(__dirname, '..', '..', 'src/presentations/how-to-make-a-presentation/style.css'),
      'utf8',
    )
    const scene = css.slice(css.indexOf('/* scene */'))
    const sizes = [...scene.matchAll(/font-size:\s*([\d.]+)(px|rem)/g)]
    expect(sizes.length).toBeGreaterThan(0)
    for (const [, value, unit] of sizes) {
      expect(unit).toBe('px')
      expect(Number(value)).toBeGreaterThanOrEqual(14)
    }
  })
})
