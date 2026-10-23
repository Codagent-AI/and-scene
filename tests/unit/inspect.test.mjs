import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTLE_MS, VIEWPORTS, parseArguments } from '../../scripts/inspect-presentation.mjs'
import { inspectionDirectory, stepFileName } from '../../scripts/lib/paths.mjs'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants.ts'

describe('inspection options', () => {
  it('defaults to the desktop viewport and a settle interval longer than any entry', () => {
    const options = parseArguments(['sample'])
    expect(options).toEqual({ slug: 'sample', viewport: 'desktop', settleMs: DEFAULT_SETTLE_MS })
    // The constants are in seconds; the settle interval is in milliseconds.
    expect(DEFAULT_SETTLE_MS).toBeGreaterThanOrEqual((LAYOUT_T + ENTER_DELAY + ENTER_T) * 1000)
    expect(VIEWPORTS.desktop).toEqual({ width: 1440, height: 900 })
  })

  it('accepts the narrow viewport and a custom settle interval', () => {
    expect(parseArguments(['sample', '--narrow', '--settle', '250'])).toEqual({ slug: 'sample', viewport: 'narrow', settleMs: 250 })
    expect(VIEWPORTS.narrow).toEqual({ width: 390, height: 844 })
  })

  it('rejects a missing slug, an unknown option, and a bad settle value', () => {
    expect(() => parseArguments([])).toThrow(/usage/)
    expect(() => parseArguments(['sample', '--wide'])).toThrow(/unknown option/)
    expect(() => parseArguments(['sample', '--settle', '-5'])).toThrow(/non-negative/)
  })
})

describe('artifact paths', () => {
  it('writes one zero-padded file per step under a predictable project-local directory', () => {
    expect(inspectionDirectory('/repo', 'deck', 'desktop')).toBe('/repo/inspection/deck')
    expect(inspectionDirectory('/repo', 'deck', 'narrow')).toBe('/repo/inspection/deck-narrow')
    expect(stepFileName(0)).toBe('step-01.png')
    expect(stepFileName(11)).toBe('step-12.png')
  })
})
