import { describe, expect, it } from 'vitest'
import {
  attributionFindings,
  formatWarning,
  indistinctFrom,
  intersection,
  isBuildStale,
  overlapsSignificantly,
  parseArgs,
  parseViewport,
} from '../../../scripts/inspect-presentation.mjs'

// Pure diagnostic helpers behind scripts/inspect-presentation.mjs. The browser-backed
// behavior is covered by INT-002 in tests/integration.

describe('parseViewport', () => {
  it('reads WIDTHxHEIGHT', () => {
    expect(parseViewport('390x844')).toEqual({ width: 390, height: 844 })
  })

  it('rejects malformed or non-positive sizes', () => {
    expect(() => parseViewport('390')).toThrow(/WIDTHxHEIGHT/)
    expect(() => parseViewport('0x844')).toThrow(/WIDTHxHEIGHT/)
    expect(() => parseViewport('wide x tall')).toThrow(/WIDTHxHEIGHT/)
  })
})

describe('parseArgs', () => {
  it('defaults to the desktop viewport, a 1800ms settle, and the project artifact directory', () => {
    const options = parseArgs(['how-to-make-a-presentation'], {})
    expect(options.slug).toBe('how-to-make-a-presentation')
    expect(options.viewport).toEqual({ width: 1280, height: 800 })
    expect(options.settleMs).toBe(1800)
    expect(options.out).toBeUndefined()
    expect(options.rebuild).toBe(false)
  })

  it('treats --narrow as the 390x844 viewport', () => {
    expect(parseArgs(['deck', '--narrow'], {}).viewport).toEqual({ width: 390, height: 844 })
  })

  it('lets --settle override INSPECT_SETTLE_MS, which overrides the default', () => {
    expect(parseArgs(['deck', '--settle', '2500'], { INSPECT_SETTLE_MS: '900' }).settleMs).toBe(2500)
    expect(parseArgs(['deck'], { INSPECT_SETTLE_MS: '900' }).settleMs).toBe(900)
  })

  it('rejects a settle interval that is not a non-negative integer', () => {
    expect(() => parseArgs(['deck', '--settle', 'soon'], {})).toThrow(/--settle/)
    expect(() => parseArgs(['deck', '--settle', '-5'], {})).toThrow(/--settle/)
  })

  it('requires a slug unless --help is given', () => {
    expect(() => parseArgs([], {})).toThrow(/slug/)
    expect(parseArgs(['--help'], {}).help).toBe(true)
  })

  it('accepts --root, --base-url, --out, and --no-build', () => {
    const options = parseArgs(['deck', '--root', '/tmp/app', '--base-url', 'http://127.0.0.1:4000', '--out', '/tmp/out', '--no-build'], {})
    expect(options).toMatchObject({ root: '/tmp/app', baseUrl: 'http://127.0.0.1:4000', out: '/tmp/out', noBuild: true })
  })

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['deck', '--wide-open'], {})).toThrow(/--wide-open/)
  })
})

describe('intersection and overlap', () => {
  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
  })

  it('returns the shared rectangle', () => {
    expect(intersection(box(0, 0, 100, 50), box(80, 20, 100, 100))).toEqual({
      left: 80,
      top: 20,
      right: 100,
      bottom: 50,
    })
  })

  it('returns null for disjoint or edge-touching rectangles', () => {
    expect(intersection(box(0, 0, 100, 50), box(200, 0, 10, 10))).toBeNull()
    expect(intersection(box(0, 0, 100, 50), box(100, 0, 10, 10))).toBeNull()
  })

  it('ignores slivers below the significance threshold', () => {
    expect(overlapsSignificantly(box(0, 0, 100, 50), box(98, 0, 50, 50))).toBe(false)
    expect(overlapsSignificantly(box(0, 0, 100, 50), box(40, 10, 50, 50))).toBe(true)
  })
})

describe('indistinctFrom', () => {
  it('is true when the active signature matches any inactive sibling', () => {
    expect(indistinctFrom('color:red', ['color:blue', 'color:red'])).toBe(true)
  })

  it('is false when every inactive sibling differs', () => {
    expect(indistinctFrom('color:red', ['color:blue', 'color:green'])).toBe(false)
  })

  it('is false when there are no inactive siblings to compare', () => {
    expect(indistinctFrom('color:red', [])).toBe(false)
  })
})

describe('attributionFindings', () => {
  const defaults = { color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', fontSizePx: 16 }

  it('flags an attribution whose color, underline, and size match the browser default', () => {
    const findings = attributionFindings({
      color: 'rgb(0, 0, 238)',
      textDecorationLine: 'underline',
      fontSizePx: 16,
      tapHeightPx: 22,
      defaults,
    })
    expect(findings).toEqual(['browser-default'])
  })

  it('flags text below the minimum font size', () => {
    const findings = attributionFindings({
      color: 'rgb(10, 10, 10)',
      textDecorationLine: 'none',
      fontSizePx: 9,
      tapHeightPx: 22,
      defaults,
    })
    expect(findings).toEqual(['too-small'])
  })

  it('flags a tap target below the minimum height', () => {
    const findings = attributionFindings({
      color: 'rgb(10, 10, 10)',
      textDecorationLine: 'none',
      fontSizePx: 13,
      tapHeightPx: 12,
      defaults,
    })
    expect(findings).toEqual(['undersized'])
  })

  it('reports nothing for a deliberately styled, readable attribution', () => {
    const findings = attributionFindings({
      color: 'rgb(29, 36, 51)',
      textDecorationLine: 'underline',
      fontSizePx: 13,
      tapHeightPx: 23,
      defaults,
    })
    expect(findings).toEqual([])
  })
})

describe('isBuildStale', () => {
  it('is stale when there is no build output', () => {
    expect(isBuildStale([1_000], null)).toBe(true)
  })

  it('is stale when a source file is newer than the build', () => {
    expect(isBuildStale([1_000, 3_000], 2_000)).toBe(true)
  })

  it('is fresh when every source file predates the build', () => {
    expect(isBuildStale([1_000, 1_500], 2_000)).toBe(false)
  })
})

describe('formatWarning', () => {
  it('names the step, the check, and the detail on one line', () => {
    const line = formatWarning({
      kind: 'overlap',
      index: 1,
      stepCount: 4,
      detail: '"Alpha" overlaps "Beta"',
    })
    expect(line).toBe('warning [overlap] step index 1 (step 2 of 4): "Alpha" overlaps "Beta"')
  })
})
