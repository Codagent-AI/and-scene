// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SAMPLE_CSS = path.resolve(import.meta.dirname, '../../src/presentations/how-to-make-a-presentation/talk.css')

describe('reference sample readability', () => {
  it('keeps diagram text large enough to stay readable at a phone-width canvas scale', () => {
    // The 880px canvas renders at ~0.39 on a 390px viewport; 21px stays above 8px.
    const css = fs.readFileSync(SAMPLE_CSS, 'utf8')
    const scene = css.slice(css.indexOf('/* ---- scene entities ---- */'), css.indexOf('@media'))
    const sizes = [...scene.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
    expect(sizes.length).toBeGreaterThan(5)
    for (const px of sizes) expect(px).toBeGreaterThanOrEqual(21)
  })
})
