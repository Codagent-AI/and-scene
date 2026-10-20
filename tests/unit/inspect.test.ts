import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTLE_MS, DEFAULT_VIEWPORT, InspectError, attributionIssue, diagnose, findOverlaps, inspect,
  isActiveIndistinct, isBrowserDefaultLink, parseArgs, screenshotPath,
} from '../../scripts/inspect-presentation.mjs'
import { repoRoot } from './helpers.ts'

describe('argument parsing', () => {
  it('defaults to a 1440x900 desktop viewport and an 800ms settle', () => {
    expect(parseArgs(['demo'])).toEqual({ slug: 'demo', viewport: { width: 1440, height: 900 }, settleMs: 800, build: true })
    expect(DEFAULT_VIEWPORT).toEqual({ width: 1440, height: 900 })
    expect(DEFAULT_SETTLE_MS).toBe(800)
  })

  it('accepts a viewport and a settle override', () => {
    const o = parseArgs(['demo', '--viewport', '390x844', '--settle', '1500', '--skip-build'])
    expect(o).toEqual({ slug: 'demo', viewport: { width: 390, height: 844 }, settleMs: 1500, build: false })
  })

  it.each([
    [[], /usage/],
    [['a', '--viewport', '12'], /WxH/],
    [['a', '--settle', 'soon'], /milliseconds/],
    [['a', '--nope'], /unknown option/],
    [['a', 'b'], /unexpected argument/],
  ])('rejects %j', (argv, message) => {
    expect(() => parseArgs(argv)).toThrow(message)
    expect(() => parseArgs(argv)).toThrow(InspectError)
  })

  it('writes one predictable, 1-based, zero-padded file per step under inspection/<slug>/', () => {
    expect(screenshotPath('/p', 'demo', 0)).toBe('/p/inspection/demo/step-01.png')
    expect(screenshotPath('/p', 'demo', 11)).toBe('/p/inspection/demo/step-12.png')
  })
})

const el = (id: number, x: number, y: number, w: number, h: number, extra: object = {}) => ({
  id,
  label: `<p> "el${id}"`,
  rect: { x, y, w, h },
  visible: true,
  allowOverlap: false,
  ancestors: [],
  ...extra,
})

describe('overlap detection', () => {
  it('reports intersecting visible elements and names both', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 40), el(2, 50, 20, 100, 40)])).toEqual([['<p> "el1"', '<p> "el2"']])
  })

  it('ignores separated, merely touching, hidden, and zero-size elements', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 40), el(2, 100, 0, 50, 40), el(3, 0, 41, 50, 10)])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 100, 40), el(2, 10, 10, 50, 10, { visible: false })])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 100, 40), el(2, 10, 10, 0, 0)])).toEqual([])
  })

  it('exempts pairs where either side is inside an allow-overlap subtree', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 40, { allowOverlap: true }), el(2, 50, 20, 100, 40)])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 100, 40), el(2, 50, 20, 100, 40, { allowOverlap: true })])).toEqual([])
  })

  it('does not let one exemption silence unrelated collisions', () => {
    const found = findOverlaps([
      el(1, 0, 0, 100, 40, { allowOverlap: true }),
      el(2, 50, 20, 100, 40, { allowOverlap: true }),
      el(3, 300, 0, 100, 40),
      el(4, 320, 10, 100, 40),
    ])
    expect(found).toEqual([['<p> "el3"', '<p> "el4"']])
  })

  it('ignores a parent and its own descendant', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 40), el(2, 5, 5, 20, 10, { ancestors: [1] })])).toEqual([])
  })
})

const style = (over: Record<string, string | number> = {}) => ({
  color: 'rgb(10, 10, 10)', backgroundColor: 'rgb(0, 0, 0)', borderColor: 'rgb(1, 1, 1)', borderWidth: '1px',
  opacity: '1', width: '12', height: '12', fontWeight: '400', textDecorationLine: 'none', boxShadow: 'none',
  outlineStyle: 'none', fontSize: 14, ...over,
})

describe('active chrome', () => {
  it('flags an active control identical to every inactive one', () => {
    expect(isActiveIndistinct(style(), [style(), style()])).toBe(true)
  })
  it.each([
    ['color', { color: 'rgb(255, 0, 0)' }],
    ['background', { backgroundColor: 'rgb(255, 180, 84)' }],
    ['border', { borderColor: 'rgb(9, 9, 9)' }],
    ['opacity', { opacity: '0.4' }],
    ['size', { width: '28' }],
  ])('accepts a distinct %s', (_n, over) => {
    expect(isActiveIndistinct(style(over), [style(), style()])).toBe(false)
  })
  it('does not flag when there are no inactive entries to compare', () => {
    expect(isActiveIndistinct(style(), [])).toBe(false)
  })
})

describe('attribution', () => {
  const polished = style({ fontSize: 13, color: 'rgb(183, 194, 214)', textDecorationLine: 'underline' })

  it('is polished when legible and styled', () => {
    expect(attributionIssue(polished)).toBeUndefined()
  })
  it('flags text below 11px', () => {
    expect(attributionIssue({ ...polished, fontSize: 9 })).toMatch(/9px, below 11px/)
    expect(attributionIssue({ ...polished, fontSize: 11 })).toBeUndefined()
  })
  it('flags the browser-default link style even at a legible size', () => {
    const dflt = { ...polished, fontSize: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' }
    expect(isBrowserDefaultLink(dflt)).toBe(true)
    expect(attributionIssue(dflt)).toMatch(/browser-default/)
    expect(isBrowserDefaultLink({ ...dflt, color: 'rgb(1, 2, 3)' })).toBe(false)
    expect(isBrowserDefaultLink({ ...dflt, textDecorationLine: 'none' })).toBe(false)
  })
  it('flags a missing attribution link without crashing', () => {
    expect(attributionIssue(null)).toMatch(/missing/)
  })
})

describe('diagnose', () => {
  const clean = {
    elements: [],
    active: { progress: { active: style({ width: '28' }), inactive: [style()] } },
    attribution: style({ fontSize: 13, color: 'rgb(1, 2, 3)' }),
  }
  it('is silent for a clean step', () => {
    expect(diagnose(clean)).toEqual([])
  })
  it('names the overlap, the chrome, and the styling hook to fix', () => {
    const warnings = diagnose({
      elements: [el(1, 0, 0, 50, 50), el(2, 10, 10, 50, 50)],
      active: {
        progress: { active: style(), inactive: [style()] },
        'table-of-contents': { active: style(), inactive: [style()] },
      },
      attribution: style({ fontSize: 8 }),
    })
    expect(warnings).toHaveLength(4)
    expect(warnings[0]).toMatch(/overlap between .*el1.* and .*el2.*data-presentation-allow-overlap/)
    expect(warnings[1]).toMatch(/active progress entry.*data-presentation-progress-item/)
    expect(warnings[2]).toMatch(/active table-of-contents entry.*data-presentation-toc-item/)
    expect(warnings[3]).toMatch(/8px.*\[data-presentation-attribution\]/)
  })
  it('points at the attribution hook when the link is missing', () => {
    expect(diagnose({ ...clean, attribution: null })[0]).toMatch(/missing.*data-presentation-attribution/)
  })
})

describe('operational failures are distinct from advisory warnings', () => {
  function fixtureRoot(registry: string, vite?: string) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'inspect-unit-'))
    mkdirSync(path.join(root, 'src/presentations'), { recursive: true })
    writeFileSync(path.join(root, 'src/presentations/index.ts'), registry)
    if (vite) {
      mkdirSync(path.join(root, 'node_modules/vite/bin'), { recursive: true })
      writeFileSync(path.join(root, 'node_modules/vite/bin/vite.js'), vite)
      for (const pkg of ['playwright', 'playwright-core']) {
        symlinkSync(path.join(repoRoot, 'node_modules', pkg), path.join(root, 'node_modules', pkg))
      }
    }
    return root
  }
  const cli = (root: string, args: string[]) => {
    // Run the real script against a copy of the repo-shaped fixture.
    const dir = path.join(root, 'scripts')
    mkdirSync(dir, { recursive: true })
    for (const f of ['verify.mjs', 'inspect-presentation.mjs']) {
      writeFileSync(path.join(dir, f), readFileSync(path.join(repoRoot, 'scripts', f)))
    }
    return spawnSync(process.execPath, [path.join(dir, 'inspect-presentation.mjs'), ...args], { encoding: 'utf8', cwd: os.tmpdir() })
  }

  it('rejects an unknown slug with an actionable error', async () => {
    const root = fixtureRoot("export const presentations = [{ slug: 'known', title: 'K', load: () => import('./k') }]")
    await expect(inspect(root, ['nope', '--skip-build'], () => {})).rejects.toThrow(/unknown presentation "nope"; registered: known/)
    const r = cli(root, ['nope', '--skip-build'])
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('ERROR: unknown presentation "nope"')
  })

  it('exits non-zero when the preview never becomes ready, without capturing anything', () => {
    const root = fixtureRoot("export const presentations = [{ slug: 'known', title: 'K', load: () => import('./k') }]", 'process.exit(1)')
    const r = cli(root, ['known', '--skip-build'])
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/exited before it was ready/)
    expect(r.stdout).not.toContain('captured')
  })

  it('exits non-zero on a usage error', () => {
    const r = cli(fixtureRoot('export const presentations = []'), [])
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/usage/)
  })
})
