import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/presentations/how-to-make-a-presentation/talk.css', 'utf8')

const sizeOf = (selector: string): number => {
  const i = css.indexOf(selector)
  expect(i, selector).toBeGreaterThanOrEqual(0)
  const m = /font-size:\s*(\d+)px/.exec(css.slice(i, css.indexOf('}', i)))
  expect(m, `font-size for ${selector}`).not.toBeNull()
  return Number(m![1])
}

describe('sample typography (readable when the 880 × 380 canvas is scaled down)', () => {
  it('keeps scene text at or above 15 canvas px except the two slot-bound chips', () => {
    for (const sel of [
      "[data-presentation-node='box'] {",
      "[data-role='prompt'] {",
      "[data-role='ghost'] {",
      "[data-role='socket'] {",
      "[data-part='title'] {",
      "[data-part='check'] {",
      "[data-presentation-node='label'] {",
      "[data-presentation-node='chip'] {",
      '[data-presentation-frame-label] {',
    ]) expect(sizeOf(sel), sel).toBeGreaterThanOrEqual(15)
  })

  it('keeps the browse header title inside its 64px row on narrow screens', () => {
    const narrow = css.slice(css.indexOf('@media (max-width: 600px)'))
    expect(narrow).toContain('-webkit-line-clamp: 2')
    expect(narrow).toMatch(/font-size:\s*15px/)
  })
})
