import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ACTIVE_CHROME_PROPERTIES,
  ATTRIBUTION_MIN_FONT_PX,
  DEFAULT_LINK_COLOR,
  DEFAULT_SETTLE_MS,
  DEFAULT_VIEWPORT,
  OVERLAP_MIN_PX,
  attributionWarnings,
  diagnoseSnapshot,
  findOverlaps,
  formatWarning,
  indistinctActiveWarnings,
  isDefaultLinkLook,
  isDefaultSerif,
  parseArgs,
  parseSettle,
  parseViewport,
  rectsOverlap,
  styleDifferences,
  // The helper is plain .mjs with no declaration file, so its exports are untyped here.
} from '../../scripts/inspect-presentation.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
})
const desc = (id: string) => ({ tag: 'span', attrs: [`data-presentation-id="${id}"`], text: id })
const baseStyles = Object.fromEntries(ACTIVE_CHROME_PROPERTIES.map((k: string) => [k, 'x'])) as Record<string, string>
const attr = (styles: Record<string, string>) => ({ present: true, desc: desc('attr'), styles })
const polishedAttr = {
  fontSize: '13px',
  fontFamily: 'sans-serif',
  color: 'rgb(68, 68, 68)',
  textDecorationLine: 'none',
}

describe('parseViewport (L-43)', () => {
  it('parses WxH and accepts an uppercase separator', () => {
    expect(parseViewport('1440x900')).toEqual({ width: 1440, height: 900 })
    expect(parseViewport('800X600')).toEqual({ width: 800, height: 600 })
  })

  it.each(['', '1440', 'x900', '1440x', '0x900', '1440x0', '-1x900', '1.5x900', 'widexhigh', '1440x900x2'])(
    'rejects %j',
    (value) => {
      expect(() => parseViewport(value)).toThrow(/viewport/)
    },
  )

  it('defaults to 1440x900 when no viewport flag is given', () => {
    expect(DEFAULT_VIEWPORT).toEqual({ width: 1440, height: 900 })
    expect(parseArgs(['demo']).viewport).toEqual({ width: 1440, height: 900 })
  })

  it('forwards a parsed --viewport value in both flag forms', () => {
    expect(parseArgs(['demo', '--viewport', '900x800']).viewport).toEqual({ width: 900, height: 800 })
    expect(parseArgs(['demo', '--viewport=390x844']).viewport).toEqual({ width: 390, height: 844 })
  })
})

describe('parseSettle (L-60)', () => {
  it('defaults to 1200 ms and accepts valid overrides including 0', () => {
    expect(DEFAULT_SETTLE_MS).toBe(1200)
    expect(parseArgs(['demo']).settle).toBe(1200)
    expect(parseSettle('150')).toBe(150)
    expect(parseSettle('0')).toBe(0)
    expect(parseArgs(['demo', '--settle', '300']).settle).toBe(300)
  })

  it.each(['-1', '1.5', 'abc', '', '1e3', '12ms'])('rejects %j with a usage error', (value) => {
    expect(() => parseSettle(value)).toThrow(/settle/)
    expect(() => parseArgs(['demo', '--settle', value])).toThrow(/settle/)
  })
})

describe('parseArgs', () => {
  it('reads the slug, build flag and output directory', () => {
    const opts = parseArgs(['how-to', '--no-build', '--out', '/tmp/shots'])
    expect(opts.slug).toBe('how-to')
    expect(opts.build).toBe(false)
    expect(opts.outDir).toBe('/tmp/shots')
    expect(parseArgs(['demo']).outDir).toBe(join(ROOT, '.inspection'))
  })

  it.each([
    [[]],
    [['a', 'b']],
    [['Bad Slug']],
    [['demo', '--bogus']],
    [['demo', '--viewport']],
    [['demo', '--out', '--no-build']],
  ])('rejects %j', (argv) => {
    expect(() => parseArgs(argv)).toThrow()
  })
})

describe('rectsOverlap (L-61 geometry)', () => {
  const base = rect(0, 0, 100, 100)

  it('treats intersections of exactly 2 px as non-overlapping and above 2 px as overlapping', () => {
    expect(OVERLAP_MIN_PX).toBe(2)
    expect(rectsOverlap(base, rect(98, 10, 50, 20))).toBe(false)
    expect(rectsOverlap(base, rect(97.5, 10, 50, 20))).toBe(true)
    expect(rectsOverlap(base, rect(10, 98, 20, 50))).toBe(false)
    expect(rectsOverlap(base, rect(10, 97.5, 20, 50))).toBe(true)
  })

  it('requires the intersection to exceed the threshold on both axes', () => {
    expect(rectsOverlap(base, rect(50, 200, 50, 50))).toBe(false)
    expect(rectsOverlap(base, rect(10, 100, 50, 50))).toBe(false)
    expect(rectsOverlap(base, rect(10, 10, 50, 50))).toBe(true)
  })

  it('treats touching edges and disjoint boxes as non-overlapping', () => {
    expect(rectsOverlap(base, rect(100, 0, 50, 50))).toBe(false)
    expect(rectsOverlap(base, rect(300, 300, 10, 10))).toBe(false)
  })
})

describe('findOverlaps (L-61, L-62)', () => {
  const a = { desc: desc('a'), rect: rect(0, 0, 100, 40), hidden: false, allowOverlap: false }
  const b = { desc: desc('b'), rect: rect(10, 10, 100, 40), hidden: false, allowOverlap: false }

  it('reports an unmarked visible collision', () => {
    expect(findOverlaps([a, b])).toHaveLength(1)
  })

  it('ignores hidden elements', () => {
    expect(findOverlaps([a, { ...b, hidden: true }])).toEqual([])
  })

  it('ignores a pair when either side sits inside an allow-overlap subtree', () => {
    expect(findOverlaps([a, { ...b, allowOverlap: true }])).toEqual([])
    expect(findOverlaps([{ ...a, allowOverlap: true }, b])).toEqual([])
  })

  it('still reports an unmarked pair beside a marked pair', () => {
    const marked = [
      { ...a, allowOverlap: true },
      { ...b, allowOverlap: true },
    ]
    const c = { desc: desc('c'), rect: rect(0, 0, 50, 50), hidden: false, allowOverlap: false }
    const d = { desc: desc('d'), rect: rect(5, 5, 50, 50), hidden: false, allowOverlap: false }
    expect(findOverlaps([...marked, c, d])).toHaveLength(1)
  })
})

describe('styleDifferences and indistinct active chrome (L-63)', () => {
  it('reports no difference for identical computed styles', () => {
    expect(styleDifferences(baseStyles, { ...baseStyles })).toEqual([])
  })

  it.each([...ACTIVE_CHROME_PROPERTIES])('detects a difference in %s alone', (property) => {
    const active = { ...baseStyles, [property]: 'changed' }
    expect(styleDifferences(active, baseStyles)).toEqual([property])
  })

  it('covers each border side, outline, shadow, opacity, weight, decoration and transform', () => {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      expect(ACTIVE_CHROME_PROPERTIES).toEqual(
        expect.arrayContaining([`border${side}Color`, `border${side}Width`, `border${side}Style`]),
      )
    }
    expect(ACTIVE_CHROME_PROPERTIES).toEqual(
      expect.arrayContaining([
        'color',
        'backgroundColor',
        'outlineStyle',
        'outlineWidth',
        'outlineColor',
        'boxShadow',
        'opacity',
        'fontWeight',
        'textDecorationLine',
        'transform',
      ]),
    )
  })

  const group = (activeStyles: Record<string, string>, inactiveStyles: Record<string, string>) => [
    { desc: desc('active'), active: true, hidden: false, styles: activeStyles },
    { desc: desc('idle'), active: false, hidden: false, styles: inactiveStyles },
  ]

  it('warns naming the active chrome when it matches an inactive sibling', () => {
    const messages = indistinctActiveWarnings([group(baseStyles, { ...baseStyles })])
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('data-presentation-id="active"')
  })

  it('does not warn once any single property differs', () => {
    for (const property of ACTIVE_CHROME_PROPERTIES) {
      expect(indistinctActiveWarnings([group({ ...baseStyles, [property]: 'changed' }, baseStyles)])).toEqual([])
    }
  })

  it('ignores hidden active items', () => {
    const hiddenActive = [
      { desc: desc('active'), active: true, hidden: true, styles: baseStyles },
      { desc: desc('idle'), active: false, hidden: false, styles: baseStyles },
    ]
    expect(indistinctActiveWarnings([hiddenActive])).toEqual([])
  })
})

describe('attributionWarnings (L-64)', () => {
  it('reports a missing attribution naming the hook', () => {
    const [message] = attributionWarnings({ present: false, desc: null, styles: null })
    expect(message).toContain('data-presentation-attribution')
  })

  it('accepts a font size of exactly 11 px and warns just below it', () => {
    expect(ATTRIBUTION_MIN_FONT_PX).toBe(11)
    expect(attributionWarnings(attr({ ...polishedAttr, fontSize: '11px' }))).toEqual([])
    expect(attributionWarnings(attr({ ...polishedAttr, fontSize: '10.99px' }))).toHaveLength(1)
    expect(attributionWarnings(attr({ ...polishedAttr, fontSize: '10px' }))[0]).toContain('font-size 10px')
  })

  it('flags the default blue underlined link only when both colour and underline match', () => {
    expect(DEFAULT_LINK_COLOR).toBe('rgb(0, 0, 238)')
    expect(isDefaultLinkLook({ color: DEFAULT_LINK_COLOR, textDecorationLine: 'underline' })).toBe(true)
    expect(isDefaultLinkLook({ color: DEFAULT_LINK_COLOR, textDecorationLine: 'none' })).toBe(false)
    expect(isDefaultLinkLook({ color: 'rgb(1, 2, 3)', textDecorationLine: 'underline' })).toBe(false)
    expect(attributionWarnings(attr({ ...polishedAttr, color: DEFAULT_LINK_COLOR, textDecorationLine: 'underline' })))
      .toHaveLength(1)
    expect(attributionWarnings(attr({ ...polishedAttr, color: DEFAULT_LINK_COLOR, textDecorationLine: 'none' })))
      .toEqual([])
  })

  it('flags the browser-default serif only as the first family', () => {
    expect(isDefaultSerif('"Times New Roman", serif')).toBe(true)
    expect(isDefaultSerif('Times')).toBe(true)
    expect(isDefaultSerif('serif')).toBe(true)
    expect(isDefaultSerif('Georgia, Times New Roman, serif')).toBe(false)
    expect(isDefaultSerif('sans-serif')).toBe(false)
    expect(attributionWarnings(attr({ ...polishedAttr, fontFamily: '"Times New Roman", serif' }))).toHaveLength(1)
    expect(attributionWarnings(attr(polishedAttr))).toEqual([])
  })

  it('reports each defect separately and names the hook in each', () => {
    const messages = attributionWarnings(
      attr({ fontSize: '9px', fontFamily: 'serif', color: DEFAULT_LINK_COLOR, textDecorationLine: 'underline' }),
    )
    expect(messages).toHaveLength(3)
    for (const message of messages) expect(message).toContain('data-presentation-attribution')
  })
})

describe('diagnoseSnapshot and formatWarning', () => {
  it('formats warning lines with the step number and kind', () => {
    expect(formatWarning(3, 'overlap', 'x')).toBe('warning: step 3: overlap: x')
  })

  it('turns a snapshot into one overlap diagnostic for an unmarked pair only', () => {
    const snapshot = {
      overlapItems: [
        { desc: desc('one'), rect: rect(0, 0, 50, 50), hidden: false, allowOverlap: false },
        { desc: desc('two'), rect: rect(10, 10, 50, 50), hidden: false, allowOverlap: false },
        { desc: desc('ok'), rect: rect(400, 0, 50, 50), hidden: false, allowOverlap: false },
      ],
      chromeGroups: [],
      attribution: attr(polishedAttr),
    }
    const diagnostics = diagnoseSnapshot(snapshot)
    expect(diagnostics.map((d: { kind: string }) => d.kind)).toEqual(['overlap'])
    expect(diagnostics[0].message).toContain('data-presentation-id="one"')
    expect(diagnostics[0].message).toContain('data-presentation-id="two"')
  })
})

describe('file and manifest contract (L-44)', () => {
  it('ships the helper at the project root and wires the inspect npm script to it', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(pkg.scripts.inspect).toBe('node scripts/inspect-presentation.mjs')
    const source = readFileSync(join(ROOT, 'scripts/inspect-presentation.mjs'), 'utf8')
    expect(source).not.toMatch(/['"`](?:\/workspace|\/artifacts|\/home|\/ms-playwright|\/Users|\/usr\/local)\b/)
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1])
    for (const specifier of imports) {
      expect(specifier.startsWith('node:') || specifier === 'playwright').toBe(true)
    }
  })

  it('runs main only when executed directly (usage error exits 2 without a browser)', () => {
    let status = 0
    try {
      execFileSync(process.execPath, [join(ROOT, 'scripts/inspect-presentation.mjs')], { stdio: 'pipe' })
    } catch (err) {
      status = (err as { status: number }).status
    }
    expect(status).toBe(2)
  })
})
