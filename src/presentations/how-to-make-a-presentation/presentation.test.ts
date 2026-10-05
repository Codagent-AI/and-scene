/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./presentation.css', import.meta.url), 'utf8')
const narrowStart = css.indexOf('@media (max-width: 600px)')

describe('reference sample narrow-viewport styles', () => {
  it('declares the narrow media block after every base rule so its overrides apply', () => {
    expect(narrowStart).toBeGreaterThan(-1)
    const lastBaseRule = css.slice(0, narrowStart).trimEnd()
    expect(lastBaseRule.endsWith('}')).toBe(true)
    expect(css.slice(narrowStart).match(/@media/g)).toHaveLength(1)
    expect(css.slice(narrowStart)).toMatch(/\.sample-card__title \{ font-size: (\d+)px; \}/)
  })

  it('keeps primary card labels at a size that stays legible when the canvas scales to about 0.37', () => {
    const size = Number(/\.sample-card__title \{ font-size: (\d+)px; \}/.exec(css.slice(narrowStart))?.[1])
    expect(size * 0.37).toBeGreaterThanOrEqual(9)
  })
})
